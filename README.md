# Sách Cũ Việt — C2C used-book marketplace

Chợ sách cũ C2C: người dùng tạo gian hàng, đăng bán sách, người mua tìm kiếm,
thêm giỏ hàng, đặt hàng; quản trị viên quản lý người dùng, sản phẩm, thể loại,
đơn hàng và báo cáo vi phạm.

Stack: backend Express 5 + Mongoose 9 + JWT (cookie httpOnly), frontend
React 19 + Vite + React Router 7, CSS thuần với design tokens
(`frontend/src/styles/tokens.css`, primary #173F35/#286B59, accent #C06443,
nền #FAF8F3). Không dùng Tailwind hay UI framework khác.

## Chạy dự án

### 1. Backend

```bash
cd backend
cp .env.example .env   # rồi điền giá trị thật, xem bên dưới
npm install
npm run seeder         # tạo tài khoản admin seed (chỉ khi chưa có)
npm run dev            # nodemon, cổng mặc định 3003
```

Biến môi trường (xem `backend/.env.example`, **không commit file `.env`**):

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Cổng backend, mặc định `3003` |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URL` | Chuỗi kết nối MongoDB |
| `JWT_SECRET` | Secret ký JWT, bắt buộc, không có giá trị mặc định. Thiếu thì server từ chối khởi động |
| `FRONTEND_URL` | Origin frontend cho CORS, mặc định `http://localhost:5173` |
| `SEED_ADMIN_EMAIL` | Email admin seed |
| `SEED_ADMIN_PASSWORD` | Mật khẩu admin seed (truyền mật khẩu gốc, hook của User sẽ hash 1 lần) |

Tài khoản seed admin: email/mật khẩu lấy từ `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` trong `.env`. Đổi mật khẩu admin đã seed thì xóa user
đó trong DB rồi seed lại, seeder chỉ tạo khi chưa tồn tại.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # Vite, mặc định http://localhost:5173
npm run build     # build production
npm run lint      # ESLint, phải sạch trước khi commit
```

API base mặc định `http://localhost:3003/api`, đổi bằng biến
`VITE_API_BASE_URL` trong file `.env` của frontend (không bắt buộc).

Ảnh sản phẩm/avatar upload lên backend, lưu local ở `backend/uploads/`
và phục vụ ở `/uploads/...`. Thư mục này đã ignore trong git.

## Cấu trúc

```
backend/
  config/config.js        # kết nối MongoDB
  controllers/            # auth, user, shop, category, product, cart, order, admin, report
  middleware/authMiddleware.js  # protect (JWT cookie/Bearer), admin (role)
  models/                 # User, Shop, Category, Product, Cart, Order, Review, Report
  routes/                 # auth, users, shops, categories, products, cart, orders, admin, reports
  utils/generateToken.js  # ký JWT + set cookie (1 chỗ duy nhất)
  utils/upload.js         # multer: ảnh local, tối đa 5 MB/file, 5 ảnh/sản phẩm
  seeder.js               # tạo admin seed từ env
  server.js               # mount route + static /uploads
frontend/src/
  pages/                  # Home, Login, Register, Profile, ProductDetail, ShopPublic,
                          # MyShop, ProductForm, Cart, Checkout, Orders, SellerOrders, Admin
  components/common/      # Button, Input, Alert, PrivateRoute
  components/layout/      # AuthLayout, MarketplaceHeader
  utils/auth.js           # login/register/logout/profile + session localStorage
  utils/api.js            # fetch client + toàn bộ hàm gọi API theo domain
  styles/tokens.css       # design tokens (màu, radius, shadow)
```

## API chính

Auth (giữ nguyên từ đầu): `POST /api/auth/register`, `POST /api/auth/login`,
`POST /api/auth/logout`, `GET /api/users/profile`, `PUT /api/users/profile`
(chỉ đổi tên).

| Nhóm | API |
|---|---|
| Thể loại | `GET /api/categories`, `POST/PUT/DELETE /api/categories` (admin) |
| Gian hàng | `GET /api/shops/my`, `POST /api/shops`, `PUT /api/shops/my`, `GET /api/shops/:id` |
| Sản phẩm | `GET /api/products?q=&category=&minPrice=&maxPrice=&condition=&page=&limit=`, `GET /api/products/:id`, `POST/PUT/DELETE /api/products/:id` (chủ shop) |
| Giỏ hàng | `GET /api/cart`, `POST /api/cart`, `PUT /api/cart/:productId`, `DELETE /api/cart/:productId`, `DELETE /api/cart` |
| Đơn hàng | `POST /api/orders`, `GET /api/orders/my`, `GET /api/orders/seller`, `GET /api/orders/:id`, `PUT /api/orders/:id/status` |
| Báo cáo | `POST /api/reports` |
| Admin | `GET /api/admin/users`, `PUT /api/admin/users/:id/status`, `GET /api/admin/products`, `PUT /api/admin/products/:id/status`, `DELETE /api/admin/products/:id`, `GET /api/admin/orders`, `GET /api/admin/reports`, `PUT /api/admin/reports/:id` |

Luật chuyển trạng thái đơn (seller): `pending -> confirmed/cancelled`,
`confirmed -> shipping/cancelled`, `shipping -> delivered`. `delivered` và
`cancelled` là trạng thái cuối. Đặt hàng kiểm tra đủ stock trước, rồi mới tạo
đơn, trừ stock và xóa các món đã đặt khỏi giỏ.

Lỗi trả về thống nhất bằng tiếng Việt: 400 thiếu/sai field, 401 chưa đăng nhập,
403 sai quyền/sai chủ, 404 không thấy, 409 trùng/xung đột.

## Kiểm chứng

- `cd backend && node --check <file>` cho từng file backend.
- `cd frontend && npm run build && npm run lint` (cả hai phải pass).
- Kiểm chứng end-to-end với MongoDB thật: chạy backend + frontend như trên,
  đăng ký 1 user, đăng nhập admin seed để tạo thể loại, tạo gian hàng, đăng
  sách, thêm giỏ, đặt hàng, kiểm tra stock giảm và đơn xuất hiện ở lịch sử
  mua hàng, trang đơn bán và trang admin. Script kiểm chứng tự động bằng
  MongoDB in-memory (`mongodb-memory-server`, không commit) từng dùng để
  test luồng này, xem ghi chú trong báo cáo bàn giao của từng Sprint.
