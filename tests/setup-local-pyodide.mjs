// Copies the Pyodide core runtime from node_modules into public/pyodide so the
// smoke test (and anyone who wants to self-host) can run the app without the
// jsDelivr CDN: build with VITE_PYODIDE_BASE=/pyodide/.
// Note: only the core runtime is copied — pandas wheels still come from the
// CDN unless you add them here.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pyodide');
const dest = join(root, 'public', 'pyodide');

mkdirSync(dest, { recursive: true });
let copied = 0;
for (const name of readdirSync(src)) {
  if (/\.(mjs|js|wasm|zip|json|ts)$/.test(name) && name !== 'package.json') {
    cpSync(join(src, name), join(dest, name));
    copied++;
  }
}
console.log(`Copied ${copied} pyodide runtime files to public/pyodide/`);
