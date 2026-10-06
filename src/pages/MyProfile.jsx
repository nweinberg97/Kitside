import { useState } from 'react';
import PersonCard from '../components/PersonCard.jsx';
import { ChipGroup, Field } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { INTERESTS, LOOKING_FOR, NEIGHBOURHOODS, ROLES } from '../lib/constants.js';
import { navigate, Redirect } from '../lib/router.jsx';
import { useLoad } from '../lib/useLoad.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';

const LINKEDIN_RE = /^https:\/\/([a-z]+\.)?linkedin\.com\//i;

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
    if (!form.lookingFor.length) errs.lookingFor = 'Pick at least one.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const saved = await api.saveProfile({ ...form, name: form.name.trim(), linkedinUrl: form.linkedinUrl.trim() });
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
          <p>This is everything neighbours can see about you.</p>
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
            <textarea id="m-bio" rows={3} maxLength={280} placeholder="A line or two. What would a neighbour want to know?" value={form.bio} onChange={(e) => patch({ bio: e.target.value })} />
          </Field>
          <Field label="Working on" htmlFor="m-work">
            <input id="m-work" maxLength={140} value={form.workingOn} onChange={(e) => patch({ workingOn: e.target.value })} />
          </Field>
          <div className="field">
            <span className="field-label">Into</span>
            <ChipGroup multiple label="Interests" options={interestOptions} value={form.interests} onChange={(interests) => patch({ interests })} />
          </div>
          <div className={`field ${errors.lookingFor ? 'field-error' : ''}`}>
            <span className="field-label">Open to</span>
            <ChipGroup multiple label="Looking for" options={LOOKING_FOR} value={form.lookingFor} onChange={(lookingFor) => patch({ lookingFor })} />
            {errors.lookingFor && <p className="field-msg" role="alert">{errors.lookingFor}</p>}
          </div>
          <Field label="LinkedIn" htmlFor="m-li" error={errors.linkedinUrl} hint="Optional. Shown as a link on your profile. Kitside doesn’t verify it.">
            <input id="m-li" type="url" placeholder="https://www.linkedin.com/in/…" value={form.linkedinUrl} onChange={(e) => patch({ linkedinUrl: e.target.value })} />
          </Field>
          {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save profile'}</button>
            {dirty && <button type="button" className="btn btn-quiet" onClick={() => setForm(profile)}>Discard changes</button>}
          </div>
        </form>
      </div>

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

      {api.mode === 'preview' && (
        <section className="profile-section">
          <h2>Preview data</h2>
          <p className="muted">Everything here lives in this browser. Start over to wipe your account and restore the example community.</p>
          <button className="btn btn-quiet" onClick={async () => { if (window.confirm('Delete your preview account and start over?')) { await api.resetPreview(); navigate('/'); } }}>
            Start over
          </button>
        </section>
      )}
    </div>
  );
}
