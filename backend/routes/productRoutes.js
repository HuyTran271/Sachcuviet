import express from 'express';
import {
    listProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProductImages, validateUploadedImages } from '../utils/upload.js';

const router = express.Router();

router.get('/', listProducts);
router.get('/:id', getProductById);
router.post('/', protect, uploadProductImages, validateUploadedImages, createProduct);
router.put('/:id', protect, uploadProductImages, validateUploadedImages, updateProduct);
router.delete('/:id', protect, deleteProduct);

export default router;
