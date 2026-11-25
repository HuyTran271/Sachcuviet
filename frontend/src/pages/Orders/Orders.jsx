import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { getMyOrders } from '../../utils/api';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import './Orders.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + ' đ';

const formatDate = (value) => {
  if (!value) return 'Không rõ';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('vi-VN');
};

const toArray = (res) =>
  Array.isArray(res) ? res : res?.orders || res?.data || res?.items || [];

const ORDER_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const PAYMENT_LABELS = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản',
};

const getOrderId = (o) => o._id || o.id;
const getOrderTotal = (o) =>
  o.total ?? o.totalAmount ?? o.totalPrice ?? o.amount ?? 0;
const getItemName = (item) => item.productName || item.name || item.product?.name || 'Sách';
const getItemPrice = (item) => item.price ?? item.product?.price ?? 0;
const getItemSubtotal = (item) =>
  item.subtotal ?? (Number(getItemPrice(item)) || 0) * (Number(item.quantity) || 0);

export default function Orders() {
  const location = useLocation();
  const [user] = useState(getCurrentUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [openOrderId, setOpenOrderId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyOrders()
      .then((res) => {
        if (!cancelled) setOrders(toArray(res));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Không tải được danh sách đơn hàng.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleOrder = (id) => {
    setOpenOrderId((current) => (current === id ? null : id));
  };

  return (
    <div className="home-container orders-page">
      <MarketplaceHeader user={user} />
      <main className="orders-content">
        <h1 className="orders-title">Đơn hàng của tôi</h1>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        )}

        {loading ? (
          <p>Đang tải đơn hàng...</p>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <p>Bạn chưa có đơn hàng nào.</p>
            <Link to="/">
              <Button variant="primary">Về trang chủ chọn sách</Button>
            </Link>
          </div>
        ) : (
          <ul className="orders-list">
            {orders.map((order) => {
              const id = getOrderId(order);
              const isOpen = openOrderId === id;
              const items = order.items || [];
              return (
                <li key={id} className="orders-item">
                  <button
                    type="button"
                    className="orders-summary"
                    onClick={() => toggleOrder(id)}
                    aria-expanded={isOpen}
                  >
                    <span className="orders-code">
                      {order.code || order.orderCode ? `Đơn ${order.code || order.orderCode}` : `Đơn #${String(id).slice(-6)}`}
                    </span>
                    <span className="orders-date">{formatDate(order.createdAt)}</span>
                    <span className="orders-total">{formatPrice(getOrderTotal(order))}</span>
                    <span className={`orders-status orders-status--${order.status || 'pending'}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status || 'Chờ xác nhận'}
                    </span>
                    <span className="orders-toggle">{isOpen ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="orders-detail">
                      <p>
                        <strong>Phương thức thanh toán:</strong>{' '}
                        {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || 'Không rõ'}
                      </p>
                      <p>
                        <strong>Địa chỉ nhận hàng:</strong> {order.address || 'Không rõ'}
                      </p>
                      {items.length === 0 ? (
                        <p className="orders-detail-empty">Đơn này không có chi tiết sách.</p>
                      ) : (
                        <table className="orders-table">
                          <thead>
                            <tr>
                              <th>Sách</th>
                              <th>Đơn giá</th>
                              <th>Số lượng</th>
                              <th>Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, index) => (
                              <tr key={item._id || item.product?._id || index}>
                                <td>{getItemName(item)}</td>
                                <td>{formatPrice(getItemPrice(item))}</td>
                                <td>{item.quantity ?? 0}</td>
                                <td>{formatPrice(getItemSubtotal(item))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
