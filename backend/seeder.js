import User from './models/User.js';
import connectDB from './config/config.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
    console.error('SEED_ADMIN_EMAIL hoặc SEED_ADMIN_PASSWORD chưa được khai báo trong môi trường');
    process.exit(1); // Exit the application with an error code
}

const adminSeeder = async () => {
    // Truyen mat khau goc, de hook pre('save') cua User hash mot lan duy nhat.
    // Neu tu hash truoc roi save() thi hook se hash lan 2 va admin khong dang nhap duoc.
    try {
        const existingAdmin = await User.findOne({ email: process.env.SEED_ADMIN_EMAIL });
        if (!existingAdmin) {
            const admin = new User({
                name: 'Admin',
                email: process.env.SEED_ADMIN_EMAIL,
                password: process.env.SEED_ADMIN_PASSWORD,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user đã tạo thành công.');
        } else {
            console.log('Admin user đã tồn tại.');
        }
    } catch (error) {
        console.error('Có lỗi xảy ra khi seeding admin user:', error);
    }
};

await connectDB();
await adminSeeder();
await mongoose.disconnect();

export default adminSeeder;