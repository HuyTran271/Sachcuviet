import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { addToCart, getShop, listProducts, productImageUrl } from '../../utils/api';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import './ShopPublic.css';

function formatPrice(price) {
  const value = Number(price);
  if (Number.isNaN(value)) return price;
  return `${value.toLocaleString('vi-VN')} đ`;
}

export default function ShopPublic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser);

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
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

    // Backend loc san pham theo shop o GET /products?shop=<id>,
    // frontend chi viec lay dung sach cua shop nay (toi da 100).
    Promise.all([getShop(id), listProducts({ shop: id, limit: 100 })])
      .then(([shopData, productsData]) => {
        if (cancelled) return;
        setShop(shopData.shop || shopData);
        setProducts(productsData.products || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Không tải được thông tin gian hàng.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAddToCart = async (event, product) => {
    event.stopPropagation();
    setNotice('');
    setError('');
    try {
      await addToCart(product._id, 1);
      setNotice(`Đã thêm "${product.name}" vào giỏ hàng.`);
    } catch (err) {
      setError(err.message || 'Không thêm được vào giỏ hàng.');
    }
  };

  const shopAvatar = productImageUrl(shop?.avatar);
  const ownerName = shop?.owner?.name || shop?.owner?.fullName || '';

  return (
    <div className="shop-public-container">
      <MarketplaceHeader user={user} />

      <main className="shop-public-main">
        {loading ? (
          <p className="shop-public-status">Đang tải thông tin gian hàng...</p>
        ) : error && !shop ? (
          <Alert type="error" message={error} />
        ) : !shop ? (
          <Alert type="warning" message="Không tìm thấy gian hàng này." />
        ) : (
          <div className="shop-public-content">
            {notice && <Alert type="success" message={notice} onClose={() => setNotice('')} />}
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <section className="shop-public-header">
              {shopAvatar ? (
                <img src={shopAvatar} alt={shop.name} className="shop-public-avatar" />
              ) : (
                <div className="shop-public-avatar-placeholder">
                  {(shop.name || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="shop-public-header-info">
                <h1 className="shop-public-name">{shop.name}</h1>
                {ownerName && <p className="shop-public-owner">Chủ gian hàng: {ownerName}</p>}
                {shop.description && <p className="shop-public-description">{shop.description}</p>}
              </div>
            </section>

            <h2 className="shop-public-section-title">
              Sách của gian hàng ({products.length})
            </h2>

            {products.length === 0 ? (
              <p className="shop-public-status">Gian hàng chưa có sách nào.</p>
            ) : (
              <div className="shop-public-product-grid">
                {products.map((product) => {
                  const outOfStock = (product.stock ?? 0) <= 0;
                  return (
                    <article
                      key={product._id}
                      className="shop-public-product-card"
                      onClick={() => navigate(`/products/${product._id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') navigate(`/products/${product._id}`);
                      }}
                    >
                      <div className="shop-public-product-image-wrap">
                        {productImageUrl(product.images?.[0]) ? (
                          <img
                            src={productImageUrl(product.images[0])}
                            alt={product.name}
                            className="shop-public-product-image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="shop-public-product-image-placeholder">Không có ảnh</div>
                        )}
                        <span className="shop-public-product-condition">
                          {product.condition === 'used' ? 'Cũ' : 'Mới'}
                        </span>
                      </div>

                      <div className="shop-public-product-body">
                        <h3 className="shop-public-product-name">{product.name}</h3>
                        {product.author && (
                          <p className="shop-public-product-author">{product.author}</p>
                        )}
                        <p className="shop-public-product-price">{formatPrice(product.price)}</p>
                        <p className={`shop-public-product-stock ${outOfStock ? 'out-of-stock' : ''}`}>
                          {outOfStock ? 'Hết hàng' : `Còn hàng (${product.stock})`}
                        </p>

                        {user && (
                          <Button
                            variant="accent"
                            size="sm"
                            disabled={outOfStock}
                            onClick={(event) => handleAddToCart(event, product)}
                          >
                            Thêm vào giỏ
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
