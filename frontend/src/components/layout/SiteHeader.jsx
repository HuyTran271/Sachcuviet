import { Link, useLocation, useNavigate } from 'react-router-dom';
import { categories } from '../../data/books';
import Icon from '../books/Icon';

export default function SiteHeader({ user, savedCount, signingOut, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const query = location.pathname === '/' ? params.get('q') || '' : '';
  const isHome = location.pathname === '/' && !location.search;
  const isSaved = location.pathname === '/' && params.get('view') === 'saved';
  const isNewest = location.pathname === '/' && params.get('sort') === 'newest';

  function handleSearch(event) {
    event.preventDefault();
    const next = location.pathname === '/' ? new URLSearchParams(location.search) : new URLSearchParams();
    const value = new FormData(event.currentTarget).get('q').trim();
    if (value) next.set('q', value); else next.delete('q');
    next.set('view', 'all');
    navigate(`/?${next}#kham-pha`);
  }

  return (
    <>
      <div className="home-announcement"><Icon name="leaf" size={14} /><span>Mỗi cuốn sách cũ, một hành trình mới.</span><span className="announcement-end">Đọc tiếp. Yêu thêm. Trao đi.</span></div>
      <header className="home-header">
        <div className="home-shell home-header-main">
          <Link to="/" className="home-logo" aria-label="Sách Cũ Việt — Trang chủ"><span className="home-logo-mark"><Icon name="book" size={27} /></span><span><strong>Sách Cũ Việt<span className="logo-dot">.</span></strong><small>SÁCH HAY, TRAO TAY</small></span></Link>
          <form className="home-search" key={location.pathname + query} role="search" onSubmit={handleSearch}><Icon name="search" size={19} /><input name="q" aria-label="Tìm sách theo tên hoặc tác giả" placeholder="Bạn đang tìm cuốn sách nào?" defaultValue={query} type="search" maxLength={120} /><button type="submit" aria-label="Tìm kiếm sách"><Icon name="arrow" size={19} /></button></form>
          <div className="home-account-actions">{user ? <><Link to="/profile" className="home-user-name" title={user.fullName || user.email} aria-label={`Mở hồ sơ của ${user.fullName || user.email}`} aria-current={location.pathname === '/profile' ? 'page' : undefined}>Chào, {user.fullName || user.email}</Link><button className="home-login" onClick={onLogout} disabled={signingOut}>{signingOut ? 'Đang thoát…' : 'Đăng xuất'}</button></> : <><Link className="home-login" to="/login" aria-current={location.pathname === '/login' ? 'page' : undefined}>Đăng nhập</Link><Link className="home-button home-button-primary" to="/register" aria-current={location.pathname === '/register' ? 'page' : undefined}>Đăng ký</Link></>}</div>
        </div>
        <nav className="home-shell home-navigation" aria-label="Điều hướng chính">
          <div className="home-nav-main"><Link className={isHome ? 'active' : ''} to="/" aria-current={isHome ? 'page' : undefined}>Trang chủ</Link><details className="home-category-menu"><summary>Thể loại sách <Icon name="chevron" size={14} /></summary><div className="home-category-dropdown">{categories.map((category) => <Link key={category.id} to={`/?view=all&category=${category.id}#kham-pha`} onClick={(event) => event.currentTarget.closest('details').removeAttribute('open')}><Icon name={category.icon} size={17} />{category.name}</Link>)}</div></details><Link className={isNewest ? 'active' : ''} to="/?view=all&sort=newest#kham-pha" aria-current={isNewest ? 'page' : undefined}>Sách mới đăng</Link></div>
          <Link className={`home-saved-nav ${isSaved ? 'active' : ''}`} to="/?view=saved#kham-pha" aria-current={isSaved ? 'page' : undefined}><Icon name="heart" size={17} />Yêu thích <span>{savedCount}</span></Link>
        </nav>
      </header>
    </>
  );
}
