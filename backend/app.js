import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => res.send('Sách Cũ Việt API is running...'));
app.use((req, res) => res.status(404).json({ message: 'Không tìm thấy API.' }));
app.use((error, req, res, next) => {
  const status = error.statusCode || error.status || (res.statusCode >= 400 ? res.statusCode : 500);
  res.status(status).json({
    message: error.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : error.stack,
  });
});
export default app;
