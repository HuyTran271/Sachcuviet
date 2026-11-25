import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getProfile, updateProfile, logout } from '../../utils/auth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import MarketplaceHeader from '../../components/layout/MarketplaceHeader';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldError, setFieldError] = useState('');

  // Goi API that thay vi chi doc localStorage: xac thuc phien, lay ten moi nhat.
  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        setFullName(fresh.fullName || '');
      })
      .catch((err) => {
        if (cancelled) return;
        // Het phien (401): xoa session local, dua ve trang dang nhap.
        setError(err.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setUser(null);
        logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFieldError('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }
    setFieldError('');
    setSaving(true);
    try {
      const updated = await updateProfile({ fullName: fullName.trim() });
      setUser(updated);
      setSuccess('Cập nhật họ và tên thành công.');
    } catch (err) {
      setError(err.message || 'Cập nhật hồ sơ không thành công.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="home-container profile-page">
      <MarketplaceHeader user={user} />
      <main className="profile-content">
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        )}
        {loading ? (
          <p>Đang tải hồ sơ...</p>
        ) : user ? (
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

              <section aria-labelledby="profile-edit-title">
                <h2 id="profile-edit-title">Chỉnh sửa thông tin</h2>
                <form onSubmit={handleSave} noValidate>
                  <Input
                    id="profile-fullname"
                    label="Họ và tên"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={fieldError}
                    required
                    autoComplete="name"
                  />
                  <p>Địa chỉ email không đổi ở đây. Mật khẩu và vai trò cũng vậy.</p>
                  <Button type="submit" variant="primary" loading={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </form>
              </section>

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
