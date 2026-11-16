import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../utils/auth';
import Button from '../../components/common/Button';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="home-container">
      {/* HEADER / NAVIGATION BAR */}
      <header className="home-header">
        <div className="home-header-inner">
          <Link to="/" className="home-logo">
            <div className="home-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="home-logo-title">Sách Cũ Việt</span>
          </Link>

          <div className="home-nav-actions">
            {user ? (
              <div className="home-user-menu">
                <div className="home-user-badge">
                  <span className="user-avatar-initial">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <div className="user-details">
                    <span className="user-name">
                      {user.fullName}
                      {user.role === 'admin' && <span className="user-role-admin"> (Admin)</span>}
                    </span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  }
                >
                  Đăng xuất
                </Button>
              </div>
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

      {/* EMPTY HOME PLACEHOLDER (as requested: "chưa hiển thị gì cả, tập trung vào 2 trang đăng kí và đăng nhập") */}
      <main className="home-main">
        <div className="home-empty-box">
          <div className="empty-icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h1 className="home-empty-title">Trang chủ Sách Cũ Việt</h1>
          <p className="home-empty-subtitle">
            {user
              ? `Xin chào ${user.fullName}! Bạn đã đăng nhập thành công (${user.role === 'admin' ? 'Quyền: Quản trị viên' : 'Quyền: Thành viên'}).`
              : 'Trang chủ hiện chưa hiển thị nội dung. Vui lòng đăng nhập hoặc đăng ký để trải nghiệm hệ thống.'}
          </p>

          <div className="home-quick-actions">
            <Link to="/login">
              <Button variant="secondary" size="md">
                Xem trang Đăng nhập
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="md">
                Xem trang Đăng ký
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
