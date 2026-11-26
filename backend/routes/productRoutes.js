import express from 'express';
import {
    listProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProductImages, validateUploadedImages, storeUploadedImages } from '../utils/upload.js';

const router = express.Router();

router.get('/', listProducts);
router.get('/:id', getProductById);
router.post('/', protect, uploadProductImages, validateUploadedImages, storeUploadedImages, createProduct);
router.put('/:id', protect, uploadProductImages, validateUploadedImages, storeUploadedImages, updateProduct);
router.delete('/:id', protect, deleteProduct);

export default router;
