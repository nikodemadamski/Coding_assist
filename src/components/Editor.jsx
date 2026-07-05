import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { sql, SQLite } from '@codemirror/lang-sql';
import { EditorView } from '@codemirror/view';
import { useMemo } from 'react';

const dojoTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#12141d',
      color: '#e9e7de',
      fontSize: '14px',
      height: '100%',
    },
    '.cm-content': { fontFamily: "'IBM Plex Mono', monospace", caretColor: '#e5484d' },
    '.cm-cursor': { borderLeftColor: '#e5484d' },
    '.cm-gutters': {
      backgroundColor: '#12141d',
      color: '#5c5f70',
      border: 'none',
      borderRight: '1px solid #2d3147',
    },
    '.cm-activeLine': { backgroundColor: '#1b1e2a66' },
    '.cm-activeLineGutter': { backgroundColor: '#1b1e2a' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#2d314788',
    },
  },
  { dark: true }
);

export default function Editor({ track, value, onChange }) {
  const extensions = useMemo(
    () => [track === 'sql' ? sql({ dialect: SQLite }) : python(), dojoTheme],
    [track]
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme="dark"
      height="100%"
      style={{ height: '100%' }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
        tabSize: 4,
      }}
      aria-label="Code editor"
    />
  );
}
