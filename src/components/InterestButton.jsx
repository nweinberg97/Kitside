import { useState } from 'react';
import { useMemberGate } from '../state/useMemberGate.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';

/**
 * "I'm interested" → "You're in". Optimistic: the count and state flip
 * immediately and roll back if the save fails.
 */
export default function InterestButton({ interestedIds, onSave, label = 'I’m interested', size }) {
  const { profile } = useSession();
  const gate = useMemberGate();
  const toast = useToast();
  const [ids, setIds] = useState(interestedIds);
  const [busy, setBusy] = useState(false);
  const mine = profile ? ids.includes(profile.id) : false;
  const count = ids.length;

  async function toggle() {
    if (!gate('say you’re in')) return;
    const next = !mine;
    const prev = ids;
    setIds(next ? [...ids, profile.id] : ids.filter((x) => x !== profile.id));
    setBusy(true);
    try {
      await onSave(next);
      if (next) toast('You’re in. Others can see you’re interested.');
    } catch (e) {
      setIds(prev);
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`interest ${size === 'small' ? 'interest-small' : ''}`}>
      <span className="interest-count" aria-live="polite">
        <strong>{count}</strong> interested
      </span>
      <button type="button" className={`btn-interest ${mine ? 'is-in' : ''}`} onClick={toggle} disabled={busy} aria-pressed={mine}>
        <span className="btn-interest-check" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span>{mine ? 'You’re in' : label}</span>
      </button>
    </div>
  );
}
