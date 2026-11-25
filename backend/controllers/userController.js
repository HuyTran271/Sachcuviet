// @desc  Get user profile (User access test)
// @method GET
// @endpoint /api/users/profile
// @access Private (protect)

const getUserProfile = async (req, res) => {
    res.json({
        success: true,
        message: 'Xác thực người dùng thành công (Role: User/Admin)',
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            status: req.user.status,
            createdAt: req.user.createdAt,
        }
    });
};

// @desc  Update user profile (chi doi ten)
// @method PUT
// @endpoint /api/users/profile
// @access Private (protect)
// Quy tac: chi duoc doi name. Email, role, password khong doi qua day
// de tranh nguoi dung tu nang quyen hoac doi dinh danh dang nhap.
const updateUserProfile = async (req, res, next) => {
    try {
        const { name } = req.body || {};
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({
                message: 'Vui lòng nhập họ và tên có ít nhất 2 ký tự.',
            });
        }
        req.user.name = name.trim();
        await req.user.save();
        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công.',
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                status: req.user.status,
                createdAt: req.user.createdAt,
            }
        });
    } catch (error) {
        next(error);
    }
};

export {
    getUserProfile,
    updateUserProfile,
};
