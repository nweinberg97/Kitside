import { useEffect, useRef } from 'react';
import { firstName } from '../lib/format.js';
import { Link } from '../lib/router.jsx';

export function Avatar({ profile, size = 48 }) {
  const name = profile?.name || 'A neighbour';
  const style = { width: size, height: size, fontSize: size * 0.42, '--hue': profile?.avatarHue ?? 160 };
  if (profile?.avatarUrl) {
    return <img className="avatar" src={profile.avatarUrl} alt="" style={style} referrerPolicy="no-referrer" />;
  }
  return <span className="avatar" style={style} aria-hidden="true">{firstName(name)[0]?.toUpperCase()}</span>;
}

export function DemoTag() {
  return <span className="demo-tag" title="A fictional example member, activity or post">Example</span>;
}

export function Tags({ items, tone }) {
  if (!items?.length) return null;
  return (
    <ul className={`tags ${tone ? `tags-${tone}` : ''}`}>
      {items.map((t) => <li key={t}>{t}</li>)}
    </ul>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="empty">
      <svg width="72" height="40" viewBox="0 0 72 40" aria-hidden="true">
        <path d="M2 30 L20 12 L30 22 L44 6 L70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M2 36 q8 -4 17 0 t17 0 t17 0 t17 0" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="empty empty-error" role="alert">
      <h3>That didn’t load</h3>
      <p>{error?.message || 'Check your connection and try again.'}</p>
      {onRetry && <button className="btn btn-quiet" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function SkeletonGrid({ count = 6, className = 'grid-people' }) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => <div key={i} className="skeleton" />)}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const el = ref.current;
    el?.querySelector('input, textarea, select, button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && el) {
        const f = el.querySelectorAll('button, [href], input, select, textarea');
        const first = f[0]; const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref}>
        <header className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function ChipGroup({ options, value, onChange, multiple = false, label }) {
  const selected = multiple ? new Set(value) : new Set([value]);
  const toggle = (opt) => {
    if (!multiple) return onChange(opt);
    const next = new Set(value);
    next.has(opt) ? next.delete(opt) : next.add(opt);
    onChange([...next]);
  };
  return (
    <div className="chip-group" role="group" aria-label={label}>
      {options.map((opt) => {
        const id = typeof opt === 'string' ? opt : opt.id;
        const text = typeof opt === 'string' ? opt : opt.label;
        const on = selected.has(id);
        return (
          <button key={id} type="button" className={`chip ${on ? 'chip-on' : ''}`} aria-pressed={on} onClick={() => toggle(id)}>
            {text}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <p className="field-msg" role="alert">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function PersonLink({ profile, className = 'person-link' }) {
  if (!profile) return <span className={className}>A neighbour</span>;
  return <Link className={className} to={`/people/${profile.id}`}>{profile.name}</Link>;
}
