import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { getCart } from '../../utils/api';
import './MarketplaceHeader.css';

const toCartItems = (res) =>
  Array.isArray(res) ? res : res?.items || res?.cart?.items || res?.data?.items || [];

export default function MarketplaceHeader({ user }) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getCart()
      .then((res) => {
        if (cancelled) return;
        const items = toCartItems(res);
        setCartCount(items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0));
      })
      .catch(() => {
        if (!cancelled) setCartCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <header className="home-header">
      <div className="home-header-inner">
        <Link to="/" className="home-logo">
          <div className="home-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span className="home-logo-title">Sách Cũ Việt</span>
        </Link>

        <nav className="home-nav-links" aria-label="Điều hướng chính">
          <Link to="/" className="home-nav-link">Trang chủ</Link>
          {user && (
            <Link to="/profile" className="home-nav-link">Hồ sơ</Link>
          )}
        </nav>

        <div className="home-nav-actions">
          {user && (
            <>
              <Link to="/my-products/new" className="home-sell-button">
                Đăng bán
              </Link>
              <Link to="/cart" className="home-cart-link" aria-label="Giỏ hàng">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span className="home-cart-label">Giỏ hàng</span>
                {cartCount > 0 && <span className="home-cart-badge">{cartCount}</span>}
              </Link>
            </>
          )}
          {user ? (
            <Link
              to="/profile"
              className="home-user-badge"
              aria-label={`Mở hồ sơ của ${user.fullName || user.email}`}
            >
              <span className="user-avatar-initial">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </span>
              <span className="user-details">
                <span className="user-name">
                  {user.fullName || user.email}
                  {user.role === 'admin' && <span className="user-role-admin"> (Admin)</span>}
                </span>
                <span className="user-email">{user.email}</span>
              </span>
            </Link>
          ) : (
            <div className="home-auth-links">
              <Link to="/login" className="home-link-login">
                Đăng nhập
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
