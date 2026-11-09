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
        }
    });
};

export {
    getUserProfile,

};