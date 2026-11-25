import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Tat ca ham trong file nay deu yeu cau protect + admin (dat o route).

// @desc  Lay danh sach tat ca user (moi nhat truoc, khong tra password)
// @method GET
// @endpoint /api/admin/users
// @access Private (admin)
const listUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 }).select('-password');
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc  Khoa / mo khoa tai khoan user
// @method PUT
// @endpoint /api/admin/users/:id/status
// @access Private (admin)
// Luu y: admin khong duoc tu khoa chinh minh.
const updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body || {};

        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ (active hoặc inactive).' });
        }

        if (String(req.params.id) === String(req.user._id) && status === 'inactive') {
            return res.status(403).json({ message: 'Bạn không thể tự khóa tài khoản của mình.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        user.status = status;
        await user.save();

        const updatedUser = await User.findById(user._id).select('-password');
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

// @desc  Lay danh sach tat ca san pham (ke ca inactive)
// @method GET
// @endpoint /api/admin/products
// @access Private (admin)
const listProducts = async (req, res, next) => {
    try {
        const products = await Product.find({})
            .sort({ createdAt: -1 })
            .populate('category', 'name')
            .populate('shop', 'name owner');
        res.json(products);
    } catch (error) {
        next(error);
    }
};

// @desc  An / hien san pham (vi pham)
// @method PUT
// @endpoint /api/admin/products/:id/status
// @access Private (admin)
const updateProductStatus = async (req, res, next) => {
    try {
        const { status } = req.body || {};

        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ (active hoặc inactive).' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }

        product.status = status;
        await product.save();

        res.json(product);
    } catch (error) {
        next(error);
    }
};

// @desc  Xoa that mot san pham
// @method DELETE
// @endpoint /api/admin/products/:id
// @access Private (admin)
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }

        await product.deleteOne();

        res.json({ message: 'Xóa sản phẩm thành công.' });
    } catch (error) {
        next(error);
    }
};

// @desc  Lay danh sach tat ca don hang
// @method GET
// @endpoint /api/admin/orders
// @access Private (admin)
const listOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.product', 'name images');
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

export {
    listUsers,
    updateUserStatus,
    listProducts,
    updateProductStatus,
    deleteProduct,
    listOrders,
};
