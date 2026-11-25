import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrderById,
    getSellerOrders,
    updateOrderStatus,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Luu y: /my va /seller phai dat TRUOC /:id, neu khong
// "my" / "seller" se bi hieu la id cua don hang.
router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/seller', protect, getSellerOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);

export default router;
