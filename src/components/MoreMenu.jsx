import { useEffect, useRef, useState } from 'react';

/** Small "…" menu for lightweight moderation actions (report, block, delete). */
export default function MoreMenu({ items, label = 'More options' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const visible = items.filter(Boolean);
  if (!visible.length) return null;

  return (
    <div className="more" ref={ref}>
      <button type="button" className="icon-btn" aria-label={label} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="4" cy="9" r="1.6" fill="currentColor" /><circle cx="9" cy="9" r="1.6" fill="currentColor" /><circle cx="14" cy="9" r="1.6" fill="currentColor" /></svg>
      </button>
      {open && (
        <ul className="more-menu" role="menu">
          {visible.map((it) => (
            <li key={it.label} role="none">
              <button type="button" role="menuitem" className={it.danger ? 'danger' : ''} onClick={() => { setOpen(false); it.onSelect(); }}>
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
