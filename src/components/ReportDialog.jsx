import { useState } from 'react';
import { api } from '../lib/api.js';
import { REPORT_REASONS } from '../lib/constants.js';
import { useToast } from '../state/toast.jsx';
import { Modal } from './ui.jsx';

export default function ReportDialog({ targetType, targetId, subject, onClose }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!reason) return setError('Choose a reason.');
    setBusy(true);
    try {
      await api.report({ targetType, targetId, reason, note: note.trim() });
      toast('Reported. Thanks for looking out for the neighbourhood.');
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Report ${subject}`} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <p className="muted">Reports go to the people who look after Kitside. Nobody else sees who sent them.</p>
        <fieldset className="radio-list">
          <legend className="sr-only">Reason</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r} className="radio">
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => { setReason(r); setError(''); }} />
              <span>{r}</span>
            </label>
          ))}
        </fieldset>
        <label className="field">
          <span>Anything else we should know? <em className="optional">Optional</em></span>
          <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send report'}</button>
        </div>
      </form>
    </Modal>
  );
}
