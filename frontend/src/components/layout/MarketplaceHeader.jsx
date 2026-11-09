import { Link } from 'react-router-dom';
import Button from '../common/Button';
import './MarketplaceHeader.css';

export default function MarketplaceHeader({ user }) {
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

        <div className="home-nav-actions">
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
