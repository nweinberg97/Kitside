import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Link, navigate } from '../lib/router.jsx';
import { useSession } from '../state/session.jsx';

/*
 * Demo / preview only: a floating checklist that walks through every tool,
 * so the sandbox can be reviewed end to end.
 */
const STEPS = [
  { to: '/?view=landing', match: (r) => r.name === 'home' && r.query.get('view') === 'landing', title: 'Landing page', body: 'What a visitor sees before they have an invite.' },
  { to: '/', match: (r) => r.name === 'home' && r.query.get('view') !== 'landing', title: 'This week', body: 'Say you’re in, then tick “Staying for dinner”. Dinner turns on at 3.' },
  { to: '/updates', match: (r) => r.name === 'updates' && r.query.get('tab') !== 'ask', title: 'Working on', body: 'Post one line. A new one replaces your last.' },
  { to: '/updates?tab=ask', match: (r) => r.name === 'updates' && r.query.get('tab') === 'ask', title: 'Needs help', body: 'Post an ask, or tap “I can help” on someone else’s.' },
  { to: '/people', match: (r) => r.name === 'people' || r.name === 'person', title: 'People and profiles', body: 'Open a profile: working-on log, asks, Get in touch links.' },
  { to: '/spots', match: (r) => r.name === 'spots', title: 'Our Spots', body: 'Filter by Dinner, tap “I go here”, add a place.' },
  { to: '/takeaways', match: (r) => r.name === 'takeaways', title: 'Takeaways', body: 'Save a useful idea from a session.' },
  { to: '/note', match: (r) => r.name === 'note', title: 'Sunday note', body: 'Exactly what goes out each Sunday. Organizer can copy it.' },
  { to: '/me', match: (r) => r.name === 'me', title: 'Invites and profile', body: 'Make an invite link. Add LinkedIn or Instagram.' },
];

const HOST_TIPS = [
  'Host something: the button on This week (organizer and hosts only).',
  'Make someone a host: open their profile, then the “…” menu.',
];

export default function SandboxGuide({ route }) {
  const { isMember, profile } = useSession();
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem('kitside:guide') !== 'closed'; } catch { return true; }
  });
  const [seen, setSeen] = useState(() => new Set());

  useEffect(() => {
    const i = STEPS.findIndex((s) => s.match(route));
    if (i >= 0) setSeen((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  }, [route]);

  const toggle = (next) => {
    setOpen(next);
    try { localStorage.setItem('kitside:guide', next ? 'open' : 'closed'); } catch { /* fine */ }
  };

  if (!open) {
    return <button type="button" className="guide-fab" onClick={() => toggle(true)}>Sandbox guide · {seen.size}/{STEPS.length}</button>;
  }

  return (
    <aside className="guide" aria-label="Sandbox guide">
      <header className="guide-head">
        <div>
          <strong>Sandbox guide</strong>
          <span>{seen.size} of {STEPS.length} looked at</span>
        </div>
        <button type="button" className="icon-btn" onClick={() => toggle(false)} aria-label="Hide the guide">
          <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </header>

      {!isMember && (
        <div className="guide-join">
          <p>Most tools need a member. Walk in as the organizer to try everything.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={async () => { await api.demoQuickJoin(); navigate('/'); }}>Try it as the organizer</button>
        </div>
      )}

      <ol className="guide-steps">
        {STEPS.map((s, i) => {
          const here = s.match(route);
          return (
            <li key={s.to} className={`${here ? 'is-here' : ''} ${seen.has(i) ? 'is-seen' : ''}`}>
              <Link to={s.to}>
                <span className="guide-dot" aria-hidden="true">{seen.has(i) ? '✓' : i + 1}</span>
                <span><strong>{s.title}</strong><small>{s.body}</small></span>
              </Link>
            </li>
          );
        })}
      </ol>

      {(profile?.isAdmin || profile?.isHost) && (
        <ul className="guide-tips">{HOST_TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
      )}

      <footer className="guide-foot">
        <button type="button" className="text-btn small" onClick={async () => { await api.resetPreview(); setSeen(new Set()); navigate('/'); }}>Start the sandbox over</button>
      </footer>
    </aside>
  );
}
