import { enterDemo, exitDemo, MODE, SHOW_DEMO } from '../lib/config.js';
import { DISCLAIMER } from '../lib/constants.js';
import { Link } from '../lib/router.jsx';
import { useSession } from '../state/session.jsx';
import { Avatar } from './ui.jsx';

const NAV = [
  { to: '/people', route: ['people', 'person'], label: 'People' },
  { to: '/things', route: ['things'], label: 'Things to do' },
  { to: '/announcements', route: ['announcements'], label: 'Announcements' },
];

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Kitside home">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
        <defs><clipPath id="logo-c"><rect width="64" height="64" rx="16" /></clipPath></defs>
        <g clipPath="url(#logo-c)">
          <rect width="64" height="64" fill="#17302A" />
          <circle cx="34" cy="30" r="10" fill="#F0B54A" />
          <path d="M0 42 L18 24 L28 33 L40 20 L64 42 Z" fill="#3D6B4B" />
          <rect y="42" width="64" height="22" fill="#2C6577" />
          <path d="M0 50 q8 -4 16 0 t16 0 t16 0 t16 0" stroke="#ECEFE9" strokeWidth="2.5" fill="none" />
        </g>
      </svg>
      <span>Kitside</span>
    </Link>
  );
}

export function TopNav({ route, overlay }) {
  const { user, profile, loading } = useSession();
  return (
    <header className={`topnav ${overlay ? 'is-overlay' : ''}`}>
      <div className="topnav-inner">
        <Logo />
        <nav className="topnav-links" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} aria-current={n.route.includes(route.name) ? 'page' : undefined}>{n.label}</Link>
          ))}
        </nav>
        <div className="topnav-end">
          {MODE === 'demo' && (
            <button type="button" className="demo-pill" onClick={() => exitDemo('/')} aria-label="Leave the demo and go back to the real Kitside">
              Leave demo
            </button>
          )}
          {loading ? null : profile ? (
            <Link to="/me" className="me-link" aria-current={route.name === 'me' ? 'page' : undefined}>
              <Avatar profile={profile} size={30} />
              <span>My profile</span>
            </Link>
          ) : user ? (
            <Link to="/welcome" className="btn btn-primary btn-sm">Finish your profile</Link>
          ) : (
            <>
              <Link to="/login" className="topnav-login">Log in</Link>
              <Link to="/join" className="btn btn-primary btn-sm">Join Kitside</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const ICONS = {
  home: <path d="M3 10.5L11 4l8 6.5V19a1 1 0 01-1 1h-4.5v-5.5h-5V20H4a1 1 0 01-1-1z" />,
  people: <><circle cx="8" cy="8" r="3.2" /><circle cx="15.5" cy="9" r="2.6" /><path d="M2.5 19c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2M13.6 14.2c.6-.2 1.2-.3 1.9-.3 2.3 0 4 1.5 4.5 5.1" /></>,
  things: <><rect x="3.5" y="5" width="15" height="14" rx="2.5" /><path d="M3.5 9.5h15M8 3v4M14 3v4" /></>,
  announcements: <><path d="M4 9.5v3.5a1 1 0 001 1h2l5 4V4.5l-5 4H5a1 1 0 00-1 1z" /><path d="M15.5 8.5a3.5 3.5 0 010 5" /></>,
};

export function BottomNav({ route }) {
  const items = [{ to: '/', route: ['home'], label: 'Home', icon: 'home' }, ...NAV.map((n) => ({ ...n, icon: n.to.slice(1) }))];
  return (
    <nav className="bottomnav" aria-label="Main">
      {items.map((n) => {
        const on = n.route.includes(route.name);
        return (
          <Link key={n.to} to={n.to} aria-current={on ? 'page' : undefined}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ICONS[n.icon]}
            </svg>
            <span>{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DemoButton({ className = 'btn btn-demo btn-lg', children = 'See the demo' }) {
  if (MODE !== 'live') return null;
  return (
    <button type="button" className={className} onClick={() => enterDemo('/')}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4L13 8z" fill="currentColor" /></svg>
      <span>{children}</span>
    </button>
  );
}

export function PreviewBanner() {
  if (MODE === 'demo') {
    return (
      <div className="preview-banner demo-banner">
        <p>
          <strong>You’re in the demo.</strong> These neighbours are made up, and anything you do here stays in this browser.
        </p>
        <button type="button" className="demo-exit" onClick={() => exitDemo('/')}>Back to the real Kitside</button>
      </div>
    );
  }
  if (MODE !== 'preview') return null;
  return (
    <div className="preview-banner">
      <p>
        <strong>Preview mode.</strong> Accounts and posts are saved in this browser only.{' '}
        <a href="https://github.com/nweinberg97/Kitside#launch-it" target="_blank" rel="noreferrer">Connect Supabase to launch</a>
      </p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <Logo />
          <p className="footer-line">Good people, right nearby. Made in Kitsilano, Vancouver.</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          {NAV.map((n) => <Link key={n.to} to={n.to}>{n.label}</Link>)}
          <Link to="/join">Join Kitside</Link>
          {MODE === 'live' && <DemoButton className="text-btn footer-demo">See the demo</DemoButton>}
        </nav>
        <p className="footer-fine">
          {DISCLAIMER}{(MODE !== 'live' || SHOW_DEMO) && ' People, activities and posts marked “Example” are fictional and show how Kitside works.'}{' '}
          Kitside only ever shows neighbourhood-level locations.
        </p>
      </div>
    </footer>
  );
}
