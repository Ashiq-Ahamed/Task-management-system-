import React from 'react';
import { getInitials, getAvatarColor } from '../utils/helpers';
import './UI.css';

// ─── Button ──────────────────────────────────────────────────────────────────
export const Button = ({ variant = 'primary', size = 'md', icon, children, loading, className = '', ...props }) => (
  <button
    className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading && <span className="btn-spinner" />}
    {icon && !loading && <span className="btn-icon">{icon}</span>}
    {children && <span>{children}</span>}
  </button>
);

// ─── Badge ───────────────────────────────────────────────────────────────────
export const Badge = ({ color, bg, label, dot, className = '' }) => (
  <span className={`badge ${className}`} style={{ color, background: bg }}>
    {dot && <span className="badge-dot" style={{ background: color }} />}
    {label}
  </span>
);

// ─── Avatar ──────────────────────────────────────────────────────────────────
export const Avatar = ({ name, size = 32, className = '' }) => {
  const color = getAvatarColor(name);
  return (
    <div
      className={`avatar ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `${color}22`, color, border: `1.5px solid ${color}44` }}
    >
      {getInitials(name)}
    </div>
  );
};

// ─── Input ───────────────────────────────────────────────────────────────────
export const Input = ({
  label,
  error,
  icon,
  endIcon,
  onEndIconClick,
  endIconLabel = "Toggle",
  className = '',
  ...props
}) => (
  <div className={`field ${className}`}>
    {label && <label className="field-label">{label}</label>}
    <div className="field-wrap">
      {icon && <span className="field-icon">{icon}</span>}
      <input
        className={`field-input ${icon ? 'with-icon' : ''} ${endIcon ? 'with-end-icon' : ''} ${error ? 'error' : ''}`}
        {...props}
      />
      {endIcon && (
        <button
          type="button"
          className="field-end-icon-btn"
          onClick={onEndIconClick}
          aria-label={endIconLabel}
          title={endIconLabel}
        >
          {endIcon}
        </button>
      )}
    </div>
    {error && <span className="field-error">{error}</span>}
  </div>
);

// ─── Textarea ────────────────────────────────────────────────────────────────
export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className={`field ${className}`}>
    {label && <label className="field-label">{label}</label>}
    <textarea className={`field-textarea ${error ? 'error' : ''}`} {...props} />
    {error && <span className="field-error">{error}</span>}
  </div>
);

// ─── Select ──────────────────────────────────────────────────────────────────
export const Select = ({ label, error, options = [], className = '', ...props }) => (
  <div className={`field ${className}`}>
    {label && <label className="field-label">{label}</label>}
    <select className={`field-select ${error ? 'error' : ''}`} {...props}>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <span className="field-error">{error}</span>}
  </div>
);

// ─── Modal ───────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal-${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', onClick, hover }) => (
  <div className={`card ${hover ? 'card-hover' : ''} ${className}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
    {children}
  </div>
);

// ─── Empty State ─────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    {icon && <div className="empty-icon">{icon}</div>}
    <h3 className="empty-title">{title}</h3>
    {description && <p className="empty-desc">{description}</p>}
    {action && <div className="empty-action">{action}</div>}
  </div>
);

// ─── Loading Spinner ─────────────────────────────────────────────────────────
export const Spinner = ({ size = 24 }) => (
  <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
  </svg>
);

// ─── Skeleton ────────────────────────────────────────────────────────────────
export const Skeleton = ({ width, height = 20, radius = 6, className = '' }) => (
  <div className={`skeleton ${className}`} style={{ width, height, borderRadius: radius }} />
);

// ─── Toast ───────────────────────────────────────────────────────────────────
export const Toast = ({ message, type = 'info', onClose }) => (
  <div className={`toast toast-${type}`}>
    <span>{message}</span>
    <button onClick={onClose} className="toast-close">×</button>
  </div>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
export const Divider = ({ label }) => (
  <div className="divider">
    {label && <span className="divider-label">{label}</span>}
  </div>
);

// ─── Progress Bar ────────────────────────────────────────────────────────────
export const ProgressBar = ({ value = 0, max = 100, color = 'var(--accent)' }) => {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};

// ─── Chip ────────────────────────────────────────────────────────────────────
export const Chip = ({ label, onRemove, color }) => (
  <span className="chip" style={{ borderColor: color, color }}>
    {label}
    {onRemove && <button className="chip-remove" onClick={onRemove}>×</button>}
  </span>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon, trend, color = 'var(--accent)' }) => (
  <div className="stat-card fade-in">
    <div className="stat-header">
      <span className="stat-label">{label}</span>
      {icon && <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>}
    </div>
    <div className="stat-value" style={{ color }}>{value}</div>
    {trend && <div className={`stat-trend ${trend > 0 ? 'up' : 'down'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</div>}
  </div>
);

// ─── Toggle ──────────────────────────────────────────────────────────────────
export const Toggle = ({ checked, onChange, label }) => (
  <label className="toggle-wrap">
    <div className={`toggle ${checked ? 'active' : ''}`} onClick={() => onChange(!checked)}>
      <div className="toggle-thumb" />
    </div>
    {label && <span className="toggle-label">{label}</span>}
  </label>
);
