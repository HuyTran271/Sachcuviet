
const express = require("express");
const User = require("../models/user");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// API xem thông tin cá nhân
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        res.json({
            message: "Lấy thông tin cá nhân thành công",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message
        });
    }
});

// API cập nhật thông tin cá nhân
router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { name, phone } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone },
            { new: true, runValidators: true }
        ).select("-password");

        res.json({
            message: "Cập nhật thông tin thành công",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message
        });
    }
});

module.exports = router;
