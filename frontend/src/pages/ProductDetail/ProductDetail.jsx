import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { addToCart, createReport, getProduct, productImageUrl } from '../../utils/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import './ProductDetail.css';

function formatPrice(price) {
  const value = Number(price);
  if (Number.isNaN(value)) return price;
  return `${value.toLocaleString('vi-VN')} đ`;
}

function getShopId(product) {
  if (!product.shop) return null;
  return typeof product.shop === 'string' ? product.shop : product.shop._id;
}

function getShopName(product) {
  if (!product.shop) return '';
  return typeof product.shop === 'string' ? '' : product.shop.name || '';
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError('');
      }
    });
    getProduct(id)
      .then((data) => {
        if (!cancelled) setProduct(data.product || data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Không tải được thông tin sách.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const stock = product?.stock ?? 0;
  const outOfStock = stock <= 0;

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (Number.isNaN(value)) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.min(Math.max(1, value), Math.max(1, stock)));
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setAdding(true);
    setNotice('');
    setError('');
    try {
      await addToCart(product._id, quantity);
      setNotice(`Đã thêm ${quantity} cuốn "${product.name}" vào giỏ hàng.`);
    } catch (err) {
      setError(err.message || 'Không thêm được vào giỏ hàng.');
    } finally {
      setAdding(false);
    }
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    const reason = reportReason.trim();
    if (!reason) {
      setReportError('Vui lòng nhập lý do báo cáo.');
      return;
    }
    setReporting(true);
    setReportError('');
    try {
      // Backend nhận payload { product, reason } (xem ghi chú trong utils/api.js).
      await createReport({ product: product._id, reason });
      setNotice('Đã gửi báo cáo vi phạm. Cảm ơn bạn đã phản hồi.');
      setReportReason('');
      setShowReportForm(false);
    } catch (err) {
      setReportError(err.message || 'Không gửi được báo cáo.');
    } finally {
      setReporting(false);
    }
  };

  const mainImage = productImageUrl(product?.images?.[0]);

  return (
    <div className="product-detail-container">
      <MarketplaceHeader user={user} />

      <main className="product-detail-main">
        {loading ? (
          <p className="product-detail-status">Đang tải thông tin sách...</p>
        ) : error && !product ? (
          <Alert type="error" message={error} />
        ) : !product ? (
          <Alert type="warning" message="Không tìm thấy cuốn sách này." />
        ) : (
          <div className="product-detail-content">
            {notice && <Alert type="success" message={notice} onClose={() => setNotice('')} />}
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="product-detail-layout">
              <div className="product-detail-gallery">
                {mainImage ? (
                  <img src={mainImage} alt={product.name} className="product-detail-image" />
                ) : (
                  <div className="product-detail-image-placeholder">Không có ảnh</div>
                )}
                {product.images?.length > 1 && (
                  <div className="product-detail-thumbnails">
                    {product.images.map((image, index) => (
                      <img
                        key={`${image}-${index}`}
                        src={productImageUrl(image)}
                        alt={`${product.name} - ảnh ${index + 1}`}
                        className="product-detail-thumbnail"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="product-detail-info">
                <h1 className="product-detail-name">{product.name}</h1>
                {product.author && (
                  <p className="product-detail-author">Tác giả: {product.author}</p>
                )}
                <p className="product-detail-price">{formatPrice(product.price)}</p>

                <dl className="product-detail-meta">
                  <div className="product-detail-meta-row">
                    <dt>Tình trạng</dt>
                    <dd>{product.condition === 'used' ? 'Cũ' : 'Mới'}</dd>
                  </div>
                  <div className="product-detail-meta-row">
                    <dt>Số lượng còn</dt>
                    <dd className={outOfStock ? 'out-of-stock' : ''}>
                      {outOfStock ? 'Hết hàng' : `${stock} cuốn`}
                    </dd>
                  </div>
                  {product.category?.name && (
                    <div className="product-detail-meta-row">
                      <dt>Thể loại</dt>
                      <dd>{product.category.name}</dd>
                    </div>
                  )}
                  {getShopName(product) && (
                    <div className="product-detail-meta-row">
                      <dt>Gian hàng</dt>
                      <dd>
                        {getShopId(product) ? (
                          <Link to={`/shops/${getShopId(product)}`}>{getShopName(product)}</Link>
                        ) : (
                          getShopName(product)
                        )}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="product-detail-purchase">
                  <Input
                    id="product-detail-quantity"
                    label="Số lượng"
                    type="number"
                    min="1"
                    max={Math.max(1, stock)}
                    value={quantity}
                    onChange={handleQuantityChange}
                    disabled={outOfStock}
                  />
                  {user ? (
                    <Button
                      variant="accent"
                      size="lg"
                      disabled={outOfStock}
                      loading={adding}
                      onClick={handleAddToCart}
                    >
                      Thêm vào giỏ
                    </Button>
                  ) : (
                    <Button variant="accent" size="lg" onClick={() => navigate('/login')}>
                      Đăng nhập để thêm vào giỏ
                    </Button>
                  )}
                </div>

                {user && (
                  <div className="product-detail-report">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReportForm((prev) => !prev)}
                    >
                      {showReportForm ? 'Đóng báo cáo' : 'Báo cáo vi phạm'}
                    </Button>

                    {showReportForm && (
                      <form className="product-detail-report-form" onSubmit={handleReportSubmit}>
                        <label htmlFor="product-detail-report-reason" className="product-detail-report-label">
                          Lý do báo cáo
                        </label>
                        <textarea
                          id="product-detail-report-reason"
                          className="product-detail-report-textarea"
                          rows="4"
                          value={reportReason}
                          onChange={(event) => setReportReason(event.target.value)}
                          placeholder="Ví dụ: sách giả, mô tả sai sự thật, giá không đúng..."
                        />
                        {reportError && <Alert type="error" message={reportError} />}
                        <Button type="submit" variant="primary" size="sm" loading={reporting}>
                          Gửi báo cáo
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {product.description && (
              <section className="product-detail-description">
                <h2>Mô tả</h2>
                <p>{product.description}</p>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
