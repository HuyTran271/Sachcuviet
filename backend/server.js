import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/config.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const port = process.env.PORT;

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

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes); 

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