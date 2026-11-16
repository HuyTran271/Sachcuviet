import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { books } from '../../data/books';
import BookDetails from '../../components/books/BookDetails';
import Icon from '../../components/books/Icon';
import './BookDetail.css';

function BookDetailContent({ book }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, savedIds, toggleSave } = useOutletContext();
  const from = location.state?.from;
  const returnTo = typeof from === 'string' && (from === '/' || from.startsWith('/?')) ? from : '/';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${book?.title || 'Không tìm thấy sách'} | Sách Cũ Việt`;
    return () => { document.title = previousTitle; };
  }, [book]);

  return (
      <main className="home-shell book-detail-main" id="chi-tiet-sach">
        <nav className="home-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><Link to={returnTo}>Tủ sách</Link><span aria-hidden="true">/</span><span aria-current="page">{book?.title || 'Không tìm thấy sách'}</span></nav>
        <Link className="book-list-back" to={returnTo}>← Quay lại danh sách sách</Link>
        {book ? <BookDetails book={book} user={user} saved={savedIds.includes(book.id)} onSave={toggleSave} onContinue={() => navigate(returnTo)} /> : <section className="home-empty-state"><Icon name="book" size={38} /><h1>Không tìm thấy sách</h1><p>Cuốn sách này không có trong tủ sách hoặc đường dẫn chưa đúng.</p><Link className="home-button home-button-primary" to="/?view=all">Khám phá tủ sách <Icon name="arrow" size={18} /></Link></section>}
      </main>
  );
}

export default function BookDetailPage() {
  const { id } = useParams();
  return <BookDetailContent key={id} book={books.find((book) => book.id === id)} />;
}