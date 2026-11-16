import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URL);
        console.log('MongoDB connected successfully');
        return connection;
    } catch (error) {
        console.log('MongoDB connection error: ', error);
        process.exit(1);
    }
};

export default connectDB;