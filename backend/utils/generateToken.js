import jwt from 'jsonwebtoken';

export default function generateToken(res, user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET chưa được khai báo.');
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 1000,
  });
  return token;
}
