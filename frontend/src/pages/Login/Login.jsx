import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { loginUser } from '../../utils/auth';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Địa chỉ email không đúng định dạng';
    }

    if (!formData.password) {
      errs.password = 'Vui lòng nhập mật khẩu';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      // Gọi placeholder loginUser() kết nối API backend
      const user = await loginUser({
        email: formData.email,
        password: formData.password
      });

      setSuccessMessage(`Đăng nhập thành công! Chào mừng ${user.fullName || user.email} trở lại.`);

      // Chuyển hướng vào trang chủ
      setTimeout(() => {
        navigate('/');
      }, 600);
    } catch (err) {
      setServerError(err.message || 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badgeText="Thành viên Sách Cũ Việt"
      title="Sách Cũ Việt"
      subtitle="Đăng nhập để tiếp tục khám phá kho sách"
    >
      <div className="login-header">
        <h2 className="login-title">Đăng nhập tài khoản</h2>
        <p className="login-subtitle">
          Truy cập tủ sách cá nhân, đơn hàng và các tựa sách bạn quan tâm
        </p>
      </div>

      {serverError && (
        <Alert
          type="error"
          message={serverError}
          onClose={() => setServerError('')}
          className="auth-alert-spacing"
        />
      )}

      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          className="auth-alert-spacing"
        />
      )}

      <form onSubmit={handleSubmit} className="login-form" noValidate>
        {/* EMAIL INPUT */}
        <Input
          id="login-email"
          label="Địa chỉ Email"
          type="email"
          placeholder="vd: tenban@email.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          required
          autoComplete="email"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          }
        />

        {/* PASSWORD INPUT */}
        <Input
          id="login-password"
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="Nhập mật khẩu của bạn"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          required
          autoComplete="current-password"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          rightAction={
            <button
              type="button"
              className="pwd-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          }
        />

        {/* REMEMBER & FORGOT PASSWORD */}
        <div className="login-options-row">
          <label className="checkbox-label" htmlFor="remember-me">
            <input
              id="remember-me"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => handleChange('rememberMe', e.target.checked)}
              className="custom-checkbox"
            />
            <span className="checkbox-text">Ghi nhớ đăng nhập</span>
          </label>

          <a href="#forgot" className="forgot-pwd-link" onClick={(e) => e.preventDefault()}>
            Quên mật khẩu?
          </a>
        </div>

        {/* SUBMIT BUTTON */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          }
        >
          {loading ? 'Đang gửi yêu cầu...' : 'Đăng nhập ngay'}
        </Button>
      </form>

      {/* DIVIDER */}
      <div className="auth-divider">
        <span className="divider-line" />
        <span className="divider-text">hoặc tiếp tục với</span>
        <span className="divider-line" />
      </div>

      {/* SOCIAL LOGINS */}
      <div className="social-login-grid">
        <button
          type="button"
          className="social-btn"
          onClick={() => alert('Chức năng đăng nhập Google đang chờ kết nối backend.')}
          aria-label="Đăng nhập với Google"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          className="social-btn"
          onClick={() => alert('Chức năng đăng nhập Facebook đang chờ kết nối backend.')}
          aria-label="Đăng nhập với Facebook"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Facebook</span>
        </button>
      </div>

      {/* FOOTER SWITCH */}
      <div className="auth-switch-prompt">
        <span>Chưa có tài khoản?</span>{' '}
        <Link to="/register" className="auth-switch-link">
          Đăng ký ngay
        </Link>
      </div>
    </AuthLayout>
  );
}
