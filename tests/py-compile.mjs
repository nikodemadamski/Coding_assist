// Shared "does this one-liner compile as Python?" wrapping, used by the
// warm-up and lesson gates. Snippets are single lines out of context, so wrap
// just enough: block headers get a body, `except` gets a `try`, decorators get
// a function, return/yield/global go inside a def.
export function wrapForCompile(code) {
  if (code.startsWith('except')) {
    return `try:\n    pass\n${code}\n    pass`;
  }
  if (code.startsWith('@')) {
    return `${code}\ndef _f():\n    pass`;
  }
  if (/^(return|yield|global)\b/.test(code)) {
    return `def _f():\n    ${code}`;
  }
  if (code.endsWith(':')) {
    const body = `${code}\n    pass`;
    return code.startsWith('try') ? `${body}\nexcept Exception:\n    pass` : body;
  }
  return code;
}
