import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export async function protect(req, res, next) {
  const bearer = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const token = req.cookies?.jwt || bearer;
  if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' }); }
  try {
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Tài khoản không tồn tại.' });
    if (req.user.status && req.user.status !== 'active') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa.' });
    }
    next();
  } catch (error) { next(error); }
}

export function admin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Chỉ quản trị viên được truy cập.' });
  next();
}
