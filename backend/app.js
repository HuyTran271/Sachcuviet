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

// Tao Express app, KHONG ket noi DB, KHONG listen.
// server.js dung file nay de chay that; test dung file nay voi supertest
// de goi API ma khong can mo cong.
const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser());

// Anh upload local: dam bao thu muc ton tai roi phuc vu static /uploads.
// CSP sandbox: du co file HTML lot vao duoc thi trinh duyet cung khong
// cho no chay script khi mo truc tiep. nosniff chan trinh duyet doan
// lai Content-Type (vi du doan file anh thanh text/html).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use(
    '/uploads',
    (req, res, next) => {
        res.setHeader('Content-Security-Policy', 'sandbox');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        next();
    },
    express.static(uploadsDir)
);

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
    // Loi do middleware tu nem co statusCode rieng (vi du fileFilter
    // cua multer nem 400) thi ton trong no; loi gioi han cua multer
    // (file qua lon, qua nhieu file) cung la 400, khong phai 500.
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    if (err && typeof err.statusCode === 'number') {
        statusCode = err.statusCode;
    } else if (err && typeof err.code === 'string' && err.code.startsWith('LIMIT_')) {
        statusCode = 400;
    }
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

export default app;
