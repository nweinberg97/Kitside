/* Building blocks for the weekly rhythm: updates, asks, the session card, hosting. */
import { useState } from 'react';
import { api } from '../lib/api.js';
import { CATEGORIES, LIMITS } from '../lib/constants.js';
import { ago, dayLabel, firstName, timeLabel, toYmd } from '../lib/format.js';
import { Link } from '../lib/router.jsx';
import { dinnerIsOn } from '../lib/week.js';
import { useMemberGate } from '../state/useMemberGate.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';
import { PinIcon } from './PersonCard.jsx';
import { Avatar, DemoTag, Field, Modal, PersonLink } from './ui.jsx';

export { HostBadge } from './ui.jsx';

const PLACEHOLDER = {
  working_on: 'This week I’m working on…',
  ask: 'I could use help with…',
};

/** One-line composer. Enforces the character limit so updates stay short. */
export function UpdateComposer({ kind, onPosted, compact = false }) {
  const { profile } = useSession();
  const gate = useMemberGate();
  const toast = useToast();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const max = LIMITS[kind];
  const left = max - body.length;

  async function submit(e) {
    e.preventDefault();
    if (!gate(kind === 'ask' ? 'ask for help' : 'share what you’re working on')) return;
    if (!body.trim()) return;
    setBusy(true);
    try {
      const u = await api.createUpdate({ kind, body });
      setBody('');
      onPosted?.(u);
      toast(kind === 'ask' ? 'Posted. It’ll be in Sunday’s note.' : 'Updated. It’ll be in Sunday’s note.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`one-line ${compact ? 'is-compact' : ''}`} onSubmit={submit}>
      {profile && <Avatar profile={profile} size={30} />}
      <label className="sr-only" htmlFor={`ol-${kind}`}>{PLACEHOLDER[kind]}</label>
      <input
        id={`ol-${kind}`} value={body} maxLength={max} placeholder={PLACEHOLDER[kind]} autoComplete="off"
        onChange={(e) => setBody(e.target.value)}
      />
      {body && <span className={`one-line-count ${left < 10 ? 'is-low' : ''}`} aria-live="polite">{left}</span>}
      <button className="btn btn-primary btn-sm" disabled={busy || !body.trim()}>{busy ? 'Posting…' : 'Post'}</button>
    </form>
  );
}

/** "Working on": one line per person. */
export function WorkingOnList({ items, empty = 'Nobody’s posted yet this week.' }) {
  if (!items.length) return <p className="list-empty">{empty}</p>;
  return (
    <ul className="line-list">
      {items.map((u) => (
        <li key={u.id}>
          <Avatar profile={u.author} size={34} />
          <p>
            <PersonLink profile={u.author} className="line-who" />
            <span className="line-text">{u.body}</span>
          </p>
          <span className="line-meta">{u.isDemo ? <DemoTag /> : ago(u.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

/** "Needs help": each ask with an "I can help" toggle. */
export function AskList({ items, onChanged, empty = 'No open asks right now.' }) {
  if (!items.length) return <p className="list-empty">{empty}</p>;
  return (
    <ul className="line-list">
      {items.map((u) => <AskRow key={u.id} ask={u} onChanged={onChanged} />)}
    </ul>
  );
}

function AskRow({ ask, onChanged }) {
  const { profile } = useSession();
  const gate = useMemberGate();
  const toast = useToast();
  const [ids, setIds] = useState(ask.helperIds);
  const mine = profile && ask.authorId === profile.id;
  const helping = profile && ids.includes(profile.id);

  async function toggle() {
    if (!gate('offer help')) return;
    const prev = ids;
    setIds(helping ? ids.filter((x) => x !== profile.id) : [...ids, profile.id]);
    try {
      await api.setHelping(ask.id, !helping);
      if (!helping) toast(`${firstName(ask.author?.name)} will see you can help. Their contact is on their profile.`);
    } catch (e) { setIds(prev); toast(e.message, 'error'); }
  }

  async function resolve() {
    try { await api.resolveUpdate(ask.id); toast('Marked as sorted.'); onChanged?.(); } catch (e) { toast(e.message, 'error'); }
  }

  return (
    <li>
      <Avatar profile={ask.author} size={34} />
      <p>
        <PersonLink profile={ask.author} className="line-who" />
        <span className="line-text">{ask.body}</span>
        {ids.length > 0 && <span className="line-help-count">{ids.length === 1 ? '1 person can help' : `${ids.length} people can help`}</span>}
      </p>
      <span className="line-meta">
        {mine ? (
          <button type="button" className="btn btn-quiet btn-xs" onClick={resolve}>Sorted</button>
        ) : (
          <button type="button" className={`btn btn-xs ${helping ? 'btn-sun' : 'btn-quiet'}`} aria-pressed={!!helping} onClick={toggle}>
            {helping ? 'You can help' : 'I can help'}
          </button>
        )}
      </span>
    </li>
  );
}

/** The weekly session (build, then an optional dinner). */
export function SessionCard({ session, peopleById }) {
  const { profile } = useSession();
  const gate = useMemberGate();
  const toast = useToast();
  const [going, setGoing] = useState(session.interestedIds);
  const [dinner, setDinner] = useState(session.dinnerIds);
  const [busy, setBusy] = useState(false);
  const d = new Date(session.startsAt);
  const me = profile?.id;
  const amIn = me && going.includes(me);
  const amEating = me && dinner.includes(me);
  const live = { ...session, dinnerIds: dinner };
  const need = Math.max(0, (session.dinnerMin || 3) - dinner.length);

  async function save(nextIn, nextDinner) {
    if (!gate('say you’re in')) return;
    const prev = [going, dinner];
    setGoing(nextIn ? [...new Set([...going, me])] : going.filter((x) => x !== me));
    setDinner(nextIn && nextDinner ? [...new Set([...dinner, me])] : dinner.filter((x) => x !== me));
    setBusy(true);
    try {
      await api.setActivityInterest(session.id, nextIn, { dinner: nextIn && nextDinner });
      if (nextIn && !amIn) toast('You’re in. See you there.');
    } catch (e) {
      setGoing(prev[0]); setDinner(prev[1]); toast(e.message, 'error');
    } finally { setBusy(false); }
  }

  const goingPeople = going.slice(0, 8);

  return (
    <article className="session">
      <div className="session-photo" aria-hidden="true" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}img/kits-park-people.jpg)` }} />
      <div className="session-body">
        <p className="session-kicker">{dayLabel(d)} · {timeLabel(d)} {session.isDemo && <DemoTag />}</p>
        <h2>{session.title}</h2>
        <p className="session-where"><PinIcon />{session.location}</p>
        {session.description && <p className="session-desc">{session.description}</p>}

        <div className="session-who">
          <div className="avatar-stack" aria-hidden="true">
            {goingPeople.map((id) => <span key={id}><Avatar profile={id === me ? profile : peopleById?.get(id) || (id === session.hostId ? session.host : null)} size={30} /></span>)}
          </div>
          <span><strong>{going.length}</strong> going</span>
        </div>

        <div className="session-actions">
          <button type="button" className={`btn-interest ${amIn ? 'is-in' : ''}`} aria-pressed={!!amIn} disabled={busy} onClick={() => save(!amIn, amEating)}>
            <span className="btn-interest-check" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span>{amIn ? 'You’re in' : 'I’m in'}</span>
          </button>
          {session.dinnerPlace && (
            <label className={`dinner-toggle ${amEating ? 'is-on' : ''}`}>
              <input type="checkbox" checked={!!amEating} disabled={busy} onChange={(e) => save(true, e.target.checked)} />
              <span>Staying for dinner</span>
            </label>
          )}
        </div>

        {session.dinnerPlace && (
          <p className={`dinner-status ${dinnerIsOn(live) ? 'is-on' : ''}`}>
            {dinnerIsOn(live)
              ? <>Dinner’s on at <strong>{session.dinnerPlace}</strong>{session.dinnerTime ? `, ${timeLabel(new Date(`2000-01-01T${session.dinnerTime}`))}` : ''} · {dinner.length} staying</>
              : <>Dinner at <strong>{session.dinnerPlace}</strong> happens when {session.dinnerMin} say yes · {need} more needed</>}
          </p>
        )}
        <p className="session-host">Hosted by <PersonLink profile={session.host} /></p>
      </div>
    </article>
  );
}

/** Hosts create events. A session can carry an optional dinner. */
export function HostEventDialog({ onClose, onCreated, asSession = false }) {
  const toast = useToast();
  const tomorrow = new Date(Date.now() + 864e5);
  const [f, setF] = useState({
    title: asSession ? 'Build & Break Bread' : '', category: asSession ? 'Build' : 'Move', location: '', date: toYmd(tomorrow),
    time: asSession ? '16:00' : '18:00', description: '', isSession: asSession, dinnerPlace: '', dinnerTime: '18:30', dinnerMin: 3,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); setErrors({}); };

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!f.title.trim()) errs.title = 'Give it a name.';
    if (!f.location.trim()) errs.location = 'Where should people meet?';
    const startsAt = new Date(`${f.date}T${f.time}`);
    if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) errs.date = 'Pick a time in the future.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const a = await api.createActivity({
        title: f.title.trim(), category: f.category, location: f.location.trim(), description: f.description.trim(),
        startsAt: startsAt.toISOString(), isSession: f.isSession,
        dinnerPlace: f.isSession ? f.dinnerPlace.trim() : '', dinnerTime: f.isSession && f.dinnerPlace.trim() ? f.dinnerTime : null,
        dinnerMin: Number(f.dinnerMin) || 3,
      });
      toast('Event posted. It’ll be in Sunday’s note.');
      onCreated?.(a);
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
      setBusy(false);
    }
  }

  return (
    <Modal title={asSession ? 'Plan a session' : 'Host something'} onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <Field label="What" htmlFor="h-title" error={errors.title}>
          <input id="h-title" maxLength={80} value={f.title} onChange={set('title')} placeholder="Saturday run" />
        </Field>
        <div className="field">
          <span className="field-label">Kind</span>
          <div className="chip-group" role="group" aria-label="Kind">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" className={`chip ${f.category === c.id ? 'chip-on' : ''}`} aria-pressed={f.category === c.id}
                onClick={() => setF((x) => ({ ...x, category: c.id }))}>{c.id}</button>
            ))}
          </div>
        </div>
        <Field label="Where" htmlFor="h-where" error={errors.location} hint="A place name or area. Never a home address.">
          <input id="h-where" maxLength={80} value={f.location} onChange={set('location')} placeholder="Kits Beach, by the volleyball courts" />
        </Field>
        <div className="field-row">
          <Field label="Day" htmlFor="h-date" error={errors.date}><input id="h-date" type="date" value={f.date} onChange={set('date')} /></Field>
          <Field label="Time" htmlFor="h-time"><input id="h-time" type="time" value={f.time} onChange={set('time')} /></Field>
        </div>
        <Field label="Details" htmlFor="h-desc" hint="Optional. One or two lines.">
          <textarea id="h-desc" rows={2} maxLength={400} value={f.description} onChange={set('description')} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={f.isSession} onChange={set('isSession')} />
          <span>This is the weekly session (shows first, with an optional dinner)</span>
        </label>
        {f.isSession && (
          <div className="sub-fields">
            <Field label="Dinner spot" htmlFor="h-dinner" hint="Optional. Leave blank for no dinner this week.">
              <input id="h-dinner" maxLength={80} value={f.dinnerPlace} onChange={set('dinnerPlace')} placeholder="Somewhere new on West 4th" />
            </Field>
            <div className="field-row">
              <Field label="Dinner at" htmlFor="h-dtime"><input id="h-dtime" type="time" value={f.dinnerTime} onChange={set('dinnerTime')} /></Field>
              <Field label="Dinner happens when" htmlFor="h-dmin" hint="people say they’re staying">
                <select id="h-dmin" value={f.dinnerMin} onChange={set('dinnerMin')}>
                  {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} or more</option>)}
                </select>
              </Field>
            </div>
          </div>
        )}
        {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Post event'}</button>
        </div>
      </form>
    </Modal>
  );
}

/** Contact links instead of DMs. Email first; LinkedIn and Instagram if they added them. */
export function ContactRow({ person }) {
  const links = [
    person.contactEmail && { key: 'email', href: `mailto:${person.contactEmail}`, label: 'Email', sub: person.contactEmail },
    person.linkedinUrl && { key: 'li', href: person.linkedinUrl, label: 'LinkedIn', ext: true },
    person.instagram && { key: 'ig', href: `https://instagram.com/${person.instagram}`, label: 'Instagram', sub: `@${person.instagram}`, ext: true },
  ].filter(Boolean);
  if (!links.length) return <p className="muted">{firstName(person.name)} hasn’t added contact details yet. Say hi at the next session.</p>;
  return (
    <ul className="contact-row">
      {links.map((l) => (
        <li key={l.key}>
          <a href={l.href} {...(l.ext ? { target: '_blank', rel: 'noreferrer noopener' } : {})}>
            <ContactIcon kind={l.key} />
            <span><strong>{l.label}</strong>{l.sub && <small>{l.sub}</small>}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function ContactIcon({ kind }) {
  const common = { width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (kind === 'email') return <svg {...common}><rect x="2.5" y="4.5" width="15" height="11" rx="2" /><path d="M3 5.5l7 5.5 7-5.5" /></svg>;
  if (kind === 'li') return <svg {...common}><rect x="2.5" y="2.5" width="15" height="15" rx="3" /><path d="M6.5 9v5M6.5 6.2v.1M9.5 14v-5M9.5 11.2c0-1.4.9-2.2 2-2.2s2 .7 2 2.2V14" /></svg>;
  return <svg {...common}><rect x="2.5" y="2.5" width="15" height="15" rx="4.5" /><circle cx="10" cy="10" r="3.4" /><path d="M14.3 5.7v.1" /></svg>;
}

/** Small "see all" link used on the week page. */
export const MoreLink = ({ to, children }) => <Link to={to} className="more-link">{children}</Link>;
