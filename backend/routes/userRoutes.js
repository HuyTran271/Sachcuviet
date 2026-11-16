import express from 'express';
import {
    loginUser,
    registerUser,
    logoutUser,
    getUserProfile,
    getAdminDashboard,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', loginUser);
router.post('/register', registerUser);

// User-protected route (requires login)
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);

export default router;