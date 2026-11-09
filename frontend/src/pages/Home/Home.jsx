import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import Button from '../../components/common/Button';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import './Home.css';

export default function Home() {
  const [user] = useState(getCurrentUser);

  return (
    <div className="home-container">
      <MarketplaceHeader user={user} />

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
