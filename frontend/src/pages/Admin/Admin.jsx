import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../utils/auth';
import {
  API_BASE_URL,
  adminListUsers,
  adminUpdateUserStatus,
  adminListProducts,
  adminUpdateProductStatus,
  adminDeleteProduct,
  listCategories,
  adminListOrders,
  adminListReports,
  adminUpdateReport,
  productImageUrl,
} from '../../utils/api';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import './Admin.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + ' đ';

const formatDate = (value) => {
  if (!value) return 'Không rõ';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('vi-VN');
};

const toArray = (res) =>
  Array.isArray(res) ? res : res?.data || res?.items || res?.users || res?.products || res?.orders || res?.reports || res?.categories || [];

const TABS = [
  { id: 'users', label: 'Người dùng' },
  { id: 'products', label: 'Sản phẩm' },
  { id: 'categories', label: 'Thể loại' },
  { id: 'orders', label: 'Đơn hàng' },
  { id: 'reports', label: 'Báo cáo vi phạm' },
];

const REPORT_STATUSES = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'reviewed', label: 'Đã xem xét' },
  { value: 'resolved', label: 'Đã xử lý' },
];

const getId = (x) => x._id || x.id;
const getUserName = (u) => u.fullName || u.name || u.email || 'Người dùng';
const isLocked = (u) =>
  ['locked', 'blocked', 'banned', 'inactive', 'disabled'].includes(String(u.status || '').toLowerCase()) ||
  u.status === false ||
  u.isActive === false ||
  u.active === false;

/* Thể loại: CRUD admin nằm trên /api/categories (protect + admin),
   không phải /api/admin/categories. API_BASE_URL đã kết thúc bằng /api. */
async function adminCategoryRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}/categories${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Thao tác với thể loại không thành công.');
  return data;
}

export default function Admin() {
  const [user] = useState(getCurrentUser);
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);

  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categorySaving, setCategorySaving] = useState(false);

  const [busyId, setBusyId] = useState(null);

  const loadTab = async (tabId) => {
    setLoading(true);
    setError('');
    try {
      if (tabId === 'users') setUsers(toArray(await adminListUsers()));
      if (tabId === 'products') setProducts(toArray(await adminListProducts()));
      if (tabId === 'categories') setCategories(toArray(await listCategories()));
      if (tabId === 'orders') setOrders(toArray(await adminListOrders()));
      if (tabId === 'reports') setReports(toArray(await adminListReports()));
    } catch (err) {
      setError(err?.message || 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    // Goi qua microtask de khong setState dong bo trong effect.
    queueMicrotask(() => {
      loadTab(tab);
    });
  }, [tab, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="home-container admin-page">
        <MarketplaceHeader user={user} />
        <main className="admin-content">
          <Alert type="error" message="Chỉ quản trị viên mới xem được trang này" />
        </main>
      </div>
    );
  }

  const handleToggleUser = async (target) => {
    const id = getId(target);
    const nextStatus = isLocked(target) ? 'active' : 'inactive';
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await adminUpdateUserStatus(id, nextStatus);
      setUsers((list) =>
        list.map((u) => (getId(u) === id ? { ...u, status: nextStatus } : u))
      );
      setSuccess(
        nextStatus === 'inactive'
          ? `Đã khóa tài khoản ${getUserName(target)}.`
          : `Đã mở khóa tài khoản ${getUserName(target)}.`
      );
    } catch (err) {
      setError(err?.message || 'Đổi trạng thái người dùng không thành công.');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleProduct = async (product) => {
    const id = getId(product);
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await adminUpdateProductStatus(id, nextStatus);
      setProducts((list) =>
        list.map((p) => (getId(p) === id ? { ...p, status: nextStatus } : p))
      );
      setSuccess(
        nextStatus === 'inactive'
          ? `Đã ẩn sản phẩm "${product.name}".`
          : `Đã hiện lại sản phẩm "${product.name}".`
      );
    } catch (err) {
      setError(err?.message || 'Đổi trạng thái sản phẩm không thành công.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteProduct = async (product) => {
    const id = getId(product);
    if (!window.confirm(`Xóa vĩnh viễn sản phẩm "${product.name}"?`)) return;
    setBusyId(id);
    setError('');
    try {
      await adminDeleteProduct(id);
      setProducts((list) => list.filter((p) => getId(p) !== id));
      setSuccess(`Đã xóa sản phẩm "${product.name}".`);
    } catch (err) {
      setError(err?.message || 'Xóa sản phẩm không thành công.');
    } finally {
      setBusyId(null);
    }
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setCategoryDescription('');
    setEditingCategoryId(null);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!categoryName.trim()) {
      setError('Vui lòng nhập tên thể loại.');
      return;
    }
    setCategorySaving(true);
    try {
      const body = { name: categoryName.trim(), description: categoryDescription.trim() };
      if (editingCategoryId) {
        const res = await adminCategoryRequest(`/${editingCategoryId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        const saved = res?.category || res?.data || res;
        setCategories((list) =>
          list.map((c) => (getId(c) === editingCategoryId ? { ...c, ...saved, ...body } : c))
        );
        setSuccess('Cập nhật thể loại thành công.');
      } else {
        const res = await adminCategoryRequest('', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        const saved = res?.category || res?.data || res;
        setCategories((list) => [...list, { ...body, ...saved }]);
        setSuccess('Thêm thể loại thành công.');
      }
      resetCategoryForm();
    } catch (err) {
      setError(err?.message || 'Lưu thể loại không thành công.');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCategoryId(getId(cat));
    setCategoryName(cat.name || cat.title || '');
    setCategoryDescription(cat.description || '');
  };

  const handleDeleteCategory = async (cat) => {
    const id = getId(cat);
    if (!window.confirm(`Xóa thể loại "${cat.name || cat.title}"?`)) return;
    setBusyId(id);
    setError('');
    try {
      await adminCategoryRequest(`/${id}`, { method: 'DELETE' });
      setCategories((list) => list.filter((c) => getId(c) !== id));
      setSuccess(`Đã xóa thể loại "${cat.name || cat.title}".`);
    } catch (err) {
      setError(err?.message || 'Xóa thể loại không thành công.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReportStatus = async (report, nextStatus) => {
    const id = getId(report);
    if (nextStatus === report.status) return;
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await adminUpdateReport(id, nextStatus);
      setReports((list) =>
        list.map((r) => (getId(r) === id ? { ...r, status: nextStatus } : r))
      );
      setSuccess('Đã cập nhật trạng thái báo cáo.');
    } catch (err) {
      setError(err?.message || 'Cập nhật trạng thái báo cáo không thành công.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="home-container admin-page">
      <MarketplaceHeader user={user} />
      <main className="admin-content">
        <h1 className="admin-title">Quản trị hệ thống</h1>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        )}

        <div className="admin-tabs" role="tablist" aria-label="Khu vực quản trị">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`admin-tab ${tab === t.id ? 'admin-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <>
            {tab === 'users' && (
              <section aria-label="Quản lý người dùng">
                {users.length === 0 ? (
                  <p>Chưa có người dùng nào.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const id = getId(u);
                        const isMe = String(id) === String(user?.id);
                        const locked = isLocked(u);
                        return (
                          <tr key={id}>
                            <td>{getUserName(u)}</td>
                            <td>{u.email}</td>
                            <td>{u.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</td>
                            <td>{locked ? 'Đã khóa' : 'Hoạt động'}</td>
                            <td>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isMe || busyId === id}
                                title={isMe ? 'Không thể khóa chính mình' : undefined}
                                onClick={() => handleToggleUser(u)}
                              >
                                {locked ? 'Mở khóa' : 'Khóa'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            )}

            {tab === 'products' && (
              <section aria-label="Quản lý sản phẩm">
                {products.length === 0 ? (
                  <p>Chưa có sản phẩm nào.</p>
                ) : (
                  <ul className="admin-product-list">
                    {products.map((p) => {
                      const id = getId(p);
                      const cover = p.images?.[0] || p.image;
                      return (
                        <li key={id} className="admin-product-item">
                          {cover && (
                            <img
                              className="admin-product-thumb"
                              src={productImageUrl(cover)}
                              alt={p.name}
                            />
                          )}
                          <div className="admin-product-info">
                            <strong>{p.name}</strong>
                            <span>{formatPrice(p.price)}</span>
                            <span className="admin-product-meta">
                              {p.status === 'active' ? 'Đang hiển thị' : 'Đã ẩn'}
                              {p.shop?.name ? ` · ${p.shop.name}` : ''}
                            </span>
                          </div>
                          <div className="admin-product-actions">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === id}
                              onClick={() => handleToggleProduct(p)}
                            >
                              {p.status === 'active' ? 'Ẩn' : 'Hiện'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busyId === id}
                              onClick={() => handleDeleteProduct(p)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {tab === 'categories' && (
              <section aria-label="Quản lý thể loại" className="admin-categories">
                <form className="admin-card" onSubmit={handleCategorySubmit} noValidate>
                  <h2>{editingCategoryId ? 'Sửa thể loại' : 'Thêm thể loại mới'}</h2>
                  <Input
                    id="admin-category-name"
                    label="Tên thể loại"
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Ví dụ: Văn học"
                    required
                  />
                  <Input
                    id="admin-category-description"
                    label="Mô tả"
                    type="text"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="Mô tả ngắn về thể loại (không bắt buộc)"
                  />
                  <div className="admin-form-actions">
                    <Button type="submit" variant="primary" loading={categorySaving}>
                      {editingCategoryId ? 'Lưu thay đổi' : 'Thêm thể loại'}
                    </Button>
                    {editingCategoryId && (
                      <Button variant="outline" onClick={resetCategoryForm}>
                        Hủy sửa
                      </Button>
                    )}
                  </div>
                </form>

                {categories.length === 0 ? (
                  <p>Chưa có thể loại nào.</p>
                ) : (
                  <ul className="admin-category-list">
                    {categories.map((cat) => (
                      <li key={getId(cat)} className="admin-category-item">
                        <div>
                          <strong>{cat.name || cat.title}</strong>
                          {cat.description && (
                            <span className="admin-category-desc"> · {cat.description}</span>
                          )}
                        </div>
                        <div className="admin-category-actions">
                          <Button variant="outline" size="sm" onClick={() => handleEditCategory(cat)}>
                            Sửa
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busyId === getId(cat)}
                            onClick={() => handleDeleteCategory(cat)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {tab === 'orders' && (
              <section aria-label="Quản lý đơn hàng">
                {orders.length === 0 ? (
                  <p>Chưa có đơn hàng nào.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Ngày tạo</th>
                        <th>Người mua</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Thanh toán</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={getId(o)}>
                          <td>{o.code || o.orderCode || `#${String(getId(o)).slice(-6)}`}</td>
                          <td>{formatDate(o.createdAt)}</td>
                          <td>{o.buyer?.name || o.buyer?.fullName || o.buyerName || o.user?.name || 'Không rõ'}</td>
                          <td>{formatPrice(o.total ?? o.totalAmount ?? o.totalPrice ?? 0)}</td>
                          <td>{o.status || 'pending'}</td>
                          <td>{o.paymentMethod || 'Không rõ'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}

            {tab === 'reports' && (
              <section aria-label="Quản lý báo cáo vi phạm">
                {reports.length === 0 ? (
                  <p>Chưa có báo cáo vi phạm nào.</p>
                ) : (
                  <ul className="admin-report-list">
                    {reports.map((r) => {
                      const id = getId(r);
                      return (
                        <li key={id} className="admin-report-item">
                          <div className="admin-report-info">
                            <strong>
                              {r.product?.name || r.productName || r.targetName || 'Nội dung bị báo cáo'}
                            </strong>
                            <span>
                              Người báo cáo: {r.reporter?.name || r.reporter?.fullName || r.reporterName || r.user?.name || 'Không rõ'}
                            </span>
                            <span>Lý do: {r.reason || r.content || r.message || 'Không ghi lý do'}</span>
                            <span className="admin-report-date">{formatDate(r.createdAt)}</span>
                          </div>
                          <div className="admin-report-status">
                            <label htmlFor={`admin-report-status-${id}`}>Trạng thái</label>
                            <select
                              id={`admin-report-status-${id}`}
                              className="admin-select"
                              value={r.status || 'pending'}
                              disabled={busyId === id}
                              onChange={(e) => handleReportStatus(r, e.target.value)}
                            >
                              {REPORT_STATUSES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
