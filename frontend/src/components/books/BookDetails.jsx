import { useEffect, useRef, useState } from 'react';
import { categories, formatPrice } from '../../data/books';
import { validateDelivery } from '../../utils/checkout';
import { BookCover } from './BookCard';
import Icon from './Icon';

function PurchaseForm({ book, user, onBack, onComplete }) {
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const { delivery, errors: nextErrors } = validateDelivery(Object.fromEntries(new FormData(event.currentTarget)));
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      event.currentTarget.elements.namedItem(firstError)?.focus();
      return;
    }
    onComplete(delivery);
  }

  return (
    <section className="book-purchase" aria-labelledby="book-details-title">
      <button type="button" className="purchase-back" onClick={onBack}>← Quay lại thông tin sách</button>
      <span className="section-eyebrow">THÔNG TIN NHẬN SÁCH</span>
      <h1 id="book-details-title">Đặt mua sách</h1>
      <div className="purchase-summary"><BookCover book={book} eager /><div><strong>{book.title}</strong><p>{book.author}</p><span>Số lượng: 1 cuốn · {book.condition}</span><b>{formatPrice(book.price)}</b></div></div>
      <p className="purchase-demo-note">Bạn đang đặt hàng thử trên giao diện mẫu. Thông tin chỉ dùng trong lần xem này, chưa gửi đến người bán.</p>
      <form className="purchase-form" onSubmit={handleSubmit} noValidate>
        <div className="purchase-field"><label htmlFor="order-fullName">Họ tên người nhận <span>*</span></label><input id="order-fullName" name="fullName" defaultValue={user?.fullName || ''} autoComplete="shipping name" placeholder="Nhập họ tên đầy đủ" maxLength={100} required aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'order-fullName-error' : undefined} />{errors.fullName && <p id="order-fullName-error" className="purchase-field-error">{errors.fullName}</p>}</div>
        <div className="purchase-field"><label htmlFor="order-phone">Số điện thoại <span>*</span></label><input id="order-phone" name="phone" type="tel" inputMode="tel" autoComplete="shipping tel" placeholder="Ví dụ: 0912 345 678" maxLength={20} required aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'order-phone-error' : undefined} />{errors.phone && <p id="order-phone-error" className="purchase-field-error">{errors.phone}</p>}</div>
        <div className="purchase-field"><label htmlFor="order-address">Địa chỉ nhận sách <span>*</span></label><textarea id="order-address" name="address" autoComplete="shipping street-address" placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" rows={3} maxLength={500} required aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'order-address-error' : undefined} />{errors.address && <p id="order-address-error" className="purchase-field-error">{errors.address}</p>}</div>
        <dl className="purchase-totals"><div><dt>Tiền sách (1 cuốn)</dt><dd>{formatPrice(book.price)}</dd></div><div><dt>Phí giao hàng</dt><dd>Chưa tính</dd></div><div><dt>Tạm tính</dt><dd>{formatPrice(book.price)}</dd></div></dl>
        <p className="purchase-payment-note">Hình thức minh họa: thanh toán khi nhận hàng (COD).</p>
        <button type="submit" className="home-button home-button-primary purchase-submit">Xác nhận đơn mẫu <Icon name="arrow" size={18} /></button>
      </form>
    </section>
  );
}

export default function BookDetails({ book, user, saved, onSave, onContinue }) {
  const contentRef = useRef(null);
  const [step, setStep] = useState('details');
  const [delivery, setDelivery] = useState(null);
  const category = categories.find((item) => item.id === book.category);

  useEffect(() => {
    if (step !== 'details') {
      contentRef.current?.scrollIntoView({ block: 'start' });
      contentRef.current?.focus({ preventScroll: true });
    }
  }, [step]);
  return (
    <section className={`book-details-panel ${step !== 'details' ? 'book-details-purchase' : ''}`} aria-labelledby="book-details-title">
      <div ref={contentRef} tabIndex={-1} className="book-details-content">
        {step === 'details' && <div className="book-detail-layout">
          <div className="book-detail-cover"><BookCover book={book} eager /><span className="book-detail-photo-note">Ảnh bìa minh họa</span></div>
          <div className="book-detail-info">
            <span className="section-eyebrow">CHI TIẾT SÁCH · {category?.name}</span>
            <h1 id="book-details-title">{book.title}</h1><p className="book-author">Tác giả: {book.author}</p>
            <div className="book-prices"><strong>{formatPrice(book.price)}</strong><del>{formatPrice(book.originalPrice)}</del><span className="detail-discount">Tiết kiệm {Math.round((1 - book.price / book.originalPrice) * 100)}%</span></div>
            <h3 className="book-detail-subheading">Giới thiệu sách</h3><p>{book.description}</p>
            <dl><div><dt>Thể loại</dt><dd>{category?.name}</dd></div><div><dt>Tình trạng</dt><dd>{book.condition}</dd></div><div><dt>Số lượng</dt><dd>1 cuốn (minh họa)</dd></div><div><dt>Người đăng</dt><dd>{book.seller}</dd></div><div><dt>Khu vực</dt><dd>{book.location}</dd></div><div><dt>Ngày đăng</dt><dd>{new Date(book.postedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</dd></div></dl>
            <div className="book-condition-note"><strong>Ghi chú về tình trạng sách</strong><p>{book.note}</p></div>
            <div className="book-detail-actions"><button type="button" className="home-button home-button-primary" onClick={() => setStep('purchase')}>Mua ngay <Icon name="arrow" size={18} /></button><button type="button" className="home-button home-button-outline" onClick={() => onSave(book.id)} aria-pressed={saved}><Icon name={saved ? 'check' : 'heart'} size={18} />{saved ? 'Đã yêu thích' : 'Yêu thích'}</button></div>
            <p className="sample-note">Sách và giá minh họa. Nút Mua ngay mở giao diện đặt hàng thử.</p>
          </div>
        </div>}
        {step === 'purchase' && <PurchaseForm book={book} user={user} onBack={() => setStep('details')} onComplete={(values) => { setDelivery(values); setStep('complete'); }} />}
        {step === 'complete' && <section className="purchase-complete" aria-labelledby="book-details-title"><span className="purchase-complete-icon"><Icon name="check" size={32} /></span><span className="section-eyebrow">TRẢI NGHIỆM ĐẶT SÁCH</span><h1 id="book-details-title">Đã hoàn tất đơn mẫu</h1><p>Bạn vừa thử đặt 1 cuốn <strong>{book.title}</strong>.</p><dl className="purchase-totals"><div><dt>Người nhận</dt><dd>{delivery.fullName}</dd></div><div><dt>Điện thoại</dt><dd>{delivery.phone}</dd></div><div><dt>Địa chỉ</dt><dd>{delivery.address}</dd></div><div><dt>Tiền sách</dt><dd>{formatPrice(book.price)}</dd></div></dl><p className="purchase-demo-note">Đây là bản xem thử. Chưa tạo đơn hàng, gửi thông tin hay thực hiện thanh toán.</p><button type="button" className="home-button home-button-primary" onClick={onContinue}>Tiếp tục khám phá sách <Icon name="arrow" size={18} /></button></section>}
      </div>
    </section>
  );
}
