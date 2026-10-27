import { useState } from 'react';
import PersonCard from '../components/PersonCard.jsx';
import { ChipGroup, Field } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { INTERESTS, LOOKING_FOR, NEIGHBOURHOODS, ROLES, inviteCap } from '../lib/constants.js';
import { ago } from '../lib/format.js';
import { navigate, Redirect } from '../lib/router.jsx';
import { useLoad } from '../lib/useLoad.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';

const LINKEDIN_RE = /^https:\/\/([a-z]+\.)?linkedin\.com\//i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IG_RE = /^[A-Za-z0-9._]{0,30}$/;

export default function MyProfile() {
  const { user, profile, loading, setProfile, signOut, blocked, setBlocked } = useSession();
  const toast = useToast();
  const [form, setForm] = useState(profile);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const blockedPeople = useLoad(async () => {
    if (!blocked.size) return [];
    const all = await api.listProfiles();
    return all.filter((p) => blocked.has(p.id));
  }, [blocked.size]);

  if (loading) return null;
  if (!user) return <Redirect to="/login" />;
  if (!profile) return <Redirect to="/welcome" />;
  if (!form) { setForm(profile); return null; }

  const patch = (p) => { setForm((f) => ({ ...f, ...p })); setErrors({}); };
  const dirty = JSON.stringify(form) !== JSON.stringify(profile);

  // Free-text interests from seed or earlier edits stay selectable.
  const interestOptions = [...new Set([...INTERESTS, ...profile.interests])];

  async function save(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Your name can’t be empty.';
    if (form.linkedinUrl && !LINKEDIN_RE.test(form.linkedinUrl.trim())) errs.linkedinUrl = 'Paste the full link, starting with https://www.linkedin.com/';
    if (form.contactEmail && !EMAIL_RE.test(form.contactEmail.trim())) errs.contactEmail = 'Enter an email like name@example.com.';
    const ig = (form.instagram || '').trim().replace(/^@/, '');
    if (!IG_RE.test(ig)) errs.instagram = 'Just the handle: letters, numbers, dots and underscores.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const saved = await api.saveProfile({
        ...form, name: form.name.trim(), linkedinUrl: form.linkedinUrl.trim(),
        contactEmail: (form.contactEmail || '').trim(), instagram: (form.instagram || '').trim().replace(/^@/, ''),
      });
      setProfile(saved); setForm(saved);
      toast('Profile saved.');
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function logOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <h1>My profile</h1>
          <p>This is everything other members can see about you.</p>
        </div>
        <button className="btn btn-quiet" onClick={logOut}>Log out</button>
      </header>

      <div className="me-layout">
        <aside className="me-preview">
          <p className="field-label">Preview</p>
          <PersonCard person={{ ...form, isDemo: false }} />
        </aside>

        <form className="me-form stack" onSubmit={save} noValidate>
          <div className="field-row">
            <Field label="Name" htmlFor="m-name" error={errors.name}>
              <input id="m-name" maxLength={60} value={form.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Neighbourhood" htmlFor="m-hood">
              <select id="m-hood" value={form.neighbourhood} onChange={(e) => patch({ neighbourhood: e.target.value })}>
                {[...new Set([...NEIGHBOURHOODS, form.neighbourhood])].map((n) => <option key={n}>{n}</option>)}
              </select>
            </Field>
          </div>
          <div className="field">
            <span className="field-label">What you do</span>
            <ChipGroup label="What you do" options={ROLES} value={form.role} onChange={(role) => patch({ role })} />
          </div>
          <Field label="How you describe it" htmlFor="m-title">
            <input id="m-title" maxLength={80} value={form.title} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
          <label className="check">
            <input type="checkbox" checked={form.isRemote} onChange={(e) => patch({ isRemote: e.target.checked })} />
            <span>I work remotely or from home most days</span>
          </label>
          <Field label="About you" htmlFor="m-bio" hint={`${280 - (form.bio || '').length} characters left`}>
            <textarea id="m-bio" rows={3} maxLength={280} placeholder="A line or two. What would someone at the table want to know?" value={form.bio} onChange={(e) => patch({ bio: e.target.value })} />
          </Field>

          <div className="field">
            <span className="field-label">Into</span>
            <ChipGroup multiple label="Interests" options={interestOptions} value={form.interests} onChange={(interests) => patch({ interests })} />
          </div>
          <div className="field">
            <span className="field-label">Open to</span>
            <ChipGroup multiple label="Looking for" options={LOOKING_FOR} value={form.lookingFor} onChange={(lookingFor) => patch({ lookingFor })} />
          </div>

          <fieldset className="fieldset">
            <legend>Get in touch</legend>
            <p className="field-hint">Kitside has no messages. Members reach you here instead. Only members can see these.</p>
            <Field label="Email" htmlFor="m-email" error={errors.contactEmail} hint="Shown by default. Clear it to hide it.">
              <input id="m-email" type="email" value={form.contactEmail || ''} onChange={(e) => patch({ contactEmail: e.target.value })} />
            </Field>
            <div className="field-row">
              <Field label="LinkedIn" htmlFor="m-li" error={errors.linkedinUrl} hint="Optional.">
                <input id="m-li" type="url" placeholder="https://www.linkedin.com/in/…" value={form.linkedinUrl} onChange={(e) => patch({ linkedinUrl: e.target.value })} />
              </Field>
              <Field label="Instagram" htmlFor="m-ig" error={errors.instagram} hint="Optional. Just the handle.">
                <input id="m-ig" placeholder="yourhandle" value={form.instagram || ''} onChange={(e) => patch({ instagram: e.target.value })} />
              </Field>
            </div>
          </fieldset>

          <label className="check">
            <input type="checkbox" checked={form.weeklyNote !== false} onChange={(e) => patch({ weeklyNote: e.target.checked })} />
            <span>Send me the Sunday note</span>
          </label>
          {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save profile'}</button>
            {dirty && <button type="button" className="btn btn-quiet" onClick={() => setForm(profile)}>Discard changes</button>}
          </div>
        </form>
      </div>

      <Invites profile={profile} />

      <section className="profile-section">
        <h2>Blocked</h2>
        {!blocked.size ? <p className="muted">You haven’t blocked anyone.</p> : (
          <ul className="blocked-list">
            {(blockedPeople.data || []).map((p) => (
              <li key={p.id}>
                <span>{p.name}</span>
                <button className="text-btn" onClick={() => setBlocked(p.id, false).then(() => toast(`${p.name} is unblocked.`))}>Unblock</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {api.mode !== 'live' && (
        <section className="profile-section">
          <h2>{api.mode === 'demo' ? 'Demo data' : 'Preview data'}</h2>
          <p className="muted">Everything here lives in this browser. Start over to wipe your account and restore the sample community.</p>
          <button className="btn btn-quiet" onClick={async () => { if (window.confirm('Delete this browser-only account and start over?')) { await api.resetPreview(); navigate('/'); } }}>
            Start over
          </button>
        </section>
      )}
    </div>
  );
}

function Invites({ profile }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { data, reload } = useLoad(() => api.listMyInvites(), [profile.id]);
  const invites = data || [];
  const cap = inviteCap(profile);
  const left = cap === null ? null : Math.max(0, cap - invites.length);
  const linkFor = (code) => `${window.location.origin}${window.location.pathname}#/join?invite=${code}`;

  async function make() {
    setBusy(true);
    try {
      const code = await api.createInvite();
      await copy(code, true);
      reload();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  }

  async function copy(code, fresh = false) {
    try { await navigator.clipboard.writeText(linkFor(code)); toast(fresh ? 'Invite link made and copied. Send it to them directly.' : 'Invite link copied.'); }
    catch { toast(`Invite code: ${code}`); }
  }

  return (
    <section className="profile-section">
      <h2>Invites</h2>
      <p className="muted">
        Kitside is invite-only. Invite people you’d want at the table.{' '}
        {cap === null ? 'As the organizer, you have as many as you need.' : `You have ${left} of ${cap} left${profile.isHost ? ' (hosts get 5)' : ''}.`}
      </p>
      <div className="form-actions invite-actions">
        <button className="btn btn-primary" onClick={make} disabled={busy || left === 0}>{busy ? 'Making…' : 'Make an invite link'}</button>
      </div>
      {invites.length > 0 && (
        <ul className="invite-list">
          {invites.map((i) => (
            <li key={i.code}>
              <code>{i.code}</code>
              {i.usedBy ? <span className="muted">Joined{i.usedBy.name ? `: ${i.usedBy.name}` : ''}</span> : <span className="muted">Not used yet · made {ago(i.createdAt)}</span>}
              {!i.usedBy && <button className="text-btn" onClick={() => copy(i.code)}>Copy link</button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
