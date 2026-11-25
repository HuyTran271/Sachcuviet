import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/config.js';
import app from './app.js';

const port = process.env.PORT || 3003;

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET chưa được khai báo trong môi trường');
    process.exit(1); // Exit the application with an error code
}

if (!process.env.MONGODB_URL) {
    console.error('MONGODB_URL chưa được khai báo trong môi trường');
    process.exit(1); // Exit the application with an error code
}

// Connect Database
connectDB();

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}/`);
});
