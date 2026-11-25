import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { getCart, checkoutOrder, productImageUrl } from '../../utils/api';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import './Checkout.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + ' đ';

const getItems = (res) =>
  Array.isArray(res) ? res : res?.items || res?.cart?.items || res?.data?.items || [];

const getProduct = (item) => item.product || {};
const getProductId = (item) => getProduct(item)._id || getProduct(item).id || item.productId;

export default function Checkout() {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Idempotency-Key on dinh trong suot 1 lan mo trang checkout: moi lan
  // bam "Dat hang" (ke ca bam lai sau khi mang loi) deu gui cung key,
  // server chi tao 1 don. Mo lai trang thi sinh key moi cho lan checkout moi.
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    let cancelled = false;
    getCart()
      .then((res) => {
        if (!cancelled) setItems(getItems(res));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Không tải được giỏ hàng.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = items.reduce(
    (sum, item) => sum + (Number(getProduct(item).price) || 0) * (Number(item.quantity) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!address.trim()) {
      setError('Vui lòng nhập địa chỉ nhận hàng (kèm số điện thoại liên hệ).');
      return;
    }
    if (items.length === 0) {
      setError('Giỏ hàng đang trống, không thể đặt hàng.');
      return;
    }
    setSubmitting(true);
    try {
      await checkoutOrder(
        {
          items: items.map((i) => ({
            product: getProductId(i),
            quantity: Number(i.quantity) || 0,
          })),
          address: address.trim(),
          paymentMethod,
        },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
      navigate('/orders', {
        state: { message: 'Đặt hàng thành công. Cảm ơn bạn đã mua sách tại Sách Cũ Việt!' },
      });
    } catch (err) {
      setError(err?.message || 'Đặt hàng không thành công. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home-container checkout-page">
      <MarketplaceHeader user={user} />
      <main className="checkout-content">
        <h1 className="checkout-title">Thanh toán</h1>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {loading ? (
          <p>Đang tải giỏ hàng...</p>
        ) : items.length === 0 ? (
          <div className="checkout-empty">
            <p>Giỏ hàng của bạn đang trống, không có gì để thanh toán.</p>
            <Link to="/cart">
              <Button variant="primary">Xem giỏ hàng</Button>
            </Link>
          </div>
        ) : (
          <div className="checkout-layout">
            <form className="checkout-card" onSubmit={handleSubmit} noValidate>
              <h2>Thông tin nhận hàng</h2>
              <div className="checkout-field">
                <label htmlFor="checkout-address" className="checkout-label">
                  Địa chỉ nhận hàng (kèm số điện thoại) <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="checkout-address"
                  className="checkout-textarea"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={'Ví dụ: 123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh\nSĐT: 0901234567'}
                  rows={4}
                  required
                />
                <p className="checkout-hint">
                  Số điện thoại nằm trong địa chỉ vì lúc đăng ký hệ thống không thu số điện thoại.
                </p>
              </div>

              <div className="checkout-field">
                <label htmlFor="checkout-payment" className="checkout-label">
                  Phương thức thanh toán <span aria-hidden="true">*</span>
                </label>
                <select
                  id="checkout-payment"
                  className="checkout-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                  <option value="bank_transfer">Chuyển khoản</option>
                </select>
                {paymentMethod === 'bank_transfer' && (
                  <p className="checkout-hint">
                    Bạn chuyển khoản sau khi đặt hàng; người bán xác nhận rồi mới giao sách.
                  </p>
                )}
              </div>

              <Button type="submit" variant="primary" loading={submitting} fullWidth>
                {submitting ? 'Đang đặt hàng...' : `Đặt hàng · ${formatPrice(total)}`}
              </Button>
            </form>

            <aside className="checkout-card checkout-summary">
              <h2>Đơn hàng của bạn</h2>
              <ul className="checkout-list">
                {items.map((item, index) => {
                  const product = getProduct(item);
                  const cover = product.images?.[0] || product.image;
                  const price = Number(product.price) || 0;
                  const quantity = Number(item.quantity) || 0;
                  return (
                    <li key={getProductId(item) || `item-${index}`} className="checkout-item">
                      {cover && (
                        <img
                          className="checkout-thumb"
                          src={productImageUrl(cover)}
                          alt={product.name || 'Bìa sách'}
                        />
                      )}
                      <div className="checkout-item-info">
                        <strong>{product.name || item.productName || 'Sách'}</strong>
                        <span className="checkout-item-meta">
                          {formatPrice(price)} × {quantity}
                        </span>
                      </div>
                      <span className="checkout-item-subtotal">{formatPrice(price * quantity)}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="checkout-total">
                <span>Tổng tiền</span>
                <strong>{formatPrice(total)}</strong>
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
