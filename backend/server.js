
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const reportRoutes = require("./routes/report");

// Cho phép Frontend gọi Backend
app.use(cors());

// Cho phép đọc dữ liệu JSON
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/report", reportRoutes);

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error);
    });

// Kiểm tra Backend
app.get("/", (req, res) => {
    res.send("Sachuviet Backend is running!");
});

// Khởi động server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
