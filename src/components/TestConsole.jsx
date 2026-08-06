import { useEffect, useMemo, useState } from 'react';
import Results from './Results.jsx';
import { paramNames, argLabel, argToText, parseArgs } from '../data/signature.js';

// The console under the editor — the half of the screen you actually live in
// while solving.
//
// Before this, the bottom pane was blank until you ran, and the test cases
// existed only as prose in the problem column. You could not see what the
// grader would call your function with, could not focus one case, and had no
// way to poke at a hunch ("what does it do on an empty list?") without editing
// the real code. So the console has two tabs:
//
//   Testcase — every case as *named* arguments (read out of the starter
//              signature), one chip per case, plus a Custom case whose boxes
//              you can edit and run on its own.
//   Result   — the graded outcome, unchanged (<Results/>), because the
//              expected-vs-got diff was already the right thing.
//
// A custom run is deliberately NOT graded: there is no expected value for an
// input you invented, so it reports the return value and stdout and says so.
// Nothing here can record a solve — only Submit does that.

const CUSTOM = 'custom';

export default function TestConsole({
  question,
  report,
  running,
  tab,
  onTabChange,
  onRunCase, // (tests) => void — runs an ad-hoc case through the real engine
  customReport,
  customRunning,
  children, // banners that belong above the console (solved, practice reflect)
}) {
  const tests = useMemo(() => question.tests ?? [], [question.tests]);
  // SQL grades a whole result set, not a series of calls — there is nothing to
  // put in a Testcase tab, so it doesn't get one.
  const hasCases = tests.length > 0;
  const names = useMemo(() => paramNames(question), [question]);
  const [selected, setSelected] = useState(0);
  // Editable boxes for the custom case, seeded from the first real case so
  // there's always something valid to mutate rather than an empty form.
  const [customArgs, setCustomArgs] = useState(() =>
    (tests[0]?.args ?? []).map((a) => argToText(a))
  );
  const [customError, setCustomError] = useState('');

  // A different question means different cases: reset rather than carry a
  // stale selection or another problem's arguments into this one.
  useEffect(() => {
    setSelected(0);
    setCustomArgs((tests[0]?.args ?? []).map((a) => argToText(a)));
    setCustomError('');
  }, [question.id, tests]);

  const results = report?.results ?? [];
  const isCustom = selected === CUSTOM;
  const activeTest = isCustom ? null : tests[selected];
  const activeResult = isCustom ? null : results[selected];

  const runCustom = () => {
    const parsed = parseArgs(customArgs, names);
    if (parsed.error) {
      setCustomError(parsed.error);
      return;
    }
    setCustomError('');
    // expected:null — the harness still runs the call and reports what came
    // back; we present it as output, never as a verdict.
    onRunCase([{ args: parsed.args, expected: null }]);
  };

  const caseState = (i) => {
    if (!results.length) return '';
    const r = results[i];
    if (!r) return '';
    return r.pass ? 'pass' : 'fail';
  };

  const summary = report?.results?.length
    ? `${results.filter((r) => r.pass).length}/${results.length} passed`
    : report?.status === 'error'
      ? 'error'
      : '';

  return (
    <div className="console">
      <div className="console-bar" role="tablist" aria-label="Test console">
        {hasCases && (
          <button
            role="tab"
            aria-selected={tab === 'testcase'}
            className={`console-tab ${tab === 'testcase' ? 'active' : ''}`}
            onClick={() => onTabChange('testcase')}
          >
            Testcase
          </button>
        )}
        <button
          role="tab"
          aria-selected={tab === 'result'}
          className={`console-tab ${tab === 'result' ? 'active' : ''}`}
          onClick={() => onTabChange('result')}
        >
          Result
          {summary && <span className={`console-tab-badge ${report?.allPassed ? 'pass' : 'fail'}`}>{summary}</span>}
        </button>
      </div>

      {children}

      {hasCases && tab === 'testcase' ? (
        <div className="console-body">
          <div className="case-chips" role="tablist" aria-label="Test cases">
            {tests.map((t, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={selected === i}
                className={`case-chip ${selected === i ? 'active' : ''} ${caseState(i)}`}
                onClick={() => setSelected(i)}
              >
                Case {i + 1}
              </button>
            ))}
            <button
              role="tab"
              aria-selected={isCustom}
              className={`case-chip case-chip-custom ${isCustom ? 'active' : ''}`}
              onClick={() => setSelected(CUSTOM)}
              title="Run your own input without touching the graded cases"
            >
              Custom
            </button>
          </div>

          {isCustom ? (
            <div className="case-detail">
              <div className="case-args">
                {customArgs.map((text, i) => (
                  <label className="case-arg case-arg-edit" key={i}>
                    <span className="case-arg-name">{argLabel(names, i)}</span>
                    <input
                      className="case-arg-input"
                      value={text}
                      spellCheck="false"
                      onChange={(e) =>
                        setCustomArgs((a) => a.map((v, j) => (j === i ? e.target.value : v)))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          runCustom();
                        }
                      }}
                      aria-label={`${argLabel(names, i)} value`}
                    />
                  </label>
                ))}
                {customArgs.length === 0 && (
                  <p className="case-note">This one takes no arguments — just run it.</p>
                )}
              </div>
              <div className="case-actions">
                <button className="btn btn-primary" onClick={runCustom} disabled={customRunning || running}>
                  {customRunning ? 'Running…' : 'Run this case'}
                </button>
                <span className="case-hint">
                  Values are JSON: <code>[1, 2]</code>, <code>&quot;text&quot;</code>, <code>5</code>,{' '}
                  <code>null</code>. Not graded — it just shows what your function returns.
                </span>
              </div>
              {customError && <p className="case-error">{customError}</p>}
              {customReport && <CustomOutcome report={customReport} />}
            </div>
          ) : activeTest ? (
            <div className="case-detail">
              <div className="case-args">
                {activeTest.args.map((a, i) => (
                  <div className="case-arg" key={i}>
                    <span className="case-arg-name">{argLabel(names, i)}</span>
                    <code className="case-arg-val">{argToText(a)}</code>
                  </div>
                ))}
              </div>
              <div className="case-expect">
                <span className="case-arg-name">expected</span>
                <code className="case-arg-val">{argToText(activeTest.expected)}</code>
              </div>
              {activeResult && (
                <div className={`case-got ${activeResult.pass ? 'pass' : 'fail'}`}>
                  <span className="case-arg-name">your output</span>
                  <code className="case-arg-val">
                    {activeResult.error ? activeResult.error : activeResult.gotRepr}
                  </code>
                  <span className="case-verdict">{activeResult.pass ? '✓' : '✗'}</span>
                </div>
              )}
              {activeResult?.stdout && (
                <div className="case-stdout">
                  <span className="case-arg-name">print()</span>
                  <pre>{activeResult.stdout}</pre>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="console-body">
          <Results report={report} question={question} />
        </div>
      )}
    </div>
  );
}

// The result of an ungraded scratch run: what came back, and anything printed.
function CustomOutcome({ report }) {
  if (report.status === 'error') {
    return (
      <div className="case-custom-out">
        <span className="case-arg-name">error</span>
        <code className="case-arg-val io-error-text">{report.message}</code>
      </div>
    );
  }
  const r = report.results?.[0];
  if (!r) return null;
  return (
    <>
      <div className="case-custom-out">
        <span className="case-arg-name">returned</span>
        <code className="case-arg-val">{r.error ? r.error : r.gotRepr}</code>
      </div>
      {r.stdout && (
        <div className="case-stdout">
          <span className="case-arg-name">print()</span>
          <pre>{r.stdout}</pre>
        </div>
      )}
    </>
  );
}
