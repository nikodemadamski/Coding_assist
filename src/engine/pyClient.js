// Stub — real Pyodide worker client lands in Phase 3.
export async function runPythonQuestion() {
  return {
    status: 'error',
    errorType: 'runtime',
    message: 'Python runner not built yet (Phase 3).',
    allPassed: false,
  };
}
