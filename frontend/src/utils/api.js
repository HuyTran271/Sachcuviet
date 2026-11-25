// API client dùng chung cho frontend Sách Cũ Việt (Sprint 3).
//
// Quy ước path (để agent backend đối chiếu):
// - Các path đã chốt trong task: GET /products, GET /products/:id,
//   GET /categories, GET /shops/:id.
// - Các path còn lại dùng REST quy ước, backend cần map đúng như sau:
//   GET /shops/my, POST /shops, PUT /shops/my,
//   POST /products, PUT /products/:id, DELETE /products/:id,
//   GET /cart, POST /cart { product, quantity },
//   PUT /cart/:productId { quantity }, DELETE /cart/:productId,
//   POST /orders, GET /orders/my, GET /orders/:id, GET /orders/seller,
//   PUT /orders/:id/status { status },
//   GET /admin/users, PUT /admin/users/:id/status { status },
//   GET /admin/products, PUT /admin/products/:id/status { status },
//   DELETE /admin/products/:id, GET /admin/orders,
//   POST /reports { product, reason },
//   GET /admin/reports, PUT /admin/reports/:id { status }.
// - Mọi request đều gửi kèm cookie phiên (credentials: 'include').

import { API_BASE_URL } from './auth.js';

export { API_BASE_URL };

// Origin của API (API_BASE_URL bỏ đuôi /api), dùng để prefix ảnh '/uploads/...'.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

// Trả về URL đầy đủ của ảnh sản phẩm.
// - path đã là URL tuyệt đối (http/https/data:) thì giữ nguyên.
// - path bắt đầu bằng '/uploads' (hoặc '/' nói chung) thì prefix bằng API_ORIGIN.
// - path rỗng thì trả '' để phía gọi tự fallback ảnh mặc định.
export function productImageUrl(path) {
  if (!path) return '';
  if (/^(https?:\/\/|data:)/i.test(path)) return path;
  if (path.startsWith('/')) return `${API_ORIGIN}${path}`;
  return `${API_ORIGIN}/${path}`;
}

export async function request(path, { method = 'GET', body, isForm = false, headers = {} } = {}) {
  const baseHeaders = isForm ? {} : { 'Content-Type': 'application/json' };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { ...baseHeaders, ...headers },
    credentials: 'include',
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
  }

  return data;
}

export const apiGet = (path) => request(path, { method: 'GET' });

export const apiPost = (path, body, options = {}) =>
  request(path, { method: 'POST', body, ...options });

export const apiPut = (path, body) => request(path, { method: 'PUT', body });

export const apiDelete = (path) => request(path, { method: 'DELETE' });

// POST với FormData (upload ảnh): KHÔNG set Content-Type tay để
// trình duyệt tự gắn boundary của multipart/form-data.
export const apiPostForm = (path, formData) =>
  request(path, { method: 'POST', body: formData, isForm: true });

export const apiPutForm = (path, formData) =>
  request(path, { method: 'PUT', body: formData, isForm: true });

// ---------------------------------------------------------------------------
// Products & categories (public)
// ---------------------------------------------------------------------------

// params là object { q, category, minPrice, maxPrice, condition, page, limit }.
// Các key rỗng ('' / null / undefined) được bỏ trước khi gửi.
export function listProducts(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.append(key, value);
    }
  });
  const qs = query.toString();
  return apiGet(qs ? `/products?${qs}` : '/products');
}

export const getProduct = (id) => apiGet(`/products/${encodeURIComponent(id)}`);

export const listCategories = () => apiGet('/categories');

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------

export const getMyShop = () => apiGet('/shops/my');

export const createShop = (formData) => apiPostForm('/shops', formData);

export const updateMyShop = (formData) => apiPutForm('/shops/my', formData);

export const getShop = (id) => apiGet(`/shops/${encodeURIComponent(id)}`);

// ---------------------------------------------------------------------------
// Products (seller)
// ---------------------------------------------------------------------------

export const createProduct = (formData) => apiPostForm('/products', formData);

export const updateProduct = (id, formData) =>
  apiPutForm(`/products/${encodeURIComponent(id)}`, formData);

export const deleteProduct = (id) => apiDelete(`/products/${encodeURIComponent(id)}`);

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export const getCart = () => apiGet('/cart');

// `product` nhận id chuỗi hoặc object product (lấy product._id).
// Backend POST /cart nhận body { product, quantity } (quantity nguyên >= 1).
export function addToCart(product, quantity = 1) {
  const productId = typeof product === 'string' ? product : product?._id;
  return apiPost('/cart', { product: productId, quantity });
}

export const updateCartItem = (productId, quantity) =>
  apiPut(`/cart/${encodeURIComponent(productId)}`, { quantity });

export const removeCartItem = (productId) =>
  apiDelete(`/cart/${encodeURIComponent(productId)}`);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

// options co the mang headers, vi du { headers: { 'Idempotency-Key': key } }
// de server chong tao don trung khi retry.
export const checkoutOrder = (payload, options) => apiPost('/orders', payload, options);

export const getMyOrders = () => apiGet('/orders/my');

export const getOrder = (id) => apiGet(`/orders/${encodeURIComponent(id)}`);

export const getSellerOrders = () => apiGet('/orders/seller');

export const updateOrderStatus = (id, status) =>
  apiPut(`/orders/${encodeURIComponent(id)}/status`, { status });

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminListUsers = () => apiGet('/admin/users');

export const adminUpdateUserStatus = (id, status) =>
  apiPut(`/admin/users/${encodeURIComponent(id)}/status`, { status });

export const adminListProducts = () => apiGet('/admin/products');

export const adminUpdateProductStatus = (id, status) =>
  apiPut(`/admin/products/${encodeURIComponent(id)}/status`, { status });

export const adminDeleteProduct = (id) =>
  apiDelete(`/admin/products/${encodeURIComponent(id)}`);

export const adminListOrders = () => apiGet('/admin/orders');

// ---------------------------------------------------------------------------
// Reports (báo cáo vi phạm)
// ---------------------------------------------------------------------------

export const createReport = (payload) => apiPost('/reports', payload);

export const adminListReports = () => apiGet('/admin/reports');

export const adminUpdateReport = (id, status) =>
  apiPut(`/admin/reports/${encodeURIComponent(id)}`, { status });
