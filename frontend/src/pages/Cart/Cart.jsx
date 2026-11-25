import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import {
  getCart,
  updateCartItem,
  removeCartItem,
  productImageUrl,
} from '../../utils/api';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import './Cart.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + ' đ';

const getItems = (res) =>
  Array.isArray(res) ? res : res?.items || res?.cart?.items || res?.data?.items || [];

const getProduct = (item) => item.product || {};
const getProductId = (item) => getProduct(item)._id || getProduct(item).id || item.productId;

export default function Cart() {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await getCart();
      setItems(getItems(res));
    } catch (err) {
      setError(err?.message || 'Không tải được giỏ hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Goi qua microtask de khong setState dong bo trong effect.
    queueMicrotask(() => {
      loadCart();
    });
  }, []);

  const handleChangeQuantity = async (item, nextQuantity) => {
    const productId = getProductId(item);
    if (nextQuantity < 1) {
      // Giam ve 0 thi xoa khoi gio.
      await handleRemove(item);
      return;
    }
    setUpdatingId(productId);
    setError('');
    try {
      const res = await updateCartItem(productId, nextQuantity);
      const fresh = getItems(res);
      if (fresh.length > 0 || res) {
        // Neu API tra ve gio moi thi dung luon, neu khong thi cap nhat cuc bo.
        setItems(fresh.length > 0 ? fresh : items.map((i) =>
          getProductId(i) === productId ? { ...i, quantity: nextQuantity } : i
        ));
      }
    } catch (err) {
      setError(err?.message || 'Cập nhật số lượng không thành công.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (item) => {
    const productId = getProductId(item);
    if (!window.confirm(`Xóa "${getProduct(item).name || 'sách này'}" khỏi giỏ hàng?`)) return;
    setUpdatingId(productId);
    setError('');
    try {
      const res = await removeCartItem(productId);
      const fresh = getItems(res);
      setItems(
        res && (Array.isArray(res) || res.items || res.cart)
          ? fresh
          : items.filter((i) => getProductId(i) !== productId)
      );
    } catch (err) {
      setError(err?.message || 'Xóa khỏi giỏ hàng không thành công.');
    } finally {
      setUpdatingId(null);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + (Number(getProduct(item).price) || 0) * (Number(item.quantity) || 0),
    0
  );

  return (
    <div className="home-container cart-page">
      <MarketplaceHeader user={user} />
      <main className="cart-content">
        <h1 className="cart-title">Giỏ hàng</h1>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {loading ? (
          <p>Đang tải giỏ hàng...</p>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <p>Giỏ hàng của bạn đang trống.</p>
            <Link to="/">
              <Button variant="primary">Về trang chủ chọn sách</Button>
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <ul className="cart-list">
              {items.map((item, index) => {
                const product = getProduct(item);
                const productId = getProductId(item) || `item-${index}`;
                const cover = product.images?.[0] || product.image;
                const price = Number(product.price) || 0;
                const quantity = Number(item.quantity) || 0;
                return (
                  <li key={productId} className="cart-item">
                    {cover ? (
                      <img
                        className="cart-item-cover"
                        src={productImageUrl(cover)}
                        alt={product.name || 'Bìa sách'}
                      />
                    ) : (
                      <div className="cart-item-cover cart-item-cover--empty" aria-hidden="true">
                        Không có ảnh
                      </div>
                    )}
                    <div className="cart-item-info">
                      <strong>{product.name || item.productName || 'Sách'}</strong>
                      <span className="cart-item-price">{formatPrice(price)}</span>
                      {product.author && (
                        <span className="cart-item-meta">{product.author}</span>
                      )}
                    </div>
                    <div className="cart-item-qty" aria-label="Số lượng">
                      <button
                        type="button"
                        className="cart-qty-btn"
                        disabled={updatingId === productId || quantity <= 1}
                        onClick={() => handleChangeQuantity(item, quantity - 1)}
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <span className="cart-qty-value">{quantity}</span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        disabled={updatingId === productId}
                        onClick={() => handleChangeQuantity(item, quantity + 1)}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>
                    <span className="cart-item-subtotal">{formatPrice(price * quantity)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updatingId === productId}
                      onClick={() => handleRemove(item)}
                    >
                      Xóa
                    </Button>
                  </li>
                );
              })}
            </ul>

            <aside className="cart-summary">
              <h2>Tạm tính</h2>
              <p className="cart-total">
                <span>Tổng tiền</span>
                <strong>{formatPrice(total)}</strong>
              </p>
              <p className="cart-summary-note">
                {items.length} loại sách, tổng {items.reduce((n, i) => n + (Number(i.quantity) || 0), 0)} cuốn.
              </p>
              <Button variant="primary" fullWidth onClick={() => navigate('/checkout')}>
                Tiến hành đặt hàng
              </Button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
