import './Button.css';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'accent'
  size = 'md', // 'sm' | 'md' | 'lg'
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`app-button btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${loading ? 'btn-loading' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : (
        icon && <span className="btn-icon">{icon}</span>
      )}
      <span className="btn-content">{children}</span>
    </button>
  );
}
