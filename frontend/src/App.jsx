import { Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import BookDetailPage from './pages/BookDetail/BookDetail';
import SiteLayout from './components/layout/SiteLayout';
import Profile from './pages/Profile/Profile';
import PrivateRoute from './components/common/PrivateRoute';

function NotFound() {
  return (
    <main className="home-section">
      <div className="home-shell home-section">
        <section className="home-empty-state" aria-labelledby="not-found-title">
          <span className="section-eyebrow">SÁCH CŨ VIỆT</span>
          <h1 id="not-found-title">Không tìm thấy trang</h1>
          <p>Đường dẫn này không tồn tại. Bạn có thể trở về tủ sách để chọn cuốn sách muốn xem.</p>
          <Link to="/?view=all" className="home-button home-button-primary">Khám phá tủ sách</Link>
        </section>
      </div>
    </main>
  );
}
function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
