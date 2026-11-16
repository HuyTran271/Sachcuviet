import express from 'express';
import { loginUser, registerUser, logoutUser } from '../controllers/authController.js';
import { getUserProfile, getAdminDashboard } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();
// Compatibility for the existing frontend and clients using /api/users.
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);
router.get('/admin-dashboard', protect, admin, getAdminDashboard);
export default router;
