import { useState } from 'react';
import PersonCard from '../components/PersonCard.jsx';
import { ChipGroup, Field } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { INTERESTS, LOOKING_FOR, NEIGHBOURHOODS, ROLES } from '../lib/constants.js';
import { firstName } from '../lib/format.js';
import { Link, Redirect } from '../lib/router.jsx';
import { useSession } from '../state/session.jsx';

const STEPS = ['What do you do?', 'What are you into?', 'What are you looking for?', 'What are you building or working on?'];

export default function Welcome() {
  const { user, profile, loading, setProfile } = useSession();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => ({
    name: user?.name || '', role: '', title: '', isRemote: false,
    interests: [], lookingFor: [], workingOn: '', neighbourhood: 'Kitsilano', bio: '',
  }));

  if (loading) return null;
  if (!user) return <Redirect to="/join" />;
  if (profile && !done) return <Redirect to="/me" />;

  const name = form.name || user.name || '';
  const patch = (p) => { setForm((f) => ({ ...f, ...p })); setError(''); };

  function nextStep() {
    if (step === 0 && !form.role) return setError('Pick the one that fits best. “Other” is fine.');
    if (step === 1 && form.interests.length === 0) return setError('Pick at least one.');
    if (step === 2 && form.lookingFor.length === 0) return setError('Pick at least one.');
    setStep((s) => s + 1);
  }

  async function finish(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Add your name so neighbours know who you are.');
    setBusy(true);
    try {
      const saved = await api.saveProfile({
        ...form, name: name.trim(), title: form.title.trim(), workingOn: form.workingOn.trim(), bio: form.bio.trim(),
        avatarUrl: user.avatarUrl || '', avatarHue: Math.floor(Math.random() * 360), linkedinUrl: '',
      });
      setDone(saved);
      setProfile(saved);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="page page-auth">
        <div className="welcome-done">
          <div className="welcome-pin" aria-hidden="true"><span /></div>
          <h1>You’re on the map, {firstName(done.name)}.</h1>
          <p>Here’s how neighbours will see you. You can change any of it from your profile.</p>
          <div className="welcome-card"><PersonCard person={done} /></div>
          <div className="hero-actions">
            <Link to="/people" className="btn btn-primary btn-lg">See who’s around</Link>
            <Link to="/things" className="btn btn-ghost btn-lg">Find something to do</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-auth">
      <form className="onboard" onSubmit={step === 3 ? finish : (e) => { e.preventDefault(); nextStep(); }} noValidate>
        <ol className="onboard-progress" aria-label={`Step ${step + 1} of 4`}>
          {STEPS.map((s, i) => <li key={s} className={i <= step ? 'is-on' : ''} />)}
        </ol>
        <p className="onboard-count">Step {step + 1} of 4</p>
        <h1 key={step} className="onboard-q">{STEPS[step]}</h1>

        {step === 0 && (
          <div className="stack">
            <ChipGroup label="What you do" options={ROLES} value={form.role} onChange={(role) => patch({ role })} />
            <Field label="How would you describe it?" htmlFor="w-title" hint="Optional. For example: “Product designer” or “Physio, curious about tech”.">
              <input id="w-title" maxLength={80} value={form.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <label className="check">
              <input type="checkbox" checked={form.isRemote} onChange={(e) => patch({ isRemote: e.target.checked })} />
              <span>I work remotely or from home most days</span>
            </label>
          </div>
        )}
        {step === 1 && <ChipGroup multiple label="Interests" options={INTERESTS} value={form.interests} onChange={(interests) => patch({ interests })} />}
        {step === 2 && <ChipGroup multiple label="Looking for" options={LOOKING_FOR} value={form.lookingFor} onChange={(lookingFor) => patch({ lookingFor })} />}
        {step === 3 && (
          <div className="stack">
            <Field label="Working on" htmlFor="w-work" hint="Optional. A startup, a side project, a book, a garden. Or nothing.">
              <input id="w-work" maxLength={140} placeholder="A better way to find pickup soccer" value={form.workingOn} onChange={(e) => patch({ workingOn: e.target.value })} />
            </Field>
            <div className="field-row">
              <Field label="Your name" htmlFor="w-name">
                <input id="w-name" maxLength={60} value={name} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <Field label="Neighbourhood" htmlFor="w-hood" hint="Only this is shown. Never your address.">
                <select id="w-hood" value={form.neighbourhood} onChange={(e) => patch({ neighbourhood: e.target.value })}>
                  {NEIGHBOURHOODS.map((n) => <option key={n}>{n}</option>)}
                </select>
              </Field>
            </div>
          </div>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="onboard-actions">
          {step > 0 ? <button type="button" className="btn btn-quiet" onClick={() => { setStep((s) => s - 1); setError(''); }}>Back</button> : <span />}
          <button className="btn btn-primary btn-lg" disabled={busy}>
            {step < 3 ? 'Next' : busy ? 'Creating your profile…' : 'Create my profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
