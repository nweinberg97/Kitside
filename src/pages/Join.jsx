import { useState } from 'react';
import { Field } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { ENABLED_PROVIDERS, OAUTH_PROVIDERS } from '../lib/config.js';
import { Link, navigate } from '../lib/router.jsx';
import { useSession } from '../state/session.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Join({ mode = 'join', next = '/' }) {
  const isJoin = mode === 'join';
  const { user, profile } = useSession();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined, form: undefined })); };

  if (user && !busy && !sent) {
    return (
      <div className="page page-auth">
        <div className="auth-card">
          <h1>You’re already signed in</h1>
          <p className="muted">{user.email}</p>
          <Link className="btn btn-primary" to={profile ? next : '/welcome'}>{profile ? 'Keep going' : 'Finish your profile'}</Link>
        </div>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (isJoin && !form.name.trim()) errs.name = 'What should neighbours call you?';
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter an email like name@example.com.';
    if (form.password.length < (isJoin ? 8 : 1)) errs.password = isJoin ? 'Use at least 8 characters.' : 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      if (isJoin) {
        const { needsConfirmation } = await api.signUp(form);
        if (needsConfirmation) { setSent(true); setBusy(false); return; }
        navigate('/welcome');
      } else {
        await api.signIn(form);
        const p = await api.getMyProfile();
        navigate(p ? next : '/welcome');
      }
    } catch (err) {
      setErrors({ form: err.message });
      setBusy(false);
    }
  }

  async function oauth(provider) {
    setErrors({});
    try { await api.signInWithProvider(provider); } catch (err) { setErrors({ form: err.message }); }
  }

  if (sent) {
    return (
      <div className="page page-auth">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p>We sent a link to <strong>{form.email}</strong>. Open it on this device to confirm your account, then you’ll set up your profile.</p>
          <p className="muted">Nothing there? Check spam, or <button className="text-btn" onClick={() => setSent(false)}>try again</button>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-auth">
      <div className="auth-card">
        <h1>{isJoin ? 'Join Kitside' : 'Welcome back'}</h1>
        <p className="muted">
          {isJoin ? 'Free, local, and about a minute to set up.' : 'Log in to see who’s around.'}
        </p>

        <div className="oauth">
          {OAUTH_PROVIDERS.map((p) => {
            const on = ENABLED_PROVIDERS.includes(p.id);
            return (
              <button key={p.id} type="button" className={`btn btn-oauth oauth-${p.id}`} disabled={!on} onClick={() => oauth(p.id)}
                aria-describedby={on ? undefined : 'oauth-note'}>
                <ProviderMark id={p.id} />
                <span>{p.label}</span>
                {!on && <span className="soon">Not set up yet</span>}
              </button>
            );
          })}
          {ENABLED_PROVIDERS.length < OAUTH_PROVIDERS.length && (
            <p id="oauth-note" className="field-hint">Social sign-in is switched on provider by provider. Email works today.</p>
          )}
        </div>

        <div className="divider"><span>or with email</span></div>

        <form className="stack" onSubmit={submit} noValidate>
          {isJoin && (
            <Field label="Your name" htmlFor="j-name" error={errors.name}>
              <input id="j-name" autoComplete="name" maxLength={60} value={form.name} onChange={set('name')} />
            </Field>
          )}
          <Field label="Email" htmlFor="j-email" error={errors.email}>
            <input id="j-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Password" htmlFor="j-pass" error={errors.password} hint={isJoin ? 'At least 8 characters.' : undefined}>
            <input id="j-pass" type="password" autoComplete={isJoin ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} />
          </Field>
          {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? (isJoin ? 'Creating your account…' : 'Logging in…') : isJoin ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          {isJoin ? <>Already a member? <Link to={`/login?next=${encodeURIComponent(next)}`}>Log in</Link></> : <>New here? <Link to={`/join?next=${encodeURIComponent(next)}`}>Join Kitside</Link></>}
        </p>
        <p className="fine-print">Kitside only ever shows your neighbourhood, never your address. You choose everything on your profile.</p>
      </div>
    </div>
  );
}

function ProviderMark({ id }) {
  if (id === 'google') return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.2-3.9 7.1-9.6 7.1-17.1z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.7 2.3-8.7 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
  if (id === 'apple') return (
    <svg width="16" height="18" viewBox="0 0 17 20" aria-hidden="true"><path fill="currentColor" d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1zM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" /></svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A66C2" /><path fill="#fff" d="M7 9.5h2.7V18H7zM8.3 5.5a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zM11.3 9.5h2.6v1.2c.4-.7 1.3-1.4 2.6-1.4 2.8 0 3.3 1.8 3.3 4.2V18h-2.7v-4c0-1 0-2.2-1.4-2.2s-1.6 1-1.6 2.1V18h-2.7z" /></svg>
  );
}
