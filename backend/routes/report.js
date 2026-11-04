
import express from 'express';
import User from '../models/User.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// API thống kê người dùng
router.get('/', protect, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        const activeUsers = await User.countDocuments({
            status: 'active'
        });

        const lockedUsers = await User.countDocuments({
            status: 'locked'
        });

        const adminUsers = await User.countDocuments({
            role: 'admin'
        });

        res.json({
            message: 'Thống kê người dùng thành công',
            totalUsers,
            activeUsers,
            lockedUsers,
            adminUsers
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

export default router;
