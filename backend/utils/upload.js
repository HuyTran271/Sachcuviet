import multer from 'multer';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fileTypeFromFile } from 'file-type';
import { v2 as cloudinary } from 'cloudinary';

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

const uploadedFiles = (req) => [...(req.files || []), ...(req.file ? [req.file] : [])];

const removeTemporaryFiles = async (files) =>
    Promise.all(files.map((file) => fs.promises.rm(file.path, { force: true })));

const hasCloudinaryConfig = () =>
    Boolean(
        process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET)
    );

const configureCloudinary = () => {
    if (process.env.CLOUDINARY_URL) {
        cloudinary.config();
        return;
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
};

const storeUploadedImages = async (req, res, next) => {
    const files = uploadedFiles(req);
    if (files.length === 0) return next();

    // Test mode keeps exercising the local static-file behavior without needing
    // real Cloudinary credentials or making network requests.
    if (process.env.NODE_ENV === 'test' && !hasCloudinaryConfig()) return next();

    if (!hasCloudinaryConfig()) {
        await removeTemporaryFiles(files);
        const error = new Error(
            'Thiếu cấu hình Cloudinary. Vui lòng khai báo CLOUDINARY_URL hoặc CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.'
        );
        error.statusCode = 503;
        return next(error);
    }

    const uploaded = [];
    try {
        configureCloudinary();
        for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'sachcuviet',
                resource_type: 'image'
            });
            if (result.public_id) uploaded.push(result.public_id);
            if (!result.secure_url || !result.public_id) {
                throw new Error('Cloudinary không trả về URL ảnh hợp lệ.');
            }
            file.cloudinaryUrl = result.secure_url;
            file.cloudinaryPublicId = result.public_id;
        }

        await removeTemporaryFiles(files);
        return next();
    } catch (error) {
        const cleanupResults = await Promise.allSettled([
            ...uploaded.map((publicId) => cloudinary.uploader.destroy(publicId)),
            removeTemporaryFiles(files)
        ]);
        for (const result of cleanupResults) {
            if (result.status === 'rejected') {
                console.error('Không thể dọn dẹp file upload sau lỗi Cloudinary:', result.reason);
            }
        }
        return next(error);
    }
};

export {
    upload,
    uploadProductImages,
    uploadAvatar,
    validateUploadedImages,
    storeUploadedImages
};
export default upload;
