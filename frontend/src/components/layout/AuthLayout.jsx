import { Link } from 'react-router-dom';
import './AuthLayout.css';

export default function AuthLayout({
  children,
  badgeText = 'Chợ Sách Cũ Trực Tuyến',
  title = 'Sách Cũ Việt',
  subtitle = 'Trao tri thức cũ – Mở tương lai mới'
}) {
  return (
    <div className="auth-container">
      {/* LEFT BRAND PANEL */}
      <div className="auth-brand-panel">
        <div className="brand-panel-pattern" aria-hidden="true" />
        
        <div className="brand-panel-content">
          <Link to="/" className="brand-logo-link">
            <div className="brand-logo-icon">
              {/* Elegant Open Book SVG */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="brand-logo-text">
              <span className="brand-name">{title}</span>
              <span className="brand-sub">Sách Hay Trao Tay</span>
            </div>
          </Link>

          <div className="brand-hero-block">
            <div className="brand-badge">{badgeText}</div>
            <h1 className="brand-hero-heading">Nơi gặp gỡ của những tâm hồn yêu sách</h1>
            <p className="brand-hero-desc">
              Khám phá hàng chục nghìn cuốn sách văn học, giáo trình, kỹ năng và sách hiếm với giá tiết kiệm đến 70%.
            </p>

            <div className="brand-features-list">
              <div className="brand-feature-item">
                <div className="feature-bullet">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <strong>Kiểm duyệt chất lượng</strong>
                  <p>Mô tả độ mới trung thực, ảnh chụp thật 100%</p>
                </div>
              </div>

              <div className="brand-feature-item">
                <div className="feature-bullet">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <strong>Giao dịch an toàn & minh bạch</strong>
                  <p>Thanh toán bảo đảm, đồng kiểm khi nhận hàng</p>
                </div>
              </div>

              <div className="brand-feature-item">
                <div className="feature-bullet">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <strong>Lan tỏa lối sống xanh</strong>
                  <p>Tái sử dụng sách, giảm rác thải và bảo vệ môi trường</p>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-quote-card">
            <p className="quote-text">
              &ldquo;Một cuốn sách đã đọc xong vẫn còn nguyên giá trị khi được trao đến tay người tiếp theo cần nó.&rdquo;
            </p>
            <span className="quote-author">— Cộng đồng Độc giả Sách Cũ Việt</span>
          </div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="auth-form-panel">
        <div className="auth-mobile-header">
          <Link to="/" className="mobile-brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <span>Sách Cũ Việt</span>
          </Link>
        </div>

        <div className="auth-form-card">
          {children}
        </div>

        <footer className="auth-footer">
          <p>© 2026 Sách Cũ Việt. Nền tảng chia sẻ & thương mại sách cũ bền vững.</p>
        </footer>
      </div>
    </div>
  );
}
