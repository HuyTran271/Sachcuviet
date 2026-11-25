import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { addToCart, listCategories, listProducts, productImageUrl } from '../../utils/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import './Home.css';

const PAGE_LIMIT = 12;

const EMPTY_FILTERS = { q: '', category: '', minPrice: '', maxPrice: '', condition: '' };

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

export default function Home() {
  const [user] = useState(getCurrentUser);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Bộ lọc đang nhập (chưa áp dụng) và bộ lọc đã áp dụng để gọi API.
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (!cancelled) setCategories(Array.isArray(data) ? data : data.categories || []);
      })
      .catch(() => {
        // Không chặn trang chủ nếu chỉ lỗi tải thể loại.
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchProducts = useCallback(async (filters, targetPage) => {
    setLoading(true);
    setError('');
    try {
      const data = await listProducts({ ...filters, page: targetPage, limit: PAGE_LIMIT });
      setProducts(data.products || []);
      setPage(data.page || targetPage);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total ?? (data.products || []).length);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách sách.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Goi qua microtask de khong setState dong bo trong effect (eslint react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      fetchProducts(appliedFilters, page);
    });
  }, [appliedFilters, page, fetchProducts]);

  const handleFilterChange = (field) => (event) => {
    setDraftFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setNotice('');
    setAppliedFilters(draftFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
    setNotice('');
  };

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

  return (
    <div className="home-container">
      <MarketplaceHeader user={user} />

      <main className="home-main">
        <div className="home-content">
          <h1 className="home-title">Khám phá sách cũ</h1>
          <p className="home-subtitle">Tìm cuốn sách bạn cần từ các gian hàng trên Sách Cũ Việt.</p>

          <form className="home-filters" onSubmit={handleSearch}>
            <Input
              id="home-search"
              label="Tìm kiếm"
              type="text"
              value={draftFilters.q}
              onChange={handleFilterChange('q')}
              placeholder="Tìm theo tên sách hoặc tác giả"
            />

            <div className="home-filter-field">
              <label htmlFor="home-category" className="home-filter-label">Thể loại</label>
              <select
                id="home-category"
                className="home-filter-select"
                value={draftFilters.category}
                onChange={handleFilterChange('category')}
              >
                <option value="">Tất cả thể loại</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="home-min-price"
              label="Giá tối thiểu"
              type="number"
              min="0"
              value={draftFilters.minPrice}
              onChange={handleFilterChange('minPrice')}
              placeholder="0"
            />

            <Input
              id="home-max-price"
              label="Giá tối đa"
              type="number"
              min="0"
              value={draftFilters.maxPrice}
              onChange={handleFilterChange('maxPrice')}
              placeholder="Không giới hạn"
            />

            <div className="home-filter-field">
              <label htmlFor="home-condition" className="home-filter-label">Tình trạng</label>
              <select
                id="home-condition"
                className="home-filter-select"
                value={draftFilters.condition}
                onChange={handleFilterChange('condition')}
              >
                <option value="">Tất cả</option>
                <option value="new">Mới</option>
                <option value="used">Cũ</option>
              </select>
            </div>

            <div className="home-filter-actions">
              <Button type="submit" variant="primary" size="md">
                Tìm / Lọc
              </Button>
              <Button type="button" variant="outline" size="md" onClick={handleClearFilters}>
                Xóa lọc
              </Button>
            </div>
          </form>

          {notice && <Alert type="success" message={notice} onClose={() => setNotice('')} />}
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          {loading ? (
            <p className="home-status">Đang tải danh sách sách...</p>
          ) : products.length === 0 ? (
            <p className="home-status">Không tìm thấy cuốn sách nào phù hợp.</p>
          ) : (
            <>
              <p className="home-result-count">
                {total > 0 ? `Tìm thấy ${total} cuốn sách` : `${products.length} cuốn sách`}
              </p>

              <div className="home-product-grid">
                {products.map((product) => {
                  const outOfStock = (product.stock ?? 0) <= 0;
                  const shopId = getShopId(product);
                  return (
                    <article
                      key={product._id}
                      className="home-product-card"
                      onClick={() => navigate(`/products/${product._id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') navigate(`/products/${product._id}`);
                      }}
                    >
                      <div className="home-product-image-wrap">
                        {productImageUrl(product.images?.[0]) ? (
                          <img
                            src={productImageUrl(product.images[0])}
                            alt={product.name}
                            className="home-product-image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="home-product-image-placeholder">Không có ảnh</div>
                        )}
                        <span className="home-product-condition">
                          {product.condition === 'used' ? 'Cũ' : 'Mới'}
                        </span>
                      </div>

                      <div className="home-product-body">
                        <h2 className="home-product-name">{product.name}</h2>
                        {product.author && (
                          <p className="home-product-author">{product.author}</p>
                        )}
                        <p className="home-product-price">{formatPrice(product.price)}</p>
                        {getShopName(product) && (
                          <p className="home-product-shop">{getShopName(product)}</p>
                        )}
                        <p className={`home-product-stock ${outOfStock ? 'out-of-stock' : ''}`}>
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
                        {user && shopId && (
                          <button
                            type="button"
                            className="home-product-shop-link"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/shops/${shopId}`);
                            }}
                          >
                            Xem gian hàng
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="home-pagination">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Trang trước
                </Button>
                <span className="home-pagination-info">
                  Trang {page}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Trang sau
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
