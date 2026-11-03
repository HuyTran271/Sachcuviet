import './Input.css';

export default function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon,
  rightAction,
  required = false,
  disabled = false,
  autoComplete,
  className = '',
  ...props
}) {
  return (
    <div className={`app-input-group ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="app-input-label">
          {label}
          {required && <span className="app-input-required" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="app-input-wrapper">
        {icon && <span className="app-input-left-icon">{icon}</span>}
        
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`app-input-field ${icon ? 'with-left-icon' : ''} ${rightAction ? 'with-right-action' : ''}`}
          {...props}
        />

        {rightAction && <div className="app-input-right-action">{rightAction}</div>}
      </div>

      {error ? (
        <div id={`${id}-error`} className="app-input-error" role="alert">
          <svg className="error-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div id={`${id}-helper`} className="app-input-helper">
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
