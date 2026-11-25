import Category from '../models/Category.js';
import Product from '../models/Product.js';

// @desc  Lấy danh sách danh mục
// @method GET
// @endpoint /api/categories
// @access Public
const listCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json({ success: true, categories });
    } catch (error) {
        next(error);
    }
};

// @desc  Tạo danh mục mới
// @method POST
// @endpoint /api/categories
// @access Private/Admin
const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body || {};

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên danh mục.' });
        }

        const existed = await Category.findOne({ name: name.trim() });
        if (existed) {
            return res.status(409).json({ message: 'Tên danh mục đã tồn tại.' });
        }

        const category = await Category.create({
            name: name.trim(),
            description: typeof description === 'string' ? description : ''
        });

        res.status(201).json({ success: true, message: 'Tạo danh mục thành công.', category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Tên danh mục đã tồn tại.' });
        }
        next(error);
    }
};

// @desc  Cập nhật danh mục
// @method PUT
// @endpoint /api/categories/:id
// @access Private/Admin
const updateCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body || {};

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
        }

        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ message: 'Tên danh mục không hợp lệ.' });
            }
            const existed = await Category.findOne({ name: name.trim(), _id: { $ne: category._id } });
            if (existed) {
                return res.status(409).json({ message: 'Tên danh mục đã tồn tại.' });
            }
            category.name = name.trim();
        }

        if (description !== undefined) {
            if (typeof description !== 'string') {
                return res.status(400).json({ message: 'Mô tả danh mục không hợp lệ.' });
            }
            category.description = description;
        }

        await category.save();
        res.json({ success: true, message: 'Cập nhật danh mục thành công.', category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Tên danh mục đã tồn tại.' });
        }
        next(error);
    }
};

// @desc  Xóa danh mục (chặn nếu còn sản phẩm dùng danh mục đó)
// @method DELETE
// @endpoint /api/categories/:id
// @access Private/Admin
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
        }

        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            return res.status(409).json({ message: 'Không thể xóa danh mục vì vẫn còn sản phẩm thuộc danh mục này.' });
        }

        await category.deleteOne();
        res.json({ success: true, message: 'Xóa danh mục thành công.' });
    } catch (error) {
        next(error);
    }
};

export {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
