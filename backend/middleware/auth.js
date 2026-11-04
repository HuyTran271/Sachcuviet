
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Middleware kiểm tra đăng nhập
const authMiddleware = async (req, res, next) => {
    try {
        // Lấy token từ Header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Vui lòng đăng nhập"
            });
        }

        // Tách token khỏi chữ Bearer
        const token = authHeader.split(" ")[1];

        // Kiểm tra token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Tìm người dùng trong MongoDB
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "Người dùng không tồn tại"
            });
        }

        // Kiểm tra tài khoản có bị khóa không
        if (user.status === "locked") {
            return res.status(403).json({
                message: "Tài khoản đã bị khóa"
            });
        }

        // Lưu thông tin người dùng vào request
        req.user = user;

        // Cho phép tiếp tục xử lý
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Token không hợp lệ hoặc đã hết hạn"
        });
    }
};

module.exports = authMiddleware;
