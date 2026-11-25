import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../utils/auth';
import { getSellerOrders, updateOrderStatus } from '../../utils/api';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import Alert from '../../components/common/Alert';
import './SellerOrders.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + ' đ';

const formatDate = (value) => {
  if (!value) return 'Không rõ';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('vi-VN');
};

const toArray = (res) =>
  Array.isArray(res) ? res : res?.orders || res?.data || res?.items || [];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const getOrderId = (o) => o._id || o.id;
const getOrderTotal = (o) =>
  o.total ?? o.totalAmount ?? o.totalPrice ?? o.amount ?? 0;
const getItemName = (item) => item.productName || item.name || item.product?.name || 'Sách';
const getItemPrice = (item) => item.price ?? item.product?.price ?? 0;

export default function SellerOrders() {
  const [user] = useState(getCurrentUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSellerOrders()
      .then((res) => {
        if (!cancelled) setOrders(toArray(res));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Không tải được đơn hàng của gian hàng.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStatusChange = async (order, nextStatus) => {
    const id = getOrderId(order);
    if (nextStatus === order.status) return;
    setUpdatingId(id);
    setError('');
    setSuccess('');
    try {
      await updateOrderStatus(id, nextStatus);
      setOrders((list) =>
        list.map((o) => (getOrderId(o) === id ? { ...o, status: nextStatus } : o))
      );
      setSuccess(`Đã đổi trạng thái đơn ${order.code || order.orderCode || `#${String(id).slice(-6)}`} thành "${STATUS_OPTIONS.find((s) => s.value === nextStatus)?.label}".`);
    } catch (err) {
      setError(err?.message || 'Đổi trạng thái đơn hàng không thành công.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="home-container seller-orders-page">
      <MarketplaceHeader user={user} />
      <main className="seller-orders-content">
        <h1 className="seller-orders-title">Đơn hàng của gian hàng</h1>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        )}

        {loading ? (
          <p>Đang tải đơn hàng...</p>
        ) : orders.length === 0 ? (
          <p className="seller-orders-empty">
            Chưa có đơn hàng nào chứa sách của gian hàng bạn.
          </p>
        ) : (
          <ul className="seller-orders-list">
            {orders.map((order) => {
              const id = getOrderId(order);
              const items = order.items || [];
              return (
                <li key={id} className="seller-orders-item">
                  <div className="seller-orders-head">
                    <span className="seller-orders-code">
                      {order.code || order.orderCode ? `Đơn ${order.code || order.orderCode}` : `Đơn #${String(id).slice(-6)}`}
                    </span>
                    <span className="seller-orders-date">{formatDate(order.createdAt)}</span>
                    <span className="seller-orders-total">{formatPrice(getOrderTotal(order))}</span>
                    <span className="seller-orders-buyer">
                      {order.buyer?.name || order.buyer?.fullName || order.buyerName || order.user?.name || 'Người mua'}
                    </span>
                  </div>

                  <ul className="seller-orders-items">
                    {items.map((item, index) => (
                      <li key={item._id || item.product?._id || index}>
                        {getItemName(item)} · {formatPrice(getItemPrice(item))} × {item.quantity ?? 0}
                      </li>
                    ))}
                  </ul>

                  {order.address && (
                    <p className="seller-orders-address">
                      <strong>Giao tới:</strong> {order.address}
                    </p>
                  )}

                  <div className="seller-orders-status-row">
                    <label htmlFor={`seller-order-status-${id}`}>
                      Trạng thái đơn
                    </label>
                    <select
                      id={`seller-order-status-${id}`}
                      className="seller-orders-select"
                      value={order.status || 'pending'}
                      disabled={updatingId === id}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {updatingId === id && <span className="seller-orders-updating">Đang lưu...</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
