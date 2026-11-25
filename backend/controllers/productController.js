import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Shop from '../models/Shop.js';

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const collectBodyImages = (body) => {
    if (!body) return [];
    if (typeof body.images === 'string' && body.images.trim()) return [body.images.trim()];
    if (Array.isArray(body.images)) return body.images.filter((url) => typeof url === 'string' && url.trim());
    return [];
};

const isAdmin = (req) => req.user && req.user.role === 'admin';

// @desc  Lấy danh sách sản phẩm (tìm kiếm, lọc, phân trang)
// @method GET
// @endpoint /api/products
// @access Public
const listProducts = async (req, res, next) => {
    try {
        const { q, category, minPrice, maxPrice, condition, shop } = req.query;

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));

        const filter = {};

        // Người thường chỉ thấy sản phẩm active; admin thấy tất cả
        if (!isAdmin(req)) {
            filter.status = 'active';
        }

        if (q && typeof q === 'string' && q.trim()) {
            const regex = new RegExp(escapeRegExp(q.trim()), 'i');
            filter.$or = [{ name: regex }, { author: regex }];
        }

        if (category) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({ message: 'Danh mục không hợp lệ.' });
            }
            filter.category = category;
        }

        if (shop) {
            if (!mongoose.Types.ObjectId.isValid(shop)) {
                return res.status(400).json({ message: 'Gian hàng không hợp lệ.' });
            }
            filter.shop = shop;
        }

        let min = null;
        let max = null;
        if (minPrice !== undefined && minPrice !== '') {
            min = Number(minPrice);
            if (Number.isNaN(min) || min < 0) {
                return res.status(400).json({ message: 'Giá tối thiểu không hợp lệ.' });
            }
            filter.price = { ...filter.price, $gte: min };
        }
        if (maxPrice !== undefined && maxPrice !== '') {
            max = Number(maxPrice);
            if (Number.isNaN(max) || max < 0) {
                return res.status(400).json({ message: 'Giá tối đa không hợp lệ.' });
            }
            filter.price = { ...filter.price, $lte: max };
        }
        if (min !== null && max !== null && min > max) {
            return res.status(400).json({ message: 'Giá tối thiểu không được lớn hơn giá tối đa.' });
        }

        if (condition) {
            if (!['new', 'used'].includes(condition)) {
                return res.status(400).json({ message: 'Tình trạng sản phẩm không hợp lệ.' });
            }
            filter.condition = condition;
        }

        const total = await Product.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const products = await Product.find(filter)
            .populate('category', 'name')
            .populate('shop', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ products, page, totalPages, total });
    } catch (error) {
        next(error);
    }
};

// @desc  Lấy sản phẩm theo id
// @method GET
// @endpoint /api/products/:id
// @access Public
const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate({ path: 'shop', populate: { path: 'owner', select: 'name' } });
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }
        if (!isAdmin(req) && product.status !== 'active') {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }
        res.json({ success: true, product });
    } catch (error) {
        next(error);
    }
};

// @desc  Tạo sản phẩm mới
// @method POST
// @endpoint /api/products
// @access Private (protect)
const createProduct = async (req, res, next) => {
    try {
        // Yêu cầu user đã có shop active của mình
        const shop = await Shop.findOne({ owner: req.user._id, status: 'active' });
        if (!shop) {
            return res.status(403).json({ message: 'Bạn cần có shop đang hoạt động để đăng sản phẩm.' });
        }

        const { name, category, description, price, stock, condition, author } = req.body || {};

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên sản phẩm.' });
        }
        if (!description || typeof description !== 'string' || !description.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập mô tả sản phẩm.' });
        }
        if (!category || !mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({ message: 'Danh mục không hợp lệ.' });
        }
        if (price === undefined || price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
            return res.status(400).json({ message: 'Giá sản phẩm phải là số và lớn hơn hoặc bằng 0.' });
        }
        if (stock === undefined || stock === '' || Number.isNaN(Number(stock)) || Number(stock) < 0) {
            return res.status(400).json({ message: 'Số lượng tồn kho phải là số và lớn hơn hoặc bằng 0.' });
        }
        if (condition !== undefined && condition !== '' && !['new', 'used'].includes(condition)) {
            return res.status(400).json({ message: 'Tình trạng sản phẩm phải là new hoặc used.' });
        }
        if (author !== undefined && typeof author !== 'string') {
            return res.status(400).json({ message: 'Tác giả không hợp lệ.' });
        }

        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
        }

        const uploadedImages = (req.files || []).map((file) => `/uploads/${file.filename}`);
        const images = [...uploadedImages, ...collectBodyImages(req.body)];

        const product = await Product.create({
            name: name.trim(),
            category,
            shop: shop._id,
            description: description.trim(),
            price: Number(price),
            stock: Number(stock),
            images,
            condition: condition || 'new',
            author: author ? author.trim() : ''
        });

        res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công.', product });
    } catch (error) {
        next(error);
    }
};

// Kiểm tra quyền chủ shop của sản phẩm; trả về { product, shop } hoặc null sau khi đã gửi lỗi
const getOwnedProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        return null;
    }
    const shop = await Shop.findById(product.shop);
    if (!shop || shop.owner.toString() !== req.user._id.toString()) {
        res.status(403).json({ message: 'Bạn không có quyền thao tác với sản phẩm này.' });
        return null;
    }
    return { product, shop };
};

// @desc  Cập nhật sản phẩm (chỉ chủ shop)
// @method PUT
// @endpoint /api/products/:id
// @access Private (protect)
const updateProduct = async (req, res, next) => {
    try {
        const owned = await getOwnedProduct(req, res);
        if (!owned) return;
        const { product } = owned;
        // C2: seller KHONG duoc doi status. Status chi admin duoc doi qua
        // PUT /api/admin/products/:id/status, neu de seller doi o day
        // thi seller tu mo lai san pham admin vua an. Field status gui
        // kem se bi bo qua (cac field khac van cap nhat binh thuong).
        const { name, category, description, price, stock, condition, author } = req.body || {};

        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ message: 'Tên sản phẩm không hợp lệ.' });
            }
            product.name = name.trim();
        }
        if (description !== undefined) {
            if (typeof description !== 'string' || !description.trim()) {
                return res.status(400).json({ message: 'Mô tả sản phẩm không hợp lệ.' });
            }
            product.description = description.trim();
        }
        if (category !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({ message: 'Danh mục không hợp lệ.' });
            }
            const categoryDoc = await Category.findById(category);
            if (!categoryDoc) {
                return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
            }
            product.category = category;
        }
        if (price !== undefined) {
            if (Number.isNaN(Number(price)) || Number(price) < 0) {
                return res.status(400).json({ message: 'Giá sản phẩm phải là số và lớn hơn hoặc bằng 0.' });
            }
            product.price = Number(price);
        }
        if (stock !== undefined) {
            if (Number.isNaN(Number(stock)) || Number(stock) < 0) {
                return res.status(400).json({ message: 'Số lượng tồn kho phải là số và lớn hơn hoặc bằng 0.' });
            }
            product.stock = Number(stock);
        }
        if (condition !== undefined) {
            if (!['new', 'used'].includes(condition)) {
                return res.status(400).json({ message: 'Tình trạng sản phẩm phải là new hoặc used.' });
            }
            product.condition = condition;
        }
        if (author !== undefined) {
            if (typeof author !== 'string') {
                return res.status(400).json({ message: 'Tác giả không hợp lệ.' });
            }
            product.author = author.trim();
        }

        const uploadedImages = (req.files || []).map((file) => `/uploads/${file.filename}`);
        const bodyImages = collectBodyImages(req.body);
        if (uploadedImages.length > 0 || bodyImages.length > 0) {
            product.images = [...uploadedImages, ...bodyImages];
        }

        await product.save();
        res.json({ success: true, message: 'Cập nhật sản phẩm thành công.', product });
    } catch (error) {
        next(error);
    }
};

// @desc  Xóa sản phẩm thật (chỉ chủ shop)
// @method DELETE
// @endpoint /api/products/:id
// @access Private (protect)
const deleteProduct = async (req, res, next) => {
    try {
        const owned = await getOwnedProduct(req, res);
        if (!owned) return;
        await owned.product.deleteOne();
        res.json({ success: true, message: 'Xóa sản phẩm thành công.' });
    } catch (error) {
        next(error);
    }
};

export {
    listProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
