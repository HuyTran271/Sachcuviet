import express from 'express';
import {
    getUserProfile,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
//router.get('/admin-dashboard', protect, admin, getAdminDashboard);

export default router;