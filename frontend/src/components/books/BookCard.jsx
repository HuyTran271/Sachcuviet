import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { categories, formatPrice } from '../../data/books';

export function BookCover({ book, className = '', eager = false }) {
  return (
    <div
      className={`book-cover ${className}`}
      style={{ '--cover-ratio': book.coverRatio || 0.68, '--cover-position': book.coverPosition || 'center' }}
    >
      <img
        src={book.coverImage || '/images/books/cover-placeholder.svg'}
        alt={`Bìa sách ${book.title}`}
        width="408"
        height="600"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={({ currentTarget }) => {
          if (!currentTarget.dataset.fallback) {
            currentTarget.dataset.fallback = 'true';
            currentTarget.src = '/images/books/cover-placeholder.svg';
          }
        }}
      />
    </div>
  );
}

export default function BookCard({ book, saved, onSave }) {
  const location = useLocation();
  const detailUrl = '/books/' + book.id;
  const linkState = { from: location.pathname + location.search };
  return (
    <article className="book-card">
      <div className="book-card-image">
        <Link className="book-preview" to={detailUrl} state={linkState} aria-label={`Xem chi tiết ${book.title}`}><BookCover book={book} /></Link>
        <span className="book-discount">−{Math.round((1 - book.price / book.originalPrice) * 100)}%</span>
        <button className={`book-save ${saved ? 'is-saved' : ''}`} aria-label={`${saved ? 'Bỏ lưu' : 'Lưu'} ${book.title}`} aria-pressed={saved} onClick={() => onSave(book.id)}><Icon name="heart" size={18} /></button>
      </div>
      <div className="book-card-info">
        <span className="book-category">{categories.find((category) => category.id === book.category)?.name}</span>
        <h3><Link to={detailUrl} state={linkState}>{book.title}</Link></h3>
        <p className="book-author">{book.author}</p>
        <div className="book-prices"><strong>{formatPrice(book.price)}</strong><del>{formatPrice(book.originalPrice)}</del></div>
        <div className="book-meta"><span>{book.condition}</span><span><Icon name="pin" size={12} />{book.location}</span></div>
        <Link className="book-card-details" to={detailUrl} state={linkState} aria-label={`Xem chi tiết ${book.title}`}>Xem chi tiết <Icon name="arrow" size={16} /></Link>
      </div>
    </article>
  );
}
