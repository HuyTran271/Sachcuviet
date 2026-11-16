import { Link } from 'react-router-dom';
import Icon from '../books/Icon';

export default function SiteFooter() {
  return (
    <footer className="home-footer"><div className="home-shell"><div className="home-footer-top"><div><Link to="/" className="home-footer-brand"><Icon name="book" size={24} />Sách Cũ Việt.</Link><p>Kết nối người yêu sách.<br />Viết tiếp hành trình của những trang sách cũ.</p></div><div><strong>Khám phá</strong><Link to="/?view=all#kham-pha">Tất cả sách</Link><Link to="/?view=all&sort=newest#kham-pha">Sách mới đăng</Link></div><div><strong>Góc thành viên</strong><Link to="/login">Đăng nhập</Link><Link to="/register">Đăng ký tài khoản</Link></div><div className="footer-message"><Icon name="leaf" size={23} /><p>Sách cũ, giá trị còn nguyên.<br />Cảm ơn bạn đã chọn đọc tiếp.</p></div></div><div className="home-footer-bottom"><span>© 2026 Sách Cũ Việt</span><span>Dữ liệu và bìa sách minh họa · Yêu thích được lưu trên trình duyệt</span></div></div></footer>
  );
}
