import './config/environment.js';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import User from './models/User.js';
import connectDB from './config/config.js';

export async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Khai báo SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD hợp lệ trước khi chạy seeder.');
  }
  const existing = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
  if (existing) { console.log('Tài khoản đã tồn tại; giữ nguyên mật khẩu và quyền.'); return existing; }
  // User's save hook performs the single password hash.
  const user = await User.create({ name: process.env.SEED_ADMIN_NAME || 'Admin', email, password, role: 'admin' });
  console.log('Đã tạo tài khoản admin.');
  return user;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) throw new Error('Thiếu SEED_ADMIN_EMAIL hoặc SEED_ADMIN_PASSWORD.');
    await connectDB();
    await seedAdmin();
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
}
