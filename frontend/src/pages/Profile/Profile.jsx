import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, getProfile, updateProfile, logout } from '../../utils/auth';
import {
  getMyShop,
  getMyOrders,
  getSellerOrders,
  getCart,
  listProducts,
  productImageUrl,
} from '../../utils/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import './Profile.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + ' đ';

const formatDate = (value) => {
  if (!value) return 'Không rõ';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('vi-VN');
};

const toArray = (res) =>
  Array.isArray(res) ? res : res?.orders || res?.data || res?.items || [];

const toCartItems = (res) =>
  Array.isArray(res) ? res : res?.items || res?.cart?.items || res?.data?.items || [];

const ORDER_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const getOrderTotal = (o) =>
  o.total ?? o.totalAmount ?? o.totalPrice ?? o.amount ?? 0;

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldError, setFieldError] = useState('');

  const [shop, setShop] = useState(null);
  const [shopChecked, setShopChecked] = useState(false);
  const [orders, setOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [productCount, setProductCount] = useState(0);

  // Goi API that thay vi chi doc localStorage: xac thuc phien, lay ten moi nhat.
  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        setFullName(fresh.fullName || '');
      })
      .catch((err) => {
        if (cancelled) return;
        // Het phien (401): xoa session local, dua ve trang dang nhap.
        setError(err.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setUser(null);
        logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Du lieu tong quan: gian hang, don mua, don ban, gio hang. Loi tung phan
  // khong chan ca trang, chi de so lieu mac dinh.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    getMyShop()
      .then((res) => {
        if (cancelled) return;
        const found = res?.shop || res?.data || res;
        if (found && (found._id || found.id || found.name)) {
          setShop(found);
          listProducts({ shop: String(found._id || found.id || ''), limit: 100 })
            .then((data) => {
              if (cancelled) return;
              setProductCount(data.total ?? (data.products || []).length);
            })
            .catch(() => {
              if (!cancelled) setProductCount(0);
            });
        } else {
          setShop(null);
        }
      })
      .catch(() => {
        if (!cancelled) setShop(null);
      })
      .finally(() => {
        if (!cancelled) setShopChecked(true);
      });

    getMyOrders()
      .then((res) => {
        if (!cancelled) setOrders(toArray(res));
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });

    getSellerOrders()
      .then((res) => {
        if (!cancelled) setSellerOrders(toArray(res));
      })
      .catch(() => {
        if (!cancelled) setSellerOrders([]);
      });

    getCart()
      .then((res) => {
        if (cancelled) return;
        const items = toCartItems(res);
        setCartCount(items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0));
      })
      .catch(() => {
        if (!cancelled) setCartCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFieldError('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }
    setFieldError('');
    setSaving(true);
    try {
      const updated = await updateProfile({ fullName: fullName.trim() });
      setUser(updated);
      setSuccess('Cập nhật họ và tên thành công.');
    } catch (err) {
      setError(err.message || 'Cập nhật hồ sơ không thành công.');
    } finally {
      setSaving(false);
    }
  };

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 3);

  return (
    <div className="home-container profile-page">
      <MarketplaceHeader user={user} />
      <main className="profile-content">
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        )}
        {loading ? (
          <p>Đang tải hồ sơ...</p>
        ) : user ? (
          <div className="profile-layout">
            <aside className="profile-sidebar">
              <div className="profile-avatar" aria-hidden="true">
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h1 id="profile-title" className="profile-name">
                {user.fullName || 'Người dùng'}
              </h1>
              <p className="profile-role">
                {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
              </p>
              <p className="profile-email">{user.email || 'Chưa có email'}</p>

              <nav className="profile-nav" aria-label="Điều hướng hồ sơ">
                <a href="#profile-overview" className="profile-nav-link">Tổng quan</a>
                <Link to="/orders" className="profile-nav-link">Đơn hàng của tôi</Link>
                <Link to="/seller-orders" className="profile-nav-link">Đơn bán</Link>
                <a href="#profile-shop" className="profile-nav-link">Gian hàng của tôi</a>
                <Link to="/my-products/new" className="profile-nav-link">Đăng bán sách</Link>
                <Link to="/cart" className="profile-nav-link">Giỏ hàng</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="profile-nav-link">Quản trị</Link>
                )}
                <a href="#profile-account" className="profile-nav-link">Thông tin tài khoản</a>
              </nav>

              <Button
                variant="outline"
                className="profile-logout-button"
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </aside>

            <div className="profile-main">
              <section id="profile-overview" aria-labelledby="profile-overview-title">
                <h2 id="profile-overview-title" className="profile-section-title">Tổng quan</h2>
                <div className="profile-stats">
                  <Link to="/orders" className="profile-stat-card">
                    <span className="profile-stat-value">{orders.length}</span>
                    <span className="profile-stat-label">Đơn mua</span>
                  </Link>
                  <Link to="/seller-orders" className="profile-stat-card">
                    <span className="profile-stat-value">{sellerOrders.length}</span>
                    <span className="profile-stat-label">Đơn bán</span>
                  </Link>
                  <Link to="/my-shop" className="profile-stat-card">
                    <span className="profile-stat-value">{productCount}</span>
                    <span className="profile-stat-label">Sách đang bán</span>
                  </Link>
                  <Link to="/cart" className="profile-stat-card">
                    <span className="profile-stat-value">{cartCount}</span>
                    <span className="profile-stat-label">Trong giỏ hàng</span>
                  </Link>
                </div>
              </section>

              <section id="profile-shop" className="profile-section-card" aria-labelledby="profile-shop-title">
                <h2 id="profile-shop-title" className="profile-section-title">Gian hàng của tôi</h2>
                {!shopChecked ? (
                  <p>Đang tải gian hàng...</p>
                ) : shop ? (
                  <div className="profile-shop-box">
                    {shop.avatar ? (
                      <img
                        className="profile-shop-avatar"
                        src={productImageUrl(shop.avatar)}
                        alt={shop.name}
                      />
                    ) : (
                      <div className="profile-shop-avatar profile-shop-avatar--empty" aria-hidden="true">
                        {shop.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                    )}
                    <div className="profile-shop-info">
                      <strong>{shop.name}</strong>
                      <span>{shop.description || 'Chưa có mô tả gian hàng.'}</span>
                      <span className="profile-shop-meta">{productCount} sách đang bán</span>
                    </div>
                    <div className="profile-shop-actions">
                      <Button variant="primary" size="sm" onClick={() => navigate('/my-shop')}>
                        Quản lý gian hàng
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate('/my-products/new')}>
                        Đăng sách mới
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/shops/${shop._id || shop.id}`)}
                      >
                        Xem gian hàng
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-shop-box">
                    <div className="profile-shop-info">
                      <strong>Bạn chưa có gian hàng</strong>
                      <span>Tạo gian hàng để bắt đầu đăng bán sách cũ của bạn.</span>
                    </div>
                    <div className="profile-shop-actions">
                      <Button variant="primary" size="sm" onClick={() => navigate('/my-shop')}>
                        Tạo gian hàng
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              <section className="profile-section-card" aria-labelledby="profile-orders-title">
                <div className="profile-section-head">
                  <h2 id="profile-orders-title" className="profile-section-title">Đơn hàng gần đây</h2>
                  <Link to="/orders" className="profile-section-link">Xem tất cả</Link>
                </div>
                {recentOrders.length === 0 ? (
                  <p className="profile-section-empty">
                    Bạn chưa có đơn hàng nào. <Link to="/">Khám phá sách cũ</Link> để mua cuốn đầu tiên.
                  </p>
                ) : (
                  <ul className="profile-order-list">
                    {recentOrders.map((order) => {
                      const id = order._id || order.id;
                      return (
                        <li key={id} className="profile-order-item">
                          <span className="profile-order-code">
                            {order.code || order.orderCode
                              ? `Đơn ${order.code || order.orderCode}`
                              : `Đơn #${String(id).slice(-6)}`}
                          </span>
                          <span className="profile-order-date">{formatDate(order.createdAt)}</span>
                          <span className="profile-order-total">{formatPrice(getOrderTotal(order))}</span>
                          <span className={`profile-order-status profile-order-status--${order.status || 'pending'}`}>
                            {ORDER_STATUS_LABELS[order.status] || order.status || 'Chờ xác nhận'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="profile-section-note">
                  Đơn bán của bạn: {sellerOrders.length} đơn. <Link to="/seller-orders">Quản lý đơn bán</Link>
                </p>
              </section>

              <section id="profile-account" className="profile-section-card" aria-labelledby="profile-edit-title">
                <h2 id="profile-edit-title" className="profile-section-title">Thông tin tài khoản</h2>
                <dl className="profile-account-info">
                  <div>
                    <dt>Email</dt>
                    <dd>{user.email || 'Chưa có email'}</dd>
                  </div>
                  <div>
                    <dt>Vai trò</dt>
                    <dd>{user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</dd>
                  </div>
                  <div>
                    <dt>Gian hàng</dt>
                    <dd>{shop ? shop.name : 'Chưa có gian hàng'}</dd>
                  </div>
                </dl>
                <form onSubmit={handleSave} noValidate>
                  <Input
                    id="profile-fullname"
                    label="Họ và tên"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={fieldError}
                    required
                    autoComplete="name"
                  />
                  <p>Địa chỉ email không đổi ở đây. Mật khẩu và vai trò cũng vậy.</p>
                  <Button type="submit" variant="primary" loading={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </form>
              </section>
            </div>
          </div>
        ) : (
          <div className="profile-empty">
            <h2>Chưa có thông tin tài khoản</h2>
            <p>Đăng nhập để xem hồ sơ của bạn.</p>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
