import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const sessionUser = (user) => ({
  _id: user._id, name: user.name, email: user.email, phone: user.phone || '',
  role: user.role, status: user.status || 'active', createdAt: user.createdAt,
});

export async function loginUser(req, res, next) {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!validEmail(email) || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email hợp lệ và mật khẩu.' });
  }
  try {
    // Case-insensitive lookup also accepts emails saved by the old schema.
    const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa.' });
    }
    const token = generateToken(res, user);
    // Preserve the token field returned by the existing /api/users/login API.
    return res.json({ ...sessionUser(user), token });
  } catch (error) { next(error); }
}

export async function registerUser(req, res, next) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.replace(/[\s.-]/g, '') : '';
  if (name.length < 2 || !validEmail(email) || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Vui lòng nhập tên, email hợp lệ và mật khẩu ít nhất 6 ký tự.' });
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Mật khẩu quá dài, vui lòng dùng tối đa 72 byte UTF-8.' });
  }
  if (phone && !/^(?:0|\+84)\d{9}$/.test(phone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ.' });
  }
  try {
    const existing = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (existing) return res.status(409).json({ message: 'Email đã được sử dụng. Vui lòng chọn email khác.' });
    const user = await User.create({ name, email, phone, password });
    generateToken(res, user);
    return res.status(201).json({ message: 'Đăng ký người dùng thành công', ...sessionUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email đã được sử dụng.' });
    next(error);
  }
}

export function logoutUser(req, res) {
  // Clear even an expired or missing session cookie.
  res.clearCookie('jwt', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/',
  });
  return res.json({ message: 'Đăng xuất thành công' });
}
