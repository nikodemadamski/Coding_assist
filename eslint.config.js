import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist', 'node_modules', 'public/pyodide'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node, ...globals.worker },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: '18.3' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // react-three-fiber renders three.js objects through JSX intrinsics
    // (<mesh>, <torusGeometry>, <pointLight>…). eslint-plugin-react only knows
    // the DOM, so every one of their props reads as an unknown attribute. The
    // rule is switched off for the 3D scene only — everywhere else it still
    // catches real typos.
    files: ['src/components/header/DojoFace.jsx'],
    rules: { 'react/no-unknown-property': 'off' },
  },
];
