// Browser-side sql.js loader. The wasm binary ships with the app bundle
// (no CDN dependency for SQL).
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { runSqlQuestion } from './sqlCore.js';

let sqlPromise = null;

function getSQL() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({ locateFile: () => wasmUrl });
  }
  return sqlPromise;
}

export async function runSqlQuestionInBrowser(question, code, onStatus = () => {}) {
  onStatus({ phase: 'running' });
  const SQL = await getSQL();
  return runSqlQuestion(SQL, question, code);
}
