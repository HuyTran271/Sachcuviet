
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/config.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/report.js';

const app = express();
const port = process.env.PORT || 3003;

connectDB();

app.use(express.json());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(cookieParser());

// Routes của main
app.use('/api/users', userRoutes);

// Route cập nhật Profile của dung
app.use('/api/users', profileRoutes);

// Routes Admin và Report
app.use('/api/admin', adminRoutes);
app.use('/api/admin/report', reportRoutes);

app.get('/', (req, res) => {
    res.send('Sachcuviet API is running...');
});

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
