import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import {
  getMyShop,
  createShop,
  updateMyShop,
  listProducts,
  deleteProduct,
  productImageUrl,
} from '../../utils/api';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import './MyShop.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + ' đ';

const toArray = (res) =>
  Array.isArray(res) ? res : res?.products || res?.data || res?.items || [];

export default function MyShop() {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser);
  const [shop, setShop] = useState(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  const [myProducts, setMyProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // loading khoi tao da la true, khong setState dong bo trong effect.
    getMyShop()
      .then((res) => {
        if (cancelled) return;
        const found = res?.shop || res?.data || res;
        if (found && (found._id || found.id || found.name)) {
          setShop(found);
          setName(found.name || '');
          setDescription(found.description || '');
        } else {
          setShop(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Chua co shop thuong tra 404 / message "chua co gian hang": coi nhu
        // chua co shop, hien form tao. Loi khac thi bao len Alert.
        const msg = err?.message || '';
        if (!/404|chưa có|không có|not found|no shop/i.test(msg)) {
          setError(msg || 'Không tải được gian hàng của bạn.');
        }
        setShop(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setChecked(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!shop) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setProductsLoading(true);
    });
    listProducts()
      .then((res) => {
        if (cancelled) return;
        const shopId = String(shop._id || shop.id || '');
        setMyProducts(
          toArray(res).filter(
            (p) => String(p.shop?._id ?? p.shop ?? p.shopId ?? '') === shopId
          )
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Không tải được sách của gian hàng.');
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
  }, [shop]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Vui lòng nhập tên gian hàng.');
      return;
    }
    // Mo ta va avatar duoc phep rong (backend mac dinh ''), chi bat buoc ten
    // de tao shop khong bi ket khi chua co anh/mo ta.
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    if (avatarFile) formData.append('avatar', avatarFile);

    setSaving(true);
    try {
      const res = shop
        ? await updateMyShop(formData)
        : await createShop(formData);
      const saved = res?.shop || res?.data || res;
      if (saved && (saved._id || saved.id || saved.name)) {
        setShop(saved);
        setName(saved.name || '');
        setDescription(saved.description || '');
      }
      setAvatarFile(null);
      setSuccess(
        shop ? 'Cập nhật gian hàng thành công.' : 'Tạo gian hàng thành công.'
      );
    } catch (err) {
      setError(err?.message || 'Lưu gian hàng không thành công.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    const id = product._id || product.id;
    if (!window.confirm(`Xóa sách "${product.name}" khỏi gian hàng?`)) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteProduct(id);
      setMyProducts((list) => list.filter((p) => (p._id || p.id) !== id));
      setSuccess(`Đã xóa sách "${product.name}".`);
    } catch (err) {
      setError(err?.message || 'Xóa sách không thành công.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="home-container myshop-page">
      <MarketplaceHeader user={user} />
      <main className="myshop-content">
        <h1 className="myshop-title">Gian hàng của tôi</h1>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        )}

        {loading ? (
          <p>Đang tải gian hàng...</p>
        ) : (
          <>
            <section className="myshop-card" aria-labelledby="myshop-form-title">
              <h2 id="myshop-form-title">
                {shop ? 'Cập nhật gian hàng' : 'Tạo gian hàng'}
              </h2>
              {shop?.avatar && (
                <img
                  className="myshop-avatar"
                  src={productImageUrl(shop.avatar)}
                  alt={`Ảnh đại diện gian hàng ${shop.name || ''}`}
                />
              )}
              <form onSubmit={handleSubmit} noValidate>
                <Input
                  id="myshop-name"
                  label="Tên gian hàng"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Tiệm sách cũ của Huy"
                  required
                />
                <div className="myshop-field">
                  <label htmlFor="myshop-description" className="myshop-label">
                    Mô tả gian hàng <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="myshop-description"
                    className="myshop-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Giới thiệu ngắn về gian hàng của bạn"
                    rows={4}
                    required
                  />
                </div>
                <div className="myshop-field">
                  <label htmlFor="myshop-avatar" className="myshop-label">
                    Ảnh đại diện {shop ? '(để trống nếu giữ ảnh cũ)' : ''}
                    {!shop && <span aria-hidden="true"> *</span>}
                  </label>
                  <input
                    id="myshop-avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="myshop-file"
                  />
                  {avatarFile && <p className="myshop-file-name">Đã chọn: {avatarFile.name}</p>}
                </div>
                <Button type="submit" variant="primary" loading={saving}>
                  {saving ? 'Đang lưu...' : shop ? 'Lưu thay đổi' : 'Tạo gian hàng'}
                </Button>
              </form>
            </section>

            {shop && (
              <section className="myshop-card" aria-labelledby="myshop-books-title">
                <div className="myshop-books-head">
                  <h2 id="myshop-books-title">Sách của gian hàng</h2>
                  <Button variant="primary" size="sm" onClick={() => navigate('/my-products/new')}>
                    Đăng sách mới
                  </Button>
                </div>
                {productsLoading ? (
                  <p>Đang tải sách...</p>
                ) : myProducts.length === 0 ? (
                  <p className="myshop-empty">
                    Gian hàng chưa có sách nào.{' '}
                    <Link to="/my-products/new">Đăng sách đầu tiên</Link>.
                  </p>
                ) : (
                  <ul className="myshop-book-list">
                    {myProducts.map((product) => {
                      const id = product._id || product.id;
                      const cover = product.images?.[0] || product.image;
                      return (
                        <li key={id} className="myshop-book-item">
                          {cover ? (
                            <img
                              className="myshop-book-cover"
                              src={productImageUrl(cover)}
                              alt={product.name}
                            />
                          ) : (
                            <div className="myshop-book-cover myshop-book-cover--empty" aria-hidden="true">
                              Không có ảnh
                            </div>
                          )}
                          <div className="myshop-book-info">
                            <strong>{product.name}</strong>
                            <span>{formatPrice(product.price)}</span>
                            <span className="myshop-book-meta">
                              Còn {product.stock ?? 0} cuốn
                              {product.status ? ` · ${product.status === 'active' ? 'Đang bán' : 'Đã ẩn'}` : ''}
                            </span>
                          </div>
                          <div className="myshop-book-actions">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/my-products/${id}/edit`)}
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              loading={deletingId === id}
                              onClick={() => handleDeleteProduct(product)}
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
            {checked && !shop && (
              <p className="myshop-hint">
                Bạn chưa có gian hàng. Tạo gian hàng để bắt đầu đăng bán sách cũ.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
