import { useRef, useState } from 'react';
import { exportData, parseImport } from '../state/storage.js';

export default function Settings({ progress, customQuestions, onImport, onClose }) {
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  function handleExport() {
    const blob = new Blob([exportData(progress, customQuestions)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zoroclaude-dojo-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Exported. Keep that file safe — it is your full training record.');
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = parseImport(await file.text());
      onImport(data);
      setMessage('Import complete — progress and imported questions restored.');
    } catch (err) {
      setMessage(`Import failed: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Settings">
        <h2>Settings</h2>

        <p className="note">
          This app never connects to any AI service. New questions come in through
          <strong> ＋ Import questions</strong> on the home screen — you generate them by talking
          to Claude yourself and paste the result in.
        </p>

        <label>Backup</label>
        <p className="note">
          Progress, drafts, review schedule and imported questions live in localStorage. Export
          regularly so you never lose data.
        </p>
        <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
          <button className="btn" onClick={handleExport}>
            ⬇ Export progress (JSON)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            ⬆ Import progress
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>

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
