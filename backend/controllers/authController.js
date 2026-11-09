import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';

// @desc  Auth user & get token
// @method POST
// @endpoint /api/auth/login
// @access Public

const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: 'Vui lòng cung cấp đầy đủ thông tin: email và mật khẩu.',
        });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            message: 'Địa chỉ email không hợp lệ. Vui lòng nhập một email hợp lệ.',
        });
    }
    if (password.length < 6) {
        return res.status(400).json({
            message: 'Mật khẩu phải có ít nhất 6 ký tự.',
        });
    }
    const normalizedEmail = email.toLowerCase();
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                message: 'Email hoặc mật khẩu không chính xác. Xin vui lòng kiểm tra và nhập lại.',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: 'Email hoặc mật khẩu không chính xác. Xin vui lòng kiểm tra và nhập lại',
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
            }); 
        }

        generateToken(res, user);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        next(error);
    }
};

// @desc  Register
// @method POST
// @endpoint /api/auth/register
// @access Public

const registerUser = async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({
            message: 'Vui lòng cung cấp đầy đủ thông tin: tên, email và mật khẩu.',
        });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            message: 'Địa chỉ email không hợp lệ. Vui lòng nhập một email hợp lệ.',
        });
    }
    if (password.length < 6) {
        return res.status(400).json({
            message: 'Mật khẩu phải có ít nhất 6 ký tự.',
        });
    }
    const normalizedEmail = email.toLowerCase();
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return res.status(409).json({
                message: 'Người dùng đã tồn tại. Xin vui lòng thử lại.',
            });
        }

        const user = await User.create({
            name,
            email,
            password
        });

        generateToken(res, user);

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
// @endpoint /api/auth/logout
// @access Private

const logoutUser = async (req, res, next) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });
    res.status(200).json({ message: 'Đăng xuất thành công' });
};

export {
    loginUser,
    registerUser,
    logoutUser,
};
