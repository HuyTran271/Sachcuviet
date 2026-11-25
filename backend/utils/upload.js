import multer from 'multer';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fileTypeFromFile } from 'file-type';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Chi giu duoi cho phep, viet thuong de khong lot .HTML/.Svg.
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${ext}`);
    }
});

// Chi anh that: jpg/jpeg/png/webp. Khong cho gif (khong can cho anh
// san pham/avatar), khong cho svg (la XML, chua duoc script -> XSS),
// khong cho html.
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const uploadError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

// fileFilter chi la vong loc dau tien: mimetype do client khai bao nen
// khong duoc tin tuyet doi, vong kiem tra that su la magic bytes o
// validateUploadedImages ben duoi.
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        return cb(uploadError('Chỉ chấp nhận file ảnh (jpg, jpeg, png, webp).'), false);
    }
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(uploadError('Chỉ chấp nhận file ảnh (jpg, jpeg, png, webp).'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadProductImages = upload.array('images', 5);
const uploadAvatar = upload.single('avatar');

// Kiem tra magic bytes cua file DA LUU tren dia (file-type doc signature
// that cua file, khong tin mimetype hay duoi file client gui). Chay sau
// middleware upload cua multer. File khong phai anh that hoac duoi file
// khong khop loai anh that thi xoa het file cua request va tra 400.
const validateUploadedImages = async (req, res, next) => {
    const files = [...(req.files || []), ...(req.file ? [req.file] : [])];
    if (files.length === 0) return next();

    const removeFiles = () => {
        for (const file of files) {
            fs.rmSync(file.path, { force: true });
        }
    };

    for (const file of files) {
        let detected = null;
        try {
            detected = await fileTypeFromFile(file.path);
        } catch {
            detected = null;
        }
        const fileExt = path.extname(file.filename).toLowerCase();
        // file-type tra 'jpg' cho ca .jpg va .jpeg.
        const detectedExt = detected ? `.${detected.ext === 'jpg' ? 'jpg' : detected.ext}` : null;
        const extMatches =
            detectedExt !== null &&
            (fileExt === detectedExt || (fileExt === '.jpeg' && detectedExt === '.jpg'));
        const isAllowedImage =
            detected !== undefined &&
            detected !== null &&
            allowedMimeTypes.includes(detected.mime) &&
            allowedExtensions.includes(detectedExt) &&
            extMatches;

        if (!isAllowedImage) {
            removeFiles();
            return res.status(400).json({ message: 'File ảnh không hợp lệ (định dạng thật không phải ảnh jpg/png/webp).' });
        }
    }
    return next();
};

export { upload, uploadProductImages, uploadAvatar, validateUploadedImages };
export default upload;
