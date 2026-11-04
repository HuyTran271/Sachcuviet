
import express from 'express';
import User from '../models/User.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Xem danh sách User
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password');

        res.json({
            message: 'Lấy danh sách người dùng thành công',
            users
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Xem chi tiết User
router.get('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            message: 'Lấy thông tin người dùng thành công',
            user
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Khóa / mở khóa User
router.put('/users/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'locked'].includes(status)) {
            return res.status(400).json({
                message: 'Trạng thái không hợp lệ'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            message: status === 'locked'
                ? 'Đã khóa tài khoản'
                : 'Đã mở khóa tài khoản',
            user
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Xóa User
router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            message: 'Xóa người dùng thành công'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

export default router;
