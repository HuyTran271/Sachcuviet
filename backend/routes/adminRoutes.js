import express from 'express';
import {
    listUsers,
    updateUserStatus,
    listProducts,
    updateProductStatus,
    deleteProduct,
    listOrders,
} from '../controllers/adminController.js';
import {
    listReports,
    updateReportStatus,
} from '../controllers/reportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tat ca route admin deu yeu cau protect + admin.
router.get('/users', protect, admin, listUsers);
router.put('/users/:id/status', protect, admin, updateUserStatus);
router.get('/products', protect, admin, listProducts);
router.put('/products/:id/status', protect, admin, updateProductStatus);
router.delete('/products/:id', protect, admin, deleteProduct);
router.get('/orders', protect, admin, listOrders);
router.get('/reports', protect, admin, listReports);
router.put('/reports/:id', protect, admin, updateReportStatus);

export default router;
