import { useRef, useState } from 'react';
import { useFocusTrap } from './useFocusTrap.js';
import { parseImport, downloadExport, loadLastBackup, importSummary } from '../state/storage.js';
import { loadUiPrefs, saveUiPrefs, NAME_MAX } from '../state/uiPrefs.js';
import { restAllowance, REST_DAYS_MAX } from '../state/progress.js';

export default function Settings({ progress, customQuestions, onImport, onBackedUp, onSetRestDays, onClose }) {
  const [message, setMessage] = useState('');
  const [name, setName] = useState(() => loadUiPrefs().name);
  const [lastBackup, setLastBackup] = useState(loadLastBackup);
  const [pending, setPending] = useState(null); // a parsed file awaiting confirmation
  // What the import would overwrite. Stated next to what arrives, because
  // "restore my backup" and "wipe six weeks of work" look identical otherwise.
  const currentSummary = importSummary(progress, customQuestions);
  const fileRef = useRef(null);
  const trapRef = useRef(null);
  useFocusTrap(trapRef, { onEscape: onClose });

  function handleExport() {
    const date = downloadExport(progress, customQuestions);
    setLastBackup(date);
    onBackedUp?.(date);
    setMessage('Exported. Keep that file safe — it is your full training record.');
  }

  // Importing REPLACES the whole record, and it used to happen the instant you
  // picked a file — no preview, no confirmation, no undo. Now the file is
  // parsed and held, and what it contains is stated against what it would
  // overwrite, so a restore can't be an accident.
  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = parseImport(await file.text());
      setPending({ data, summary: importSummary(data.progress, data.customQuestions) });
      setMessage('');
    } catch (err) {
      setPending(null);
      setMessage(`Import failed: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  }

  function confirmImport() {
    onImport(pending.data);
    setPending(null);
    setMessage('Import complete — progress and imported questions restored.');
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Settings" ref={trapRef}>
        <h2>Settings</h2>

        {/* The home screen greets you by name — this is whose dojo it is. */}
        <label className="set-name">
          <span className="set-name-label">Your name</span>
          <input
            className="set-name-input"
            value={name}
            maxLength={NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setName(saveUiPrefs({ name }).name)}
            placeholder="Nick"
            aria-label="Your name, used on the home screen"
          />
        </label>

        {/* The streak exists to keep you coming back, not to punish a week with
            no free evenings. This is the one number that decides whether a day
            off costs you the run, so it belongs to you, not to the app. */}
        {onSetRestDays && (
          <label className="set-rest">
            <span className="set-name-label">Rest days</span>
            <select
              className="set-rest-input"
              value={restAllowance(progress?.streak)}
              onChange={(e) => onSetRestDays(Number(e.target.value))}
              aria-label="How many days off in a row your streak survives"
            >
              {Array.from({ length: REST_DAYS_MAX + 1 }, (_, n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'none — every day counts' : `${n} day${n === 1 ? '' : 's'} in a row`}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="note">
          Your streak survives that many days off in a row. Rest days never count as training —
          they just do not reset the run.
        </p>

        <p className="note">
          This app never connects to any AI service. New questions come in through
          <strong> ＋ Import questions</strong> on the home screen — you generate them by talking
          to Claude yourself and paste the result in.
        </p>

        <label>Backup</label>
        <p className="note">
          Progress, drafts, review schedule and imported questions live in localStorage. Export
          regularly so you never lose data.{' '}
          <span className="last-backup">
            {lastBackup ? `Last backup: ${lastBackup}.` : 'Never backed up yet.'}
          </span>
        </p>
        <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
          <button className="btn" onClick={handleExport}>
            Export progress (JSON)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import progress
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>

        {pending && (
          <div className="import-confirm" role="alertdialog" aria-label="Confirm import">
            <p className="import-confirm-head">
              This replaces everything in this browser. It cannot be undone.
            </p>
            <ul className="import-confirm-list">
              <li>
                <strong>{pending.summary.solves}</strong> solved question
                {pending.summary.solves === 1 ? '' : 's'} in the file
                <span className="import-confirm-now">
                  you have {currentSummary.solves} now
                </span>
              </li>
              <li>
                <strong>{pending.summary.lessons}</strong> lesson
                {pending.summary.lessons === 1 ? '' : 's'} finished
                <span className="import-confirm-now">you have {currentSummary.lessons} now</span>
              </li>
              <li>
                <strong>{pending.summary.mocks}</strong> mock interview
                {pending.summary.mocks === 1 ? '' : 's'}
                <span className="import-confirm-now">you have {currentSummary.mocks} now</span>
              </li>
            </ul>
            {pending.summary.solves < currentSummary.solves && (
              <p className="import-confirm-warn">
                That file has fewer solves than you do — check it is the one you meant before
                replacing your record.
              </p>
            )}
            <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
              <button className="btn btn-danger" onClick={confirmImport}>
                Replace my record
              </button>
              <button className="btn-plain" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {message && (
          <p className="note" role="status" style={{ marginTop: 14, color: 'var(--jade)' }}>
            {message}
          </p>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
