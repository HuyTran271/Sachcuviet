import mongoose from 'mongoose';

export default async function connectDB() {
  if (!process.env.MONGODB_URL) throw new Error('MONGODB_URL chưa được khai báo.');
  const connection = await mongoose.connect(process.env.MONGODB_URL);
  console.log('MongoDB connected successfully');
  return connection;
}
