import { useState } from 'react';
import { Link, useSearchParams, useOutletContext } from 'react-router-dom';
import { books, categories, filterBooks } from '../../data/books';
import BookCard, { BookCover } from '../../components/books/BookCard';
import Icon from '../../components/books/Icon';
import './Home.css';

export default function Home() {
  const { savedIds, toggleSave } = useOutletContext();
  const [shelfCategory, setShelfCategory] = useState('van-hoc');
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = categories.some((item) => item.id === params.get('category')) ? params.get('category') : 'all';
  const sort = ['newest', 'price-asc', 'price-desc'].includes(params.get('sort')) ? params.get('sort') : 'newest';
  const savedOnly = params.get('view') === 'saved';
  const showCatalog = Boolean(query || category !== 'all' || params.get('view') || params.get('sort'));
  const results = filterBooks({ query, category, sort, savedIds: savedOnly ? savedIds : null });
  const categoryName = categories.find((item) => item.id === category)?.name;

  function browse(updates = {}, scroll = true) {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setParams(next);
    if (scroll) requestAnimationFrame(() => document.getElementById('kham-pha')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  const renderGrid = (items) => <div className="home-book-grid">{items.map((book) => <BookCard key={book.id} book={book} saved={savedIds.includes(book.id)} onSave={toggleSave} />)}</div>;

  return (
      <main>
        {!showCatalog && <>
          <section className="home-shell home-hero" aria-labelledby="hero-heading">
            <div className="home-hero-copy"><span className="hero-label"><span /> NƠI NHỮNG TRANG SÁCH ĐƯỢC VIẾT TIẾP</span><h1 id="hero-heading">Sách cũ.<br />Câu chuyện <em>mới.</em></h1><p>Một cuốn sách bạn đã đọc, có thể là cả thế giới ai đó đang tìm. Cùng khám phá những cuốn sách hay và trao tri thức đến người tiếp theo.</p><div className="hero-actions"><a className="home-button home-button-primary" href="#kham-pha">Khám phá tủ sách <Icon name="arrow" size={18} /></a><a className="hero-secondary-link" href="#the-loai">Tìm theo thể loại <span>↗</span></a></div><div className="hero-footnote"><Icon name="leaf" size={17} />Thêm một người đọc. Thêm một vòng đời cho sách.</div></div>
            <div className="home-hero-art" aria-hidden="true"><span className="hero-orbit hero-orbit-one" /><span className="hero-orbit hero-orbit-two" /><span className="hero-art-caption">THE NEXT CHAPTER</span><BookCover book={books[0]} className="hero-book-back" eager /><BookCover book={books[1]} className="hero-book-front" eager /><div className="hero-art-note"><Icon name="heart" size={19} /><span>Cũ với ai đó.<br /><strong>Mới với bạn.</strong></span></div><span className="hero-art-star">✳</span><span className="hero-art-bottom">MỖI TRANG SÁCH, MỘT CUỘC GẶP GỠ</span></div>
          </section>
          <div className="home-shell home-values"><span><Icon name="book" />Sách hay với giá dễ thương</span><span><Icon name="heart" />Kết nối những người yêu sách</span><span><Icon name="leaf" />Đọc sách, sống xanh hơn</span></div>
          <section className="home-shell home-section" id="the-loai" aria-labelledby="categories-heading"><div className="home-section-heading"><div><span className="section-eyebrow">MỘT THẾ GIỚI ĐỂ KHÁM PHÁ</span><h2 id="categories-heading">Bạn muốn đọc gì hôm nay?</h2></div><span className="section-side-note">Tìm một cuốn sách đúng gu của bạn</span></div><div className="home-category-grid">{categories.map((item) => <button className={`home-category-tile tone-${item.tone}`} key={item.id} onClick={() => browse({ category: item.id, view: 'all' })}><span className="category-tile-icon"><Icon name={item.icon} size={26} /></span><strong>{item.name}</strong><span>{books.filter((book) => book.category === item.id).length} cuốn sách</span></button>)}</div></section>
        </>}

        <div className="home-shell home-catalog-anchor" id="kham-pha">
          {showCatalog ? <section className="home-section" aria-labelledby="catalog-heading"><div className="home-breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><span>{savedOnly ? 'Sách yêu thích' : 'Khám phá sách'}</span></div><div className="home-section-heading"><div><span className="section-eyebrow">TỦ SÁCH DÀNH CHO BẠN</span><h1 id="catalog-heading">{savedOnly ? 'Sách đã lưu' : query ? `Kết quả cho “${query}”` : categoryName || 'Khám phá tủ sách'}</h1><p className="catalog-count" role="status">{results.length} cuốn sách{categoryName ? ` · ${categoryName}` : ''}</p></div><label className="home-sort">Sắp xếp<select aria-label="Sắp xếp sách" value={sort} onChange={(event) => browse({ sort: event.target.value }, false)}><option value="newest">Mới đăng trước</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select></label></div><div className="home-filter-chips" aria-label="Lọc thể loại">{[{ id: 'all', name: 'Tất cả' }, ...categories].map((item) => <button className={category === item.id ? 'selected' : ''} aria-pressed={category === item.id} key={item.id} onClick={() => browse({ category: item.id === 'all' ? '' : item.id }, false)}>{item.name}</button>)}</div>{results.length ? renderGrid(results) : <div className="home-empty-state"><Icon name={savedOnly ? 'heart' : 'search'} size={36} /><h2>{savedOnly && !savedIds.length ? 'Tủ sách yêu thích đang chờ bạn' : 'Chưa tìm thấy cuốn sách phù hợp'}</h2><p>{savedOnly && !savedIds.length ? 'Chạm vào trái tim trên một cuốn sách để lưu lại tại đây.' : 'Thử tên sách, tên tác giả khác hoặc chọn lại thể loại nhé.'}</p><button className="home-button home-button-primary" onClick={() => setParams({ view: 'all' })}>Khám phá tất cả sách <Icon name="arrow" size={17} /></button></div>}</section> : <>
            <section className="home-section" aria-labelledby="recommended-heading"><div className="home-section-heading"><div><span className="section-eyebrow">CHỌN MỘT CUỐN, THÊM MỘT NIỀM VUI</span><h2 id="recommended-heading">Có thể bạn sẽ thích<span className="heading-spark"> ✳</span></h2><p>Những tựa sách được chọn cho lần ghé thăm này.</p></div><button className="home-text-link" onClick={() => browse({ view: 'all' })}>Xem tất cả <Icon name="arrow" size={17} /></button></div>{renderGrid(books.filter((book) => book.recommended))}</section>
            <section className="home-section" aria-labelledby="new-books-heading"><div className="home-section-heading"><div><span className="section-eyebrow">VỪA GHÉ TỦ SÁCH</span><h2 id="new-books-heading">Sách mới đăng</h2><p>Những cuốn sách đang chờ gặp người đọc tiếp theo.</p></div><button className="home-text-link" onClick={() => browse({ view: 'all', sort: 'newest' })}>Xem tất cả <Icon name="arrow" size={17} /></button></div>{renderGrid(filterBooks().slice(0, 4))}</section>
            <section className="home-reading-banner"><div className="reading-banner-icon"><Icon name="book" size={42} /></div><div><span className="section-eyebrow">ĐỌC TIẾP NHỮNG ĐIỀU TỐT ĐẸP</span><h2>Một cuốn sách hay xứng đáng<br />được đọc nhiều hơn một lần.</h2><p>Tìm cuốn sách tiếp theo cho tủ sách của bạn.</p></div><a className="home-button home-button-light" href="#the-loai">Chọn thể loại yêu thích <Icon name="arrow" size={18} /></a></section>
            <section className="home-section" aria-labelledby="genre-heading"><div className="home-section-heading"><div><span className="section-eyebrow">ĐỌC THEO CẢM HỨNG</span><h2 id="genre-heading">Sách theo thể loại</h2><p>{categories.find((item) => item.id === shelfCategory)?.description}</p></div><button className="home-text-link" onClick={() => browse({ category: shelfCategory, view: 'all' })}>Xem tất cả <Icon name="arrow" size={17} /></button></div><div className="home-filter-chips" aria-label="Chọn thể loại cho kệ sách">{categories.map((item) => <button key={item.id} className={item.id === shelfCategory ? 'selected' : ''} aria-pressed={item.id === shelfCategory} onClick={() => setShelfCategory(item.id)}>{item.name}</button>)}</div>{renderGrid(filterBooks({ category: shelfCategory }).slice(0, 4))}</section>
          </>}
        </div>
      </main>
  );
}
