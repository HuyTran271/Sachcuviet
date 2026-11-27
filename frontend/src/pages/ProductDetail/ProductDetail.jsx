import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { getProduct, productImageUrl } from '../../utils/api';
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
  const [user] = useState(getCurrentUser);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');



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
