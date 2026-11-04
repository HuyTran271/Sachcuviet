
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

console.log("Auth routes loaded");

// ==================== ĐĂNG KÝ ====================
router.post("/register", async (req, res) => {
    try {
        // Lấy thông tin người dùng gửi lên
        const { name, email, password, phone } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin"
            });
        }

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email đã được đăng ký"
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo tài khoản mới
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone
        });

        // Lưu tài khoản vào MongoDB
        await newUser.save();

        // Trả kết quả đăng ký thành công
        res.status(201).json({
            message: "Đăng ký thành công",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message
        });
    }
});


// ==================== ĐĂNG NHẬP ====================
router.post("/login", async (req, res) => {
    console.log("Login API was called");

    try {
        // Login chỉ cần email và password
        const { email, password } = req.body;

        // Kiểm tra email và mật khẩu
        if (!email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập email và mật khẩu"
            });
        }

        // Tìm tài khoản theo email
        const user = await User.findOne({
            email: email.toLowerCase()
        });

        // Nếu không tìm thấy tài khoản
        if (!user) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        // Kiểm tra tài khoản có bị khóa không
        if (user.status === "locked") {
            return res.status(403).json({
                message: "Tài khoản đã bị khóa"
            });
        }

        // So sánh mật khẩu nhập vào với mật khẩu đã mã hóa
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        // Tạo JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Trả kết quả đăng nhập thành công
        res.json({
            message: "Đăng nhập thành công",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message
        });
    }
});

module.exports = router;
