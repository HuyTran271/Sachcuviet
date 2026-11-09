import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const protect = async (req, res, next) => {
    try {
        let token = req.cookies?.jwt;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Xác thực thất bại. Không có token được cung cấp.' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'sachcuviet_super_secret_jwt_key_2026');

        if (!decodedToken) {
            return res.status(401).json({ message: 'Xác thực thất bại. Token không hợp lệ.' });
        }

        req.user = await User.findById(decodedToken.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Xác thực thất bại. Người dùng không tồn tại.' });
        }

        if (req.user.status !== 'active') {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.' });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Xác thực thất bại: ' + (error.message || 'Token không hợp lệ hoặc đã hết hạn')
        });
    }
};

const admin = (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Xác thực thất bại: Không được xác thực là admin'
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

export { protect, admin };