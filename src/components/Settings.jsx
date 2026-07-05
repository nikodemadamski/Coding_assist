import { useRef, useState } from 'react';
import { exportData, parseImport, loadApiKey, saveApiKey } from '../state/storage.js';

export default function Settings({ progress, customQuestions, onImport, onClose }) {
  const [apiKey, setApiKey] = useState(loadApiKey);
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  function handleSaveKey() {
    saveApiKey(apiKey.trim());
    setMessage('API key saved to this browser.');
  }

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
      setMessage('Import complete — progress and forged questions restored.');
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

        <label htmlFor="api-key">Anthropic API key (for ✦ Forge)</label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          autoComplete="off"
        />
        <p className="note">
          Your key is stored only in this browser&apos;s localStorage and sent only to
          api.anthropic.com — it never leaves your browser for anywhere else. Get one at
          console.anthropic.com.
        </p>
        <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
          <button className="btn" onClick={handleSaveKey}>
            Save key
          </button>
        </div>

        <label>Backup</label>
        <p className="note">
          Progress, drafts, review schedule and forged questions live in localStorage. Export
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
