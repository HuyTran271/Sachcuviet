import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// @desc  Lay gio hang cua minh (tao gio rong neu chua co)
// @method GET
// @endpoint /api/cart
// @access Private (protect)
const getMyCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price stock images status shop');

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
            cart = await cart.populate('items.product', 'name price stock images status shop');
        }

        res.json(cart);
    } catch (error) {
        next(error);
    }
};

// @desc  Them san pham vao gio hang
// @method POST
// @endpoint /api/cart
// @access Private (protect)
const addToCart = async (req, res, next) => {
    try {
        const { product, quantity } = req.body || {};

        if (!product) {
            return res.status(400).json({ message: 'Vui lòng cung cấp id sản phẩm.' });
        }
        if (quantity === undefined || quantity === null || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ message: 'Số lượng phải là số nguyên lớn hơn hoặc bằng 1.' });
        }

        const foundProduct = await Product.findById(product);
        if (!foundProduct) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }
        if (foundProduct.status !== 'active') {
            return res.status(400).json({ message: 'Sản phẩm hiện không khả dụng.' });
        }
        if (quantity > foundProduct.stock) {
            return res.status(400).json({ message: `Số lượng vượt quá tồn kho (còn ${foundProduct.stock} sản phẩm).` });
        }

        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        const existingItem = cart.items.find(
            (item) => String(item.product) === String(foundProduct._id)
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > foundProduct.stock) {
                return res.status(400).json({ message: `Số lượng vượt quá tồn kho (còn ${foundProduct.stock} sản phẩm).` });
            }
            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({ product: foundProduct._id, quantity });
        }

        await cart.save();
        await cart.populate('items.product', 'name price stock images status shop');

        res.status(201).json(cart);
    } catch (error) {
        next(error);
    }
};

// @desc  Cap nhat so luong mot san pham trong gio (quantity 0 thi xoa khoi gio)
// @method PUT
// @endpoint /api/cart/:productId
// @access Private (protect)
const updateCartItem = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body || {};

        if (quantity === undefined || quantity === null || !Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({ message: 'Số lượng phải là số nguyên lớn hơn hoặc bằng 0.' });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Không tìm thấy giỏ hàng.' });
        }

        const item = cart.items.find((entry) => String(entry.product) === String(productId));
        if (!item) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng.' });
        }

        // quantity = 0: xoa khoi gio, khong can kiem tra stock
        if (quantity === 0) {
            cart.items = cart.items.filter((entry) => String(entry.product) !== String(productId));
            await cart.save();
            await cart.populate('items.product', 'name price stock images status shop');
            return res.json(cart);
        }

        const foundProduct = await Product.findById(productId);
        if (!foundProduct) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }
        if (foundProduct.status !== 'active') {
            return res.status(400).json({ message: 'Sản phẩm hiện không khả dụng.' });
        }
        if (quantity > foundProduct.stock) {
            return res.status(400).json({ message: `Số lượng vượt quá tồn kho (còn ${foundProduct.stock} sản phẩm).` });
        }

        item.quantity = quantity;
        await cart.save();
        await cart.populate('items.product', 'name price stock images status shop');

        res.json(cart);
    } catch (error) {
        next(error);
    }
};

// @desc  Xoa mot san pham khoi gio hang
// @method DELETE
// @endpoint /api/cart/:productId
// @access Private (protect)
const removeCartItem = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Không tìm thấy giỏ hàng.' });
        }

        const item = cart.items.find((entry) => String(entry.product) === String(productId));
        if (!item) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng.' });
        }

        cart.items = cart.items.filter((entry) => String(entry.product) !== String(productId));
        await cart.save();
        await cart.populate('items.product', 'name price stock images status shop');

        res.json(cart);
    } catch (error) {
        next(error);
    }
};

// @desc  Xoa toan bo gio hang
// @method DELETE
// @endpoint /api/cart
// @access Private (protect)
const clearCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
            cart = await cart.populate('items.product', 'name price stock images status shop');
            return res.json(cart);
        }

        cart.items = [];
        await cart.save();
        await cart.populate('items.product', 'name price stock images status shop');

        res.json(cart);
    } catch (error) {
        next(error);
    }
};

export {
    getMyCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
};
