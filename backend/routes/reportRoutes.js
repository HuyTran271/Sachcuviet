import express from 'express';
import { createReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Chi POST / o day. GET danh sach bao cao thuoc adminRoutes (GET /api/admin/reports).
router.post('/', protect, createReport);

export default router;
