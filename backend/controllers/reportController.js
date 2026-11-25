import Product from '../models/Product.js';
import Report from '../models/Report.js';

const REPORT_STATUSES = ['pending', 'reviewed', 'resolved'];

// @desc  Bao cao mot san pham
// @method POST
// @endpoint /api/reports
// @access Private (protect)
const createReport = async (req, res, next) => {
    try {
        const { product, reason } = req.body || {};

        if (!product) {
            return res.status(400).json({ message: 'Vui lòng cung cấp id sản phẩm cần báo cáo.' });
        }
        if (!reason || typeof reason !== 'string' || !reason.trim()) {
            return res.status(400).json({ message: 'Vui lòng cung cấp lý do báo cáo.' });
        }

        const foundProduct = await Product.findById(product);
        if (!foundProduct) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }

        const report = await Report.create({
            product: foundProduct._id,
            reporter: req.user._id,
            reason: reason.trim(),
            status: 'pending',
        });

        res.status(201).json(report);
    } catch (error) {
        next(error);
    }
};

// @desc  Lay danh sach bao cao (admin)
// @method GET
// @endpoint /api/admin/reports
// @access Private (admin)
const listReports = async (req, res, next) => {
    try {
        const reports = await Report.find({})
            .sort({ createdAt: -1 })
            .populate('product', 'name')
            .populate('reporter', 'name email');
        res.json(reports);
    } catch (error) {
        next(error);
    }
};

// @desc  Cap nhat trang thai bao cao (admin)
// @method PUT
// @endpoint /api/admin/reports/:id
// @access Private (admin)
const updateReportStatus = async (req, res, next) => {
    try {
        const { status } = req.body || {};

        if (!status || !REPORT_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ (pending, reviewed hoặc resolved).' });
        }

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo.' });
        }

        report.status = status;
        await report.save();

        res.json(report);
    } catch (error) {
        next(error);
    }
};

export {
    createReport,
    listReports,
    updateReportStatus,
};
