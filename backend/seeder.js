import User from './models/User.js';
import connectDB from './config/config.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const adminSeeder = async () => {
    const hashPassword = await bcrypt.hash('admin123', 10);
    try {
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (!existingAdmin) {
            const admin = new User({
                name: 'Admin',
                email: 'admin@example.com',
                password: hashPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (error) {
        console.error('Error occurred while seeding admin user:', error);
    }
};

await connectDB();
await adminSeeder();
await mongoose.disconnect();

export default adminSeeder;