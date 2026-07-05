// Placeholder — the real forge (Claude-powered question generation with
// auto-verification) lands in Phase 5.
export default function ForgeModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Forge new question">
        <h2>✦ Forge new question</h2>
        <p className="note">The forge is still being built.</p>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
