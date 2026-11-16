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

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/logout', protect, logoutUser);