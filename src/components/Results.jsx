import SqlResultTable from './SqlResultTable.jsx';

function PyTestRow({ result, index, functionName }) {
  const call = functionName ? `${functionName}(${result.argsRepr})` : result.argsRepr;
  return (
    <div className={`test-row ${result.pass ? 'pass' : 'fail'}`}>
      <div className="test-row-head">
        <span>{result.pass ? '✓' : '✗'}</span>
        <span>Test {index + 1}</span>
        <span style={{ color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {call}
        </span>
      </div>
      {!result.pass && (
        <div className="test-row-detail">
          <div className="io-line">
            <span className="lbl">Input </span>
            <code>{call}</code>
          </div>
          {result.error ? (
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
              <span className="lbl">Error </span>
              {result.error}
            </div>
          ) : (
            <>
              <div className="io-line">
                <span className="lbl">Expected </span>
                <code className="io-expected">{result.expectedRepr}</code>
              </div>
              <div className="io-line">
                <span className="lbl">Your output </span>
                <code className="io-got">{result.gotRepr}</code>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Results({ report, question }) {
  if (!report) {
    return (
      <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>
        Run your code to see test results here.
      </p>
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
        <div className="result-summary fail">{titles[report.errorType] || 'Error'}</div>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: 8 }}>
              (row order matters for this one)
            </span>
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
  const stdout = results
    .map((r, i) => (r.stdout ? `— test ${i + 1} —\n${r.stdout}` : ''))
    .filter(Boolean)
    .join('\n');

  return (
    <div>
      <div className={`result-summary ${passed === results.length ? 'pass' : 'fail'}`}>
        {passed === results.length ? '✓' : '✗'} {passed}/{results.length} tests passed
      </div>
      {results.map((r, i) => (
        <PyTestRow key={i} result={r} index={i} functionName={question.function_name} />
      ))}
      {stdout && (
        <div className="stdout-block">
          <h4>your print() output</h4>
          <pre>{stdout}</pre>
        </div>
      )}
      {question.track === 'pandas' && !results.length && (
        <p style={{ color: 'var(--text-dim)' }}>No tests ran.</p>
      )}
    </div>
  );
}
