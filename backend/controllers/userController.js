// Keep the existing exports available to code using the old controller module.
export { loginUser, registerUser, logoutUser } from './authController.js';

export function getUserProfile(req, res) {
  res.json({
    success: true,
    message: 'Xác thực người dùng thành công (Role: User/Admin)',
    user: {
      _id: req.user._id, name: req.user.name, email: req.user.email,
      phone: req.user.phone || '', role: req.user.role, status: req.user.status || 'active',
      createdAt: req.user.createdAt, updatedAt: req.user.updatedAt,
    },
  });
}

export function getAdminDashboard(req, res) {
  res.json({
    success: true,
    message: 'Xác thực Quản trị viên (Admin) thành công!',
    admin: { name: req.user.name, email: req.user.email, role: req.user.role },
  });
}
