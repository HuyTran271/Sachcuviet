import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser, logout } from '../../utils/auth';
import { readSavedBooks, SAVED_KEY } from '../../utils/favorites';
import Icon from '../books/Icon';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import '../../pages/Home/Home.css';
import './SiteLayout.css';

export default function SiteLayout() {
  const [user, setUser] = useState(getCurrentUser);
  const [savedIds, setSavedIds] = useState(readSavedBooks);
  const [storageError, setStorageError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    function syncStorage(event) {
      if (event.key === SAVED_KEY || event.key === null) setSavedIds(readSavedBooks());
      if (event.key !== SAVED_KEY) setUser(getCurrentUser());
    }
    window.addEventListener('storage', syncStorage);
    return () => window.removeEventListener('storage', syncStorage);
  }, []);

  useEffect(() => {
    const pathChanged = previousPath.current !== location.pathname;
    previousPath.current = location.pathname;
    const frame = requestAnimationFrame(() => {
      const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
      if (target) target.scrollIntoView({ block: 'start' });
      else if (pathChanged) window.scrollTo({ top: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.search, location.hash]);

  function toggleSave(id) {
    const next = savedIds.includes(id) ? savedIds.filter((item) => item !== id) : [...savedIds, id];
    setSavedIds(next);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); }
    catch { setStorageError('Trình duyệt đang chặn lưu trữ. Sách yêu thích chỉ được giữ trong phiên này.'); }
  }

  async function handleLogout() {
    setSigningOut(true);
    try { await logout(); setUser(null); }
    finally { setSigningOut(false); }
  }

  return (
    <div className="home-page site-layout">
      <a className="home-skip-link" href="#site-main">Đến nội dung chính</a>
      <SiteHeader user={user} savedCount={savedIds.length} signingOut={signingOut} onLogout={handleLogout} />
      <div className="site-content" id="site-main" tabIndex={-1}><Outlet context={{ user, setUser, savedIds, toggleSave, logoutUser: handleLogout, signingOut }} /></div>
      {storageError && <div className="home-storage-notice" role="status">{storageError}<button onClick={() => setStorageError('')} aria-label="Đóng thông báo"><Icon name="close" size={17} /></button></div>}
      <SiteFooter />
    </div>
  );
}
