import { useState } from 'react';
import { forgeQuestion } from '../forge/forge.js';
import { loadApiKey } from '../state/storage.js';

const TOPIC_CHIPS = {
  python: [
    'dicts & counting',
    'sets',
    'strings',
    'two pointers',
    'sliding window',
    'stack',
    'binary search',
    'recursion',
  ],
  pandas: ['filtering', 'groupby & agg', 'merge/join', 'missing data', 'sorting & top-N', 'datetime'],
  sql: ['joins', 'group by', 'having', 'subqueries', 'window functions', 'case expressions'],
};

export default function ForgeModal({ existingIds, onForged, onClose }) {
  const [track, setTrack] = useState('python');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  async function handleForge() {
    const chosenTopic = topic.trim();
    if (!chosenTopic) {
      setError('Pick or type a topic first.');
      return;
    }
    setWorking(true);
    setError('');
    setStatus('');
    try {
      const question = await forgeQuestion({
        apiKey: loadApiKey(),
        track,
        topic: chosenTopic,
        difficulty,
        existingIds,
        onStatus: setStatus,
      });
      onForged(question);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setWorking(false);
      setStatus('');
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && !working && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Forge new question">
        <h2>✦ Forge new question</h2>
        <p className="note">
          Claude writes a brand-new problem, then the dojo verifies its solution in the real
          runner before it enters your bank.
        </p>

        <label htmlFor="forge-track">Track</label>
        <select
          id="forge-track"
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          disabled={working}
        >
          <option value="python">python</option>
          <option value="pandas">pandas</option>
          <option value="sql">sql</option>
        </select>

        <label htmlFor="forge-topic">Topic</label>
        <div className="chip-row">
          {TOPIC_CHIPS[track].map((t) => (
            <button
              key={t}
              className={`chip ${topic === t ? 'active' : ''}`}
              onClick={() => setTopic(t)}
              disabled={working}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          id="forge-topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="…or type your own topic"
          style={{ marginTop: 8 }}
          disabled={working}
        />

        <label htmlFor="forge-difficulty">Difficulty</label>
        <select
          id="forge-difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          disabled={working}
        >
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>

        {working && (
          <div className="loader" style={{ padding: '18px 0 4px' }}>
            <div className="spinner" aria-hidden="true" />
            <span role="status">{status || 'Working…'}</span>
          </div>
        )}
        {error && (
          <p className="note" role="alert" style={{ color: 'var(--crimson)', marginTop: 12 }}>
            {error}
          </p>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose} disabled={working}>
            Cancel
          </button>
          <button className="btn btn-gold" onClick={handleForge} disabled={working}>
            {working ? 'Forging…' : '✦ Forge'}
          </button>
        </div>
      </div>
    </div>
  );
}
