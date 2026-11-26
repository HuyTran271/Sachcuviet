import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import IdempotencyKey from '../models/IdempotencyKey.js';

const PAYMENT_METHODS = ['COD', 'bank_transfer'];

// Thu tu chuyen trang thai hop le
const ALLOWED_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipping', 'cancelled'],
    shipping: ['delivered'],
    delivered: [],
    cancelled: [],
};

// Lay id cac shop ma user dang dang nhap dang so huu
const getMyShopIds = async (userId) => {
    const shops = await Shop.find({ owner: userId }).select('_id');
    return shops.map((shop) => String(shop._id));
};

// Loi co status HTTP, dung de tra 400/409... tu ben trong transaction
// hoac buoc xu ly ma khong the res truc tiep.
const httpError = (status, message) => {
    const error = new Error(message);
    error.statusCode = status;
    return error;
};

// Phat hien 1 lan xem MongoDB co ho tro transaction khong (can replica set
// hoac sharded cluster). Ket qua duoc cache theo process vi topology
// khong doi khi server dang chay. Neu MongoDB la standalone thi tra false
// va createOrder dung duong fallback (tru kho nguyen tu + boi thuong).
let txSupportedCache;
const transactionsSupported = () => {
    if (txSupportedCache !== undefined) return txSupportedCache;
    try {
        const type = mongoose.connection?.client?.topology?.description?.type;
        txSupportedCache =
            type === 'ReplicaSetWithPrimary' ||
            type === 'ReplicaSetNoPrimary' ||
            type === 'Sharded';
    } catch {
        txSupportedCache = false;
    }
    return txSupportedCache;
};

// Tru kho nguyen tu co dieu kien: chi tru khi kho con du.
// Tra ve document sau khi tru, hoac null neu khong du kho.
const decrementStock = (productId, quantity, session) =>
    Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { session, returnDocument: 'after' }
    );

// Tao don trong transaction: tru kho + tao don + xoa gio la mot khoi
// nguyen tu, buoc nao loi thi tat ca rollback.
const createOrderInTransaction = async (userId, orderData, checkedItems) => {
    const session = await mongoose.startSession();
    try {
        let createdOrder = null;
        await session.withTransaction(async () => {
            for (const { product, quantity } of checkedItems) {
                const updated = await decrementStock(product._id, quantity, session);
                if (!updated) {
                    throw httpError(400, `Sản phẩm "${product.name}" không đủ tồn kho.`);
                }
            }

            createdOrder = new Order({ user: userId, ...orderData });
            await createdOrder.save({ session });

            const orderedProductIds = checkedItems.map(({ product }) => product._id);
            await Cart.updateOne(
                { user: userId },
                { $pull: { items: { product: { $in: orderedProductIds } } } },
                { session }
            );
        });
        return createdOrder;
    } finally {
        await session.endSession();
    }
};

// Fallback khi MongoDB la standalone (khong co transaction).
// Tru kho nguyen tu co dieu kien van chan duoc ban vuot kho va kho am;
// neu buoc tao don loi sau khi da tru kho thi hoan lai kho da tru.
// Xoa gio la buoc phu: loi o day khong duoc lam hong don da tao.
const createOrderWithCompensation = async (userId, orderData, checkedItems) => {
    const decremented = [];
    try {
        for (const { product, quantity } of checkedItems) {
            const updated = await decrementStock(product._id, quantity, undefined);
            if (!updated) {
                throw httpError(400, `Sản phẩm "${product.name}" không đủ tồn kho.`);
            }
            decremented.push({ productId: product._id, quantity });
        }

        const createdOrder = await Order.create({ user: userId, ...orderData });

        try {
            const orderedProductIds = checkedItems.map(({ product }) => product._id);
            await Cart.updateOne(
                { user: userId },
                { $pull: { items: { product: { $in: orderedProductIds } } } }
            );
        } catch (cartError) {
            console.error('Khong xoa duoc gio sau khi tao don:', cartError.message);
        }

        return createdOrder;
    } catch (error) {
        await Promise.all(
            decremented.map(({ productId, quantity }) =>
                Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }).catch(() => {})
            )
        );
        throw error;
    }
};

// Dinh danh noi dung don de so sanh khi cung Idempotency-Key gui lai.
// Items da gop theo product va sap xep theo id de dang chuan tac khong
// phu thuoc thu tu client gui.
const computeOrderFingerprint = (userId, mergedItems, address, paymentMethod) => {
    const canonical = {
        user: String(userId),
        items: [...mergedItems]
            .map(({ product, quantity }) => ({ product: String(product), quantity }))
            .sort((a, b) => (a.product < b.product ? -1 : a.product > b.product ? 1 : 0)),
        address,
        paymentMethod,
    };
    return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
};

// @desc  Tao don hang tu danh sach san pham
// @method POST
// @endpoint /api/orders
// @access Private (protect)
// Luu y: gop cac dong trung product truoc khi kiem tra kho; tru kho bang
// update nguyen tu co dieu kien; tao don + tru kho + xoa gio chay trong
// 1 transaction neu MongoDB ho tro, neu khong thi dung fallback co boi thuong.
const createOrder = async (req, res, next) => {
    try {
        const { items, address, paymentMethod } = req.body || {};

        if (!address || typeof address !== 'string' || !address.trim()) {
            return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ giao hàng.' });
        }
        if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
            return res.status(400).json({ message: 'Phương thức thanh toán phải là COD hoặc bank_transfer.' });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một sản phẩm để đặt hàng.' });
        }

        // Gop cac dong trung product: [{p, 3}, {p, 3}] thanh [{p, 6}]
        // truoc khi kiem tra kho, de tong so luong moi la so bi kiem tra.
        const mergedQuantities = new Map();
        for (const item of items) {
            if (!item || !item.product) {
                return res.status(400).json({ message: 'Mỗi sản phẩm trong đơn hàng phải có id sản phẩm.' });
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                return res.status(400).json({ message: 'Số lượng mỗi sản phẩm phải là số nguyên lớn hơn hoặc bằng 1.' });
            }
            const key = String(item.product);
            mergedQuantities.set(key, (mergedQuantities.get(key) || 0) + item.quantity);
        }
        const mergedItems = [...mergedQuantities.entries()].map(([product, quantity]) => ({
            product,
            quantity,
        }));

        // Buoc 1: kiem tra tat ca san pham, chua thay doi gi ca
        const checkedItems = [];
        for (const { product: productId, quantity } of mergedItems) {
            const foundProduct = await Product.findById(productId);
            if (!foundProduct) {
                return res.status(404).json({ message: `Không tìm thấy sản phẩm: ${productId}.` });
            }
            if (foundProduct.status !== 'active') {
                return res.status(400).json({ message: `Sản phẩm "${foundProduct.name}" hiện không khả dụng.` });
            }
            if (quantity > foundProduct.stock) {
                return res.status(400).json({ message: `Sản phẩm "${foundProduct.name}" không đủ tồn kho (còn ${foundProduct.stock} sản phẩm).` });
            }

            checkedItems.push({ product: foundProduct, quantity });
        }

        // Buoc 2: snapshot thong tin san pham vao don, tinh tong tien
        const orderItems = checkedItems.map(({ product, quantity }) => ({
            product: product._id,
            shop: product.shop,
            productName: product.name,
            price: product.price,
            quantity,
            subtotal: product.price * quantity,
        }));
        const totalPrice = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        const orderData = {
            items: orderItems,
            totalPrice,
            address: address.trim(),
            paymentMethod,
            paymentStatus: 'unpaid',
            status: 'pending',
        };

        // N2: Idempotency-Key. Claim key bang unique index TRUOC khi tao don:
        // request nao thang claim thi chay tiep, request cung key den sau
        // gap 11000 roi xu ly theo trang thai ban ghi da co.
        const idempotencyKey = req.headers['idempotency-key'];
        let idempotencyRecord = null;
        if (idempotencyKey !== undefined) {
            if (
                typeof idempotencyKey !== 'string' ||
                !idempotencyKey.trim() ||
                idempotencyKey.length > 255
            ) {
                return res.status(400).json({ message: 'Idempotency-Key không hợp lệ.' });
            }
            const fingerprint = computeOrderFingerprint(
                req.user._id,
                mergedItems,
                address.trim(),
                paymentMethod
            );
            try {
                idempotencyRecord = await IdempotencyKey.create({
                    key: idempotencyKey.trim(),
                    user: req.user._id,
                    fingerprint,
                    status: 'in_progress',
                });
            } catch (claimError) {
                if (claimError.code === 11000) {
                    const existing = await IdempotencyKey.findOne({
                        key: idempotencyKey.trim(),
                        user: req.user._id,
                    });
                    if (!existing) {
                        return res.status(409).json({ message: 'Đơn hàng đang được xử lý, vui lòng thử lại sau.' });
                    }
                    if (existing.fingerprint !== fingerprint) {
                        return res.status(422).json({ message: 'Idempotency-Key đã được dùng với nội dung đơn hàng khác.' });
                    }
                    if (existing.status === 'completed') {
                        return res.status(existing.responseStatus || 201).json(existing.responseBody);
                    }
                    return res.status(409).json({ message: 'Đơn hàng đang được xử lý, vui lòng thử lại sau.' });
                }
                throw claimError;
            }
        }

        // Buoc 3: tao don + tru kho + xoa gio, nguyen tu
        let order;
        try {
            order = transactionsSupported()
                ? await createOrderInTransaction(req.user._id, orderData, checkedItems)
                : await createOrderWithCompensation(req.user._id, orderData, checkedItems);
        } catch (flowError) {
            // Don chua tao xong: xoa ban ghi claim de client retry cung key duoc.
            if (idempotencyRecord) {
                await IdempotencyKey.deleteOne({ _id: idempotencyRecord._id }).catch(() => {});
            }
            throw flowError;
        }

        let populatedOrder;
        try {
            populatedOrder = await order.populate('items.product', 'name images');
        } catch {
            populatedOrder = order;
        }

        // Ghi lai response de request cung key sau nay replay dung ket qua cu.
        if (idempotencyRecord) {
            await IdempotencyKey.updateOne(
                { _id: idempotencyRecord._id },
                { status: 'completed', responseStatus: 201, responseBody: populatedOrder.toJSON() }
            ).catch((e) => console.error('Khong luu duoc idempotency record:', e.message));
        }

        res.status(201).json(populatedOrder);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        next(error);
    }
};

// @desc  Lay cac don hang cua minh (moi nhat truoc)
// @method GET
// @endpoint /api/orders/my
// @access Private (protect)
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product', 'name images');
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc  Lay chi tiet mot don hang
// @method GET
// @endpoint /api/orders/:id
// @access Private (protect) - chi chu don, seller co shop trong don, hoac admin
const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.product', 'name images');

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }

        const isOwner = String(order.user._id || order.user) === String(req.user._id);
        const isAdmin = req.user.role === 'admin';
        let isSeller = false;
        if (!isOwner && !isAdmin) {
            const myShopIds = await getMyShopIds(req.user._id);
            isSeller = order.items.some((item) => myShopIds.includes(String(item.shop)));
        }

        if (!isOwner && !isAdmin && !isSeller) {
            return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này.' });
        }

        res.json(order);
    } catch (error) {
        next(error);
    }
};

// @desc  Lay cac don hang co san pham thuoc shop cua minh
// @method GET
// @endpoint /api/orders/seller
// @access Private (protect)
const getSellerOrders = async (req, res, next) => {
    try {
        const myShopIds = await getMyShopIds(req.user._id);
        if (myShopIds.length === 0) {
            return res.json([]);
        }

        const orders = await Order.find({ 'items.shop': { $in: myShopIds } })
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.product', 'name images price');
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// Huy don va hoan kho mot lan duy nhat. Claim chuyen trang thai bang
// dieu kien status cu de hai request huy dong thoi khong cung hoan kho.
const cancelOrderWithStockRestore = async (order, previousStatus) => {
    const restoreStock = async (session) => {
        for (const item of order.items) {
            await Product.updateOne(
                { _id: item.product },
                { $inc: { stock: item.quantity } },
                { session }
            );
        }
    };

    if (transactionsSupported()) {
        const session = await mongoose.startSession();
        try {
            let claimedOrder = null;
            await session.withTransaction(async () => {
                claimedOrder = await Order.findOneAndUpdate(
                    { _id: order._id, status: previousStatus },
                    { $set: { status: 'cancelled' } },
                    { session, returnDocument: 'after' }
                );
                if (!claimedOrder) {
                    throw httpError(409, 'Đơn hàng đã thay đổi trạng thái, vui lòng tải lại.');
                }
                await restoreStock(session);
            });
            return claimedOrder;
        } finally {
            await session.endSession();
        }
    }

    const claimedOrder = await Order.findOneAndUpdate(
        { _id: order._id, status: previousStatus },
        { $set: { status: 'cancelled' } },
        { returnDocument: 'after' }
    );
    if (!claimedOrder) {
        throw httpError(409, 'Đơn hàng đã thay đổi trạng thái, vui lòng tải lại.');
    }

    const restored = [];
    try {
        for (const item of order.items) {
            await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
            restored.push(item);
        }
        return claimedOrder;
    } catch (error) {
        await Promise.all(
            restored.map((item) =>
                Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } }).catch(() => {})
            )
        );
        await Order.updateOne(
            { _id: order._id, status: 'cancelled' },
            { $set: { status: previousStatus } }
        ).catch(() => {});
        throw error;
    }
};

// @desc  Cap nhat trang thai don hang
// @method PUT
// @endpoint /api/orders/:id/status
// @access Private (protect) - seller chi duoc doi don co shop cua minh, admin duoc doi moi don
// Thu tu hop le: pending -> confirmed -> shipping -> delivered,
// hoac pending/confirmed -> cancelled. Chuyen nguoc hoac tu delivered/cancelled thi 400.
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body || {};

        if (!status || !Object.keys(ALLOWED_TRANSITIONS).includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ (pending, confirmed, shipping, delivered, cancelled).' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }

        const isAdmin = req.user.role === 'admin';
        if (!isAdmin) {
            const myShopIds = await getMyShopIds(req.user._id);
            const hasMyShop = order.items.some((item) => myShopIds.includes(String(item.shop)));
            if (!hasMyShop) {
                return res.status(403).json({ message: 'Bạn không có quyền cập nhật đơn hàng này.' });
            }
        }

        const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];
        if (!allowedNext.includes(status)) {
            return res.status(400).json({
                message: `Không thể chuyển đơn hàng từ "${order.status}" sang "${status}". Trạng thái tiếp theo hợp lệ: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'không còn trạng thái nào'}.`,
            });
        }

        const updatedOrder = status === 'cancelled'
            ? await cancelOrderWithStockRestore(order, order.status)
            : await Order.findByIdAndUpdate(
                order._id,
                { $set: { status } },
                { returnDocument: 'after' }
            );

        const populatedOrder = await updatedOrder.populate('items.product', 'name images');
        res.json(populatedOrder);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        next(error);
    }
};

export {
    createOrder,
    getMyOrders,
    getOrderById,
    getSellerOrders,
    updateOrderStatus,
    transactionsSupported,
};
