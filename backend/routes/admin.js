
const express = require("express");
const User = require("../models/user");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Middleware kiểm tra quyền Admin
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Bạn không có quyền Admin"
        });
    }

    next();
};


// ==================== XEM DANH SÁCH USER ====================
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select("-password");

        res.json({
            message: "Lấy danh sách người dùng thành công",
            users
        });

    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message
        });
    }
});


// ==================== XEM CHI TIẾT USER ====================
router.get("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng"
            });
        }

        res.json({
            message: "Lấy thông tin người dùng thành công",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message
        });
    }
});


// ==================== KHÓA / MỞ KHÓA USER ====================
router.put("/users/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        if (!["active", "locked"].includes(status)) {
            return res.status(400).json({
                message: "Trạng thái không hợp lệ"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng"
            });
        }

        res.json({
            message: status === "locked"
                ? "Đã khóa tài khoản"
                : "Đã mở khóa tài khoản",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message
        });
    }
});


// ==================== XÓA USER ====================
router.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng"
            });
        }

        res.json({
            message: "Xóa người dùng thành công"
        });

    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message
        });
    }
});

module.exports = router;
