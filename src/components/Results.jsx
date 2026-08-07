import SqlResultTable from './SqlResultTable.jsx';
import { diagnose } from '../state/failureDiagnosis.js';

// The read on a failing run: one sentence about what the failures have in
// common, and one about where to look. Nothing here is a guess — every line is
// a fact derived from the results, and when there is no such fact the whole
// block is absent rather than filled with encouragement.
function FailureRead({ question, report }) {
  const d = diagnose(question, report);
  if (!d) return null;
  return (
    <div className={`fail-read read-${d.kind}`} role="status">
      <p className="fail-read-head">{d.headline}</p>
      <p className="fail-read-detail">{d.detail}</p>
    </div>
  );
}

function TestDetail({ result, call }) {
  return (
    <div className="test-row-detail">
      <div className="io-line">
        <span className="lbl">Input</span>
        <code>{call}</code>
      </div>
      {result.error ? (
        <div className="io-line io-error">
          <span className="lbl">Error</span>
          <code>{result.error}</code>
        </div>
      ) : (
        <>
          <div className="io-line">
            <span className="lbl">Expected</span>
            <code className="io-expected">{result.expectedRepr}</code>
          </div>
          <div className="io-line">
            <span className="lbl">Your output</span>
            <code className="io-got">{result.gotRepr}</code>
          </div>
        </>
      )}
    </div>
  );
}

function PyTestRow({ result, index, functionName }) {
  const call = functionName ? `${functionName}(${result.argsRepr})` : result.argsRepr;
  return (
    <div className={`test-row ${result.pass ? 'pass' : 'fail'}`}>
      <div className="test-row-head">
        <span className="test-row-mark">{result.pass ? '✓' : '✗'}</span>
        <span className="test-row-n">Test {index + 1}</span>
        <span className="test-row-call">{call}</span>
      </div>
      {!result.pass && <TestDetail result={result} call={call} />}
    </div>
  );
}

// A glanceable strip: one dot per test, green pass / red fail.
function TestDots({ results }) {
  if (results.length <= 1) return null;
  return (
    <div className="test-dots" aria-hidden="true">
      {results.map((r, i) => (
        <span key={i} className={`test-dot ${r.pass ? 'pass' : 'fail'}`} title={`Test ${i + 1}`} />
      ))}
    </div>
  );
}

export default function Results({ report, question }) {
  if (!report) {
    return (
      <div className="result-empty">
        <p className="result-empty-line">Test results will appear here.</p>
        <p className="result-empty-hint">
          Run checks your code against the examples. Submit records the attempt.
        </p>
      </div>
    );
  }

  if (report.status === 'error') {
    const titles = {
      timeout: 'Time limit exceeded',
      syntax: 'Syntax error',
      missing_function: 'Function not found',
      sql: 'SQL error',
      runtime: 'Error',
    };
    return (
      <div>
        <div className="result-head">
          <div className="result-summary fail">{titles[report.errorType] || 'Error'}</div>
        </div>
        <div className="error-box">{report.message}</div>
      </div>
    );
  }

  // SQL outcome: show actual vs expected tables — the visual diff is the point.
  if (report.sql) {
    const { pass, userColumns, userRows, expectedRows, orderMatters } = report.sql;
    return (
      <div>
        <div className={`result-summary ${pass ? 'pass' : 'fail'}`}>
          {pass ? '✓ Correct result' : '✗ Wrong result'}
          {!pass && orderMatters && (
            <span className="result-note">(row order matters for this one)</span>
          )}
        </div>
        <div className="sql-diff">
          <SqlResultTable columns={userColumns} rows={userRows} caption="Your result" />
          {!pass && (
            <SqlResultTable
              columns={userColumns && userColumns.length ? userColumns : null}
              rows={expectedRows}
              caption="Expected"
            />
          )}
        </div>
      </div>
    );
  }

  // python / pandas per-test results
  const results = report.results || [];
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const allPass = total > 0 && passed === total;
  const stdout = results
    .map((r, i) => (r.stdout ? `— test ${i + 1} —\n${r.stdout}` : ''))
    .filter(Boolean)
    .join('\n');

  // Failing tests first (that's where the learning is), then the passing ones.
  const ordered = [...results.map((r, i) => ({ r, i }))].sort(
    (a, b) => Number(a.r.pass) - Number(b.r.pass)
  );

  return (
    <div className={`results ${allPass ? 'all-pass' : ''}`}>
      {/* One status line: the verdict, then a dot per test. The old proportion
          bar said the same thing again and rendered as a bare hairline. */}
      <div className="result-head">
        <div className={`result-summary ${allPass ? 'pass' : 'fail'}`}>
          {allPass ? '✓' : '✗'} {passed}/{total} tests passed
        </div>
        <TestDots results={results} />
      </div>

      {allPass && (
        <div className="result-cheer">All tests green — nicely done. Hit Submit to lock it in.</div>
      )}

      {/* What the failing set is actually telling you. `diagnose` returns null
          whenever nothing is certainly true of the failures, and then this
          simply does not render — a guess here would be worse than silence.
          See state/failureDiagnosis.js. */}
      {!allPass && <FailureRead question={question} report={report} />}

      {ordered.map(({ r, i }) => (
        <PyTestRow key={i} result={r} index={i} functionName={question.function_name} />
      ))}

      {stdout && (
        <div className="stdout-block">
          <h4>your print() output</h4>
          <pre>{stdout}</pre>
        </div>
      )}
      {question.track === 'pandas' && !results.length && (
        <p className="result-note">No tests ran.</p>
      )}
    </div>
  );
}
