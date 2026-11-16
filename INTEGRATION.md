# Tích hợp Sachcuviet-huy

Ưu tiên giữ dự án hiện tại; ghép chọn lọc frontend và backend từ ZIP.

## Những phần giữ lại

- Giao diện trang chủ, 12 sách mẫu, ảnh bìa, tìm kiếm, thể loại và yêu thích.
- Trang chi tiết `/books/:id`, giao diện đặt hàng thử và layout navigation/footer chung.
- Form đăng nhập/đăng ký hiện tại, bao gồm trường điện thoại.
- Phiên bản thư viện, lockfile và các file `.env` hiện có.

## Những phần tích hợp

- `/profile` và PrivateRoute, dùng layout chung. Nhấn tên tài khoản trên navigation để mở hồ sơ.
- Hồ sơ gọi `GET /api/users/profile`; phiên hết hạn sẽ quay về đăng nhập, sau đó trở lại hồ sơ.
- Frontend dùng `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`.
- Backend hỗ trợ các API mới và tiếp tục hỗ trợ `/api/users/login`, `/api/users/register`, `/api/users/logout` cũ.
- Kiểm tra tài khoản inactive khi đăng nhập và truy cập API cần xác thực.
- Model User thêm status, phone, timestamps và mã hóa mật khẩu duy nhất trong hook save.
- Model Shop/Product từ ZIP. Các file Cart/Category/Order/Review trong ZIP là file rỗng nên không nhập thành module hoạt động.
- Seeder tạo admin nếu chưa tồn tại, không xóa dữ liệu và không ghi đè mật khẩu/quyền tài khoản cũ.

## Chạy dự án

Backend đọc `backend/.env` trước, sau đó mới đọc `.env` ở thư mục gốc. Biến môi trường của tiến trình có ưu tiên cao nhất. Tham khảo `backend/.env.example`, điền `MONGODB_URL` và một `JWT_SECRET` riêng; không dùng giá trị mẫu làm khóa thật.

```powershell
cd backend
npm run dev
```

Mở terminal khác:

```powershell
cd frontend
npm run dev
```

Seeder chỉ chạy khi bạn chủ động gọi `npm run seeder` trong backend sau khi cấu hình `SEED_ADMIN_EMAIL` và `SEED_ADMIN_PASSWORD`. Không chạy seeder như một phần của tích hợp này.

## Kiểm tra

```powershell
cd backend
npm test
cd ../frontend
npm run build
```

Kiểm thử backend dùng database giả trong bộ nhớ nhưng chạy controller, middleware JWT và hook Mongoose thật. Không kết nối MongoDB và không tạo tài khoản trong dữ liệu thật.

Giao diện sách và đặt hàng tiếp tục dùng dữ liệu mẫu. ZIP chưa có API danh mục, sản phẩm hay đơn hàng để kết nối các phần này. `Product.category` là chỗ tham chiếu dành cho model Category sẽ được triển khai tiếp.
