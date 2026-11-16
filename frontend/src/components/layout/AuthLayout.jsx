import './AuthLayout.css';

export default function AuthLayout({ children }) {
  return (
    <main className="auth-container">
      <div className="auth-form-card">{children}</div>
    </main>
  );
}
