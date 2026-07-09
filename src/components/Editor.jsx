import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { sql, SQLite } from '@codemirror/lang-sql';
import { EditorView } from '@codemirror/view';
import { useMemo } from 'react';
import { useTheme } from '../state/theme.js';

const darkTheme = EditorView.theme(
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

const lightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#ffffff',
      color: '#262330',
      fontSize: '14px',
      height: '100%',
    },
    '.cm-content': { fontFamily: "'IBM Plex Mono', monospace", caretColor: '#cf3a40' },
    '.cm-cursor': { borderLeftColor: '#cf3a40' },
    '.cm-gutters': {
      backgroundColor: '#f5f3ee',
      color: '#9a978f',
      border: 'none',
      borderRight: '1px solid #dcd9d0',
    },
    '.cm-activeLine': { backgroundColor: '#0000000a' },
    '.cm-activeLineGutter': { backgroundColor: '#eceae2' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#c9d4ff88',
    },
  },
  { dark: false }
);

export default function Editor({ track, value, onChange }) {
  const theme = useTheme();
  const isLight = theme === 'light';
  const extensions = useMemo(
    () => [track === 'sql' ? sql({ dialect: SQLite }) : python(), isLight ? lightTheme : darkTheme],
    [track, isLight]
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={isLight ? 'light' : 'dark'}
      height="100%"
      style={{ height: '100%' }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        // CM6's built-in python "completions" are keyword noise (AttributeError,
        // ConnectionRefusedError, ...) and the popup hangs over the result pane.
        autocompletion: false,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
        tabSize: 4,
      }}
      aria-label="Code editor"
    />
  );
}
