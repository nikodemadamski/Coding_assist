import { Component } from 'react';

// The last line of defence. Everything this app knows lives in ONE localStorage
// key with no server copy, so a throw inside render used to mean a blank page
// that came back blank on every reload — the record was still there, but the
// only way to reach it was devtools.
//
// The fallback's job is therefore not an apology. It is (1) get the raw record
// OUT of the browser, before anything else is touched, and (2) offer the
// smallest repair that could get the app running again. Reset is last, wants a
// second click, and never appears before the export button.
//
// The export here deliberately reads localStorage directly rather than going
// through state/storage.js: whatever broke may be in that layer, and a rescue
// path that depends on the thing that failed is not a rescue path.
const PROGRESS_KEY = 'zoro.progress.v1';
const CUSTOM_KEY = 'zoro.customQuestions.v1';

function rescueDownload() {
  let payload;
  try {
    payload = JSON.stringify(
      {
        app: 'zoroclaude-dojo',
        version: 1,
        exportedAt: new Date().toISOString(),
        rescued: true,
        progress: JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null'),
        customQuestions: JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'),
      },
      null,
      2
    );
  } catch {
    // Even unparseable, the raw text is worth more than nothing — it is the
    // only copy of the training record that exists anywhere.
    payload = JSON.stringify({
      app: 'zoroclaude-dojo',
      rescued: true,
      unparsed: true,
      rawProgress: localStorage.getItem(PROGRESS_KEY),
      rawCustomQuestions: localStorage.getItem(CUSTOM_KEY),
    });
  }
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `zoroclaude-dojo-rescue-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, saved: false, confirmingReset: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error, saved, confirmingReset } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash">
        <div className="crash-inner">
          <h1>The dojo hit an error.</h1>
          <p className="crash-lede">
            Your training record is still in this browser — nothing has been deleted. Save a copy
            first, then try the repairs below.
          </p>

          <div className="crash-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                rescueDownload();
                this.setState({ saved: true });
              }}
            >
              {saved ? 'Saved — download again' : 'Save my record to a file'}
            </button>
            <button className="btn" onClick={() => window.location.reload()}>
              Reload the page
            </button>
          </div>

          <details className="crash-detail">
            <summary>What went wrong</summary>
            <pre>{String(error?.message || error)}</pre>
          </details>

          {/* Last resort, and deliberately two clicks. Wiping the record is the
              one action here that cannot be undone, so it never sits under the
              cursor by accident. */}
          <div className="crash-reset">
            {confirmingReset ? (
              <>
                <p className="crash-warn">
                  This erases every solve, draft, review date and note in this browser. If you have
                  not saved a file above, that history is gone for good.
                </p>
                <div className="crash-actions">
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      try {
                        localStorage.removeItem(PROGRESS_KEY);
                      } catch {
                        // nothing left to do — the reload below is still worth trying
                      }
                      window.location.reload();
                    }}
                  >
                    Erase it and start clean
                  </button>
                  <button
                    className="btn-plain"
                    onClick={() => this.setState({ confirmingReset: false })}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <button className="btn-plain" onClick={() => this.setState({ confirmingReset: true })}>
                Still broken? Clear the saved record…
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
