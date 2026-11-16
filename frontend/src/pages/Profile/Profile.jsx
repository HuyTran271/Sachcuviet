import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { getUserProfile, setCurrentUser } from '../../utils/auth';
import Button from '../../components/common/Button';
import Icon from '../../components/books/Icon';
import './Profile.css';

export default function Profile() {
  const { user, setUser, savedIds, logoutUser, signingOut } = useOutletContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    getUserProfile({ signal: controller.signal }).then((account) => {
      if (!active) return;
      setProfile(account);
      setCurrentUser(account);
      setUser(account);
    }).catch((failure) => {
      if (!active || failure.name === 'AbortError') return;
      if (failure.status === 401 || failure.status === 403) {
        setCurrentUser(null);
        setUser(null);
      } else {
        setError(failure.message || 'Không thể tải thông tin tài khoản.');
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [setUser, attempt]);

  const account = profile || user;
  const joined = account.createdAt ? new Date(account.createdAt) : null;
  const joinedLabel = joined && !Number.isNaN(joined.getTime())
    ? joined.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa có thông tin';

  function retry() {
    setError(''); setLoading(true); setAttempt((value) => value + 1);
  }

  return (
    <main className="profile-content" aria-labelledby="profile-title">
      <nav className="home-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Hồ sơ cá nhân</span></nav>
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-avatar" aria-hidden="true">{account.fullName?.charAt(0).toUpperCase() || 'U'}</div>
          <h1 id="profile-title" className="profile-name">{account.fullName || 'Người dùng'}</h1>
          <p className="profile-role">{account.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</p>
          <p className="profile-email">{account.email}</p>
          <p className="profile-placeholder">Hồ sơ và tủ sách yêu thích của bạn.</p>
          <Button variant="outline" className="profile-logout-button" onClick={logoutUser} loading={signingOut}>Đăng xuất</Button>
        </aside>
        <div className="profile-main">
          <nav className="profile-tabs" aria-label="Điều hướng hồ sơ"><span className="profile-tab profile-tab-active" aria-current="page">Tổng quan</span><Link className="profile-tab" to="/?view=saved#kham-pha">Sách yêu thích ({savedIds.length})</Link></nav>
          <section className="profile-activity" aria-labelledby="profile-info-title">
            <h2 id="profile-info-title">Thông tin tài khoản</h2>
            {loading && <p className="profile-status" role="status">Đang tải thông tin tài khoản…</p>}
            {error && <div className="profile-error" role="alert"><p>{error}</p><Button variant="outline" size="sm" onClick={retry}>Thử lại</Button></div>}
            {!loading && !error && <dl className="profile-info-list"><div><dt>Họ và tên</dt><dd>{account.fullName}</dd></div><div><dt>Email</dt><dd>{account.email}</dd></div><div><dt>Số điện thoại</dt><dd>{account.phone || 'Chưa cập nhật'}</dd></div><div><dt>Loại tài khoản</dt><dd>{account.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</dd></div><div><dt>Trạng thái</dt><dd>{account.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}</dd></div><div><dt>Ngày tham gia</dt><dd>{joinedLabel}</dd></div></dl>}
          </section>
          <section className="profile-activity" aria-labelledby="profile-activity-title"><h2 id="profile-activity-title">Tủ sách của bạn</h2><div className="profile-empty-activity"><Icon name="heart" size={25} /><p>Bạn đã lưu <strong>{savedIds.length} cuốn sách</strong> vào danh sách yêu thích.</p><Link className="home-text-link" to="/?view=saved#kham-pha">Xem sách đã lưu <Icon name="arrow" size={17} /></Link></div></section>
        </div>
      </div>
    </main>
  );
}
