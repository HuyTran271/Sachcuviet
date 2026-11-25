import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/config.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();
const port = process.env.PORT || 3003;

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET chưa được khai báo trong môi trường');
    process.exit(1); // Exit the application with an error code
}

if (!process.env.MONGODB_URL) {
    console.error('MONGODB_URL chưa được khai báo trong môi trường');
    process.exit(1); // Exit the application with an error code
}

// Connect Database
connectDB();

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser());

// Anh upload local: dam bao thu muc ton tai roi phuc vu static /uploads.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Root test endpoint
app.get('/', (req, res) => {
    res.send('Sách Cũ Việt API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}/`);
});
