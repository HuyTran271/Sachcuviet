import express from 'express';
import {
    getMyShop,
    createShop,
    updateMyShop,
    getShopById
} from '../controllers/shopController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadAvatar, validateUploadedImages, storeUploadedImages } from '../utils/upload.js';

const router = express.Router();

router.get('/my', protect, getMyShop);
router.post('/', protect, uploadAvatar, validateUploadedImages, storeUploadedImages, createShop);
router.put('/my', protect, uploadAvatar, validateUploadedImages, storeUploadedImages, updateMyShop);
router.get('/:id', getShopById);

export default router;
