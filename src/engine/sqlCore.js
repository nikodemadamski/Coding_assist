// SQL execution + comparison core. Pure logic over an initialized sql.js
// module, so the browser client and the Node test gate share this exact code.

function normalizeCell(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return String(v);
    // 1 vs 1.0 are already identical in JS; just tame float noise.
    return Number.isInteger(v) ? v : Math.round(v * 1e9) / 1e9;
  }
  if (v instanceof Uint8Array) return `<blob ${v.length}b>`;
  return v;
}

export function normalizeRows(rows) {
  return rows.map((row) => row.map(normalizeCell));
}

export function rowsEqual(userRows, expectedRows, orderMatters) {
  const a = normalizeRows(userRows);
  const b = normalizeRows(expectedRows);
  if (a.length !== b.length) return false;
  const key = (row) => JSON.stringify(row);
  const aa = orderMatters ? a : [...a].sort((x, y) => key(x).localeCompare(key(y)));
  const bb = orderMatters ? b : [...b].sort((x, y) => key(x).localeCompare(key(y)));
  return aa.every((row, i) => key(row) === key(bb[i]));
}

// SQL is an initialized sql.js module (from initSqlJs). Returns a RunReport.
export function runSqlQuestion(SQL, question, query) {
  const db = new SQL.Database();
  try {
    try {
      db.run(question.sql_setup);
    } catch (err) {
      return {
        status: 'error',
        errorType: 'sql',
        message: `This question's setup SQL is broken (${err.message}). Sorry — bad question.`,
        allPassed: false,
      };
    }

    let resultSets;
    try {
      resultSets = db.exec(query);
    } catch (err) {
      // SQLite's own message, verbatim — it's instructive.
      return { status: 'error', errorType: 'sql', message: err.message, allPassed: false };
    }

    const last = resultSets[resultSets.length - 1];
    const userColumns = last ? last.columns : [];
    const userRows = last ? last.values : [];
    const orderMatters = !!question.order_matters;
    const pass = rowsEqual(userRows, question.expected_rows, orderMatters);

    return {
      status: 'ok',
      sql: {
        pass,
        userColumns,
        userRows: normalizeRows(userRows),
        expectedRows: normalizeRows(question.expected_rows),
        orderMatters,
      },
      allPassed: pass,
    };
  } finally {
    db.close();
  }
}
