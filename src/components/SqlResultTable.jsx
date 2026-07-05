export default function SqlResultTable({ columns, rows, caption }) {
  return (
    <div>
      {caption && <h4>{caption}</h4>}
      <table className="result-table">
        {columns && columns.length > 0 && (
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="null" colSpan={Math.max(1, columns?.length || 1)}>
                (no rows)
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={cell === null ? 'null' : ''}>
                  {cell === null ? 'NULL' : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
