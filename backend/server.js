import './config/environment.js';
import app from './app.js';
import connectDB from './config/config.js';

async function startServer() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET chưa được khai báo trong backend/.env hoặc .env ở thư mục gốc.');
  await connectDB();
  const port = process.env.PORT || 3003;
  app.listen(port, () => console.log(`Server is running at http://localhost:${port}/`));
}

startServer().catch((error) => {
  console.error('Không thể khởi động backend:', error.message);
  process.exitCode = 1;
});
