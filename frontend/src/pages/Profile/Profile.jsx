import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../utils/auth';
import Button from '../../components/common/Button';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="home-container profile-page">
      <MarketplaceHeader user={user} />
      <main className="profile-content">
        {user ? (
          <div className="profile-layout">
            <aside className="profile-sidebar">
              <div className="profile-avatar" aria-hidden="true">
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h1 id="profile-title" className="profile-name">
                {user.fullName || 'Người dùng'}
              </h1>
              <p className="profile-role">
                {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
              </p>
              <p className="profile-email">{user.email || 'Chưa có email'}</p>
              <p className="profile-placeholder">
                Hồ sơ và hoạt động của thành viên.
              </p>
              <Button
                variant="outline"
                className="profile-logout-button"
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </aside>

            <div className="profile-main">
              <nav className="profile-tabs" aria-label="Điều hướng hồ sơ">
                <span className="profile-tab profile-tab-active" aria-current="page">
                  Tổng quan
                </span>
              </nav>

              <section className="profile-activity" aria-labelledby="profile-activity-title">
                <h2 id="profile-activity-title">Hoạt động</h2>
                <div className="profile-empty-activity">
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="profile-empty">
            <h2>Chưa có thông tin tài khoản</h2>
            <p>Đăng nhập để xem hồ sơ của bạn.</p>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
