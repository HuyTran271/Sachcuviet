import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// @desc  Auth user & get token
// @method POST
// @endpoint /api/users/login
// @access Public

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: 'Email không chính xác. Xin vui lòng kiểm tra và nhập lại.',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: 'Mật khẩu không chính xác. Xin vui lòng kiểm tra và nhập lại',
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
            }); 
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'sachcuviet_super_secret_jwt_key_2026',
            { expiresIn: '1h' }
        );

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 60 * 60 * 1000
        });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });
    } catch (error) {
        next(error);
    }
};

// @desc  Register
// @method POST
// @endpoint /api/users/register
// @access Public

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(409).json({
                message: 'Người dùng đã tồn tại. Xin vui lòng sử dụng email khác.',
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashPassword,
        });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'sachcuviet_super_secret_jwt_key_2026',
            { expiresIn: '1h' }
        );

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 60 * 60 * 1000
        });

        res.status(201).json({
            message: 'Đăng ký người dùng thành công',
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
        });
    } catch (error) {
        next(error);
    }
};

// @desc  Logout user & clear cookies
// @method POST 
// @endpoint /api/users/logout
// @access Private

const logoutUser = async (req, res, next) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc  Get user profile (User access test)
// @method GET
// @endpoint /api/users/profile
// @access Private (protect)

const getUserProfile = async (req, res) => {
    res.json({
        success: true,
        message: 'Xác thực người dùng thành công (Role: User/Admin)',
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        }
    });
};

// @desc  Get admin dashboard data (Admin access test)
// @method GET
// @endpoint /api/users/admin-dashboard
// @access Private (protect, admin)

const getAdminDashboard = async (req, res) => {
    res.json({
        success: true,
        message: 'Xác thực Quản trị viên (Admin) thành công! Bạn có toàn quyền quản lý hệ thống.',
        admin: {
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        },
        stats: {
            totalBooks: 1250,
            activeOrders: 48,
            registeredUsers: 340,
            systemStatus: 'Operational'
        }
    });
};

export {
    loginUser,
    registerUser,
    logoutUser,
    getUserProfile,
    getAdminDashboard,
};
