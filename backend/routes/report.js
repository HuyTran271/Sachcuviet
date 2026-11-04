
const express = require("express");
const User = require("../models/user");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Kiểm tra quyền Admin
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Bạn không có quyền Admin"
        });
    }

    next();
};

// API thống kê người dùng
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        const activeUsers = await User.countDocuments({
            status: "active"
        });

        const lockedUsers = await User.countDocuments({
            status: "locked"
        });

        const adminUsers = await User.countDocuments({
            role: "admin"
        });

        res.json({
            message: "Thống kê người dùng thành công",
            totalUsers,
            activeUsers,
            lockedUsers,
            adminUsers
        });

    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message
        });
    }
});

module.exports = router;
