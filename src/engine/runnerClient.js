// Unified interface the UI talks to. Real implementations arrive with the
// execution engine phases; every runner resolves to a RunReport:
//
// {
//   status: 'ok' | 'error',
//   errorType?: 'syntax' | 'missing_function' | 'timeout' | 'runtime' | 'sql',
//   message?: string,                 // top-level error text
//   results?: TestResult[],           // python / pandas tracks
//   sql?: SqlOutcome,                 // sql track
//   allPassed: boolean,
// }

export async function runQuestion(question, code, onStatus = () => {}) {
  if (question.track === 'sql') {
    const { runSqlQuestionInBrowser } = await import('./sqlClient.js');
    return runSqlQuestionInBrowser(question, code, onStatus);
  }
  const { runPythonQuestion } = await import('./pyClient.js');
  return runPythonQuestion(question, code, onStatus);
}
