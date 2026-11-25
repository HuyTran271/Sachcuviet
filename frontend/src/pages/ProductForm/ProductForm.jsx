import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import {
  getProduct,
  getMyShop,
  listCategories,
  createProduct,
  updateProduct,
  productImageUrl,
} from '../../utils/api';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import './ProductForm.css';

const toArray = (res) =>
  Array.isArray(res) ? res : res?.categories || res?.data || res?.items || [];

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [user] = useState(getCurrentUser);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [condition, setCondition] = useState('used');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    getMyShop()
      .then((res) => {
        if (cancelled) return;
        const found = res?.shop || res?.data || res;
        if (!found || !(found._id || found.id || found.name)) {
          navigate('/my-shop', {
            state: { error: 'Bạn cần tạo gian hàng trước khi đăng sách.' },
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        navigate('/my-shop', {
          state: { error: 'Bạn cần tạo gian hàng trước khi đăng sách.' },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, navigate]);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((res) => {
        if (!cancelled) setCategories(toArray(res));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Không tải được danh sách thể loại.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    // loading khoi tao da la isEdit, khong setState dong bo trong effect.
    getProduct(id)
      .then((res) => {
        if (cancelled) return;
        const p = res?.product || res?.data || res;
        setName(p.name || '');
        setAuthor(p.author || '');
        setCategory(String(p.category?._id ?? p.category ?? ''));
        setPrice(p.price ?? '');
        setStock(p.stock ?? '');
        setCondition(p.condition || 'used');
        setDescription(p.description || '');
        setExistingImages(p.images || (p.image ? [p.image] : []));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Không tải được thông tin sách.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên sách.');
      return;
    }
    if (!category) {
      setError('Vui lòng chọn thể loại.');
      return;
    }
    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (price === '' || Number.isNaN(priceNum) || priceNum < 0) {
      setError('Giá bán phải là số và lớn hơn hoặc bằng 0.');
      return;
    }
    if (stock === '' || Number.isNaN(stockNum) || stockNum < 0) {
      setError('Số lượng phải là số và lớn hơn hoặc bằng 0.');
      return;
    }
    if (!description.trim()) {
      setError('Vui lòng nhập mô tả sách.');
      return;
    }
    if (!isEdit && imageFiles.length === 0) {
      setError('Vui lòng chọn ít nhất một ảnh cho sách.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('author', author.trim());
    formData.append('category', category);
    formData.append('price', String(priceNum));
    formData.append('stock', String(stockNum));
    formData.append('condition', condition);
    formData.append('description', description.trim());
    imageFiles.forEach((file) => formData.append('images', file));

    setSaving(true);
    try {
      if (isEdit) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }
      navigate('/my-shop', {
        state: {
          message: isEdit
            ? 'Cập nhật sách thành công.'
            : 'Đăng sách thành công.',
        },
      });
    } catch (err) {
      setError(err?.message || 'Lưu sách không thành công.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="home-container product-form-page">
      <MarketplaceHeader user={user} />
      <main className="product-form-content">
        <h1 className="product-form-title">
          {isEdit ? 'Chỉnh sửa sách' : 'Đăng sách mới'}
        </h1>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {loading ? (
          <p>Đang tải thông tin sách...</p>
        ) : (
          <form className="product-form-card" onSubmit={handleSubmit} noValidate>
            <Input
              id="product-name"
              label="Tên sách"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Dế Mèn phiêu lưu ký"
              required
            />
            <Input
              id="product-author"
              label="Tác giả"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ví dụ: Tô Hoài"
            />

            <div className="product-form-field">
              <label htmlFor="product-category" className="product-form-label">
                Thể loại <span aria-hidden="true">*</span>
              </label>
              <select
                id="product-category"
                className="product-form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Chọn thể loại</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {cat.name || cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="product-form-row">
              <Input
                id="product-price"
                label="Giá bán (VNĐ)"
                type="number"
                min="0"
                step="1000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                required
              />
              <Input
                id="product-stock"
                label="Số lượng"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="1"
                required
              />
            </div>

            <div className="product-form-field">
              <label htmlFor="product-condition" className="product-form-label">
                Tình trạng <span aria-hidden="true">*</span>
              </label>
              <select
                id="product-condition"
                className="product-form-select"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                required
              >
                <option value="used">Đã qua sử dụng</option>
                <option value="new">Mới</option>
              </select>
            </div>

            <div className="product-form-field">
              <label htmlFor="product-description" className="product-form-label">
                Mô tả <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="product-description"
                className="product-form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tình trạng sách, năm xuất bản, ghi chú cho người mua..."
                rows={5}
                required
              />
            </div>

            <div className="product-form-field">
              <label htmlFor="product-images" className="product-form-label">
                Ảnh sách {isEdit ? '(chọn thêm nếu muốn đổi/bổ sung ảnh)' : ''}
                {!isEdit && <span aria-hidden="true"> *</span>}
              </label>
              <input
                id="product-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                className="product-form-file"
              />
              {imageFiles.length > 0 && (
                <p className="product-form-file-name">
                  Đã chọn {imageFiles.length} ảnh: {imageFiles.map((f) => f.name).join(', ')}
                </p>
              )}
              {isEdit && existingImages.length > 0 && (
                <div className="product-form-existing">
                  <span>Ảnh hiện tại:</span>
                  {existingImages.map((img, i) => (
                    <img
                      key={i}
                      src={productImageUrl(img)}
                      alt={`Ảnh sách ${i + 1}`}
                      className="product-form-thumb"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="product-form-actions">
              <Button type="submit" variant="primary" loading={saving}>
                {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Đăng sách'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/my-shop')}>
                Hủy
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
