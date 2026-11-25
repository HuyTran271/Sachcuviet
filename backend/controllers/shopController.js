import Shop from '../models/Shop.js';

// @desc  Lấy shop của chính mình
// @method GET
// @endpoint /api/shops/my
// @access Private (protect)
const getMyShop = async (req, res, next) => {
    try {
        const shop = await Shop.findOne({ owner: req.user._id }).populate('owner', 'name');
        if (!shop) {
            return res.status(404).json({ message: 'Bạn chưa có shop.' });
        }
        res.json({ success: true, shop });
    } catch (error) {
        next(error);
    }
};

// @desc  Tạo shop (mỗi user tối đa 1 shop)
// @method POST
// @endpoint /api/shops
// @access Private (protect)
const createShop = async (req, res, next) => {
    try {
        const existed = await Shop.findOne({ owner: req.user._id });
        if (existed) {
            return res.status(409).json({ message: 'Mỗi người dùng chỉ được tạo tối đa 1 shop.' });
        }

        const { name, description } = req.body || {};

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên shop.' });
        }
        if (description !== undefined && typeof description !== 'string') {
            return res.status(400).json({ message: 'Mô tả shop không hợp lệ.' });
        }

        const shop = await Shop.create({
            name: name.trim(),
            owner: req.user._id,
            description: description || '',
            avatar: req.file ? `/uploads/${req.file.filename}` : ''
        });

        res.status(201).json({ success: true, message: 'Tạo shop thành công.', shop });
    } catch (error) {
        next(error);
    }
};

// @desc  Cập nhật shop của chính mình
// @method PUT
// @endpoint /api/shops/my
// @access Private (protect)
const updateMyShop = async (req, res, next) => {
    try {
        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) {
            return res.status(404).json({ message: 'Bạn chưa có shop.' });
        }

        const { name, description } = req.body || {};

        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ message: 'Tên shop không hợp lệ.' });
            }
            shop.name = name.trim();
        }

        if (description !== undefined) {
            if (typeof description !== 'string') {
                return res.status(400).json({ message: 'Mô tả shop không hợp lệ.' });
            }
            shop.description = description;
        }

        if (req.file) {
            shop.avatar = `/uploads/${req.file.filename}`;
        }

        await shop.save();
        res.json({ success: true, message: 'Cập nhật shop thành công.', shop });
    } catch (error) {
        next(error);
    }
};

// @desc  Lấy shop theo id
// @method GET
// @endpoint /api/shops/:id
// @access Public
const getShopById = async (req, res, next) => {
    try {
        const shop = await Shop.findById(req.params.id).populate('owner', 'name');
        if (!shop) {
            return res.status(404).json({ message: 'Không tìm thấy shop.' });
        }
        res.json({ success: true, shop });
    } catch (error) {
        next(error);
    }
};

export {
    getMyShop,
    createShop,
    updateMyShop,
    getShopById
};
