import { useEffect } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Dialog behaviour every modal should have: focus moves into the dialog on
// open, Tab cycles inside it (never behind the backdrop), Esc closes it, and
// focus returns to the element that opened it.
//
// **Escape is bound to the document, not to the dialog node.** It used to be on
// the node, which meant the key only worked while focus happened to be inside —
// so the moment a control unmounted after being clicked (a Cancel button, a
// step that advances, anything conditional), focus fell to <body> and the
// dialog could no longer be dismissed with the keyboard at all. A dialog that
// stops answering Escape depending on what you last clicked is a trap in the
// bad sense.
//
// With several traps mounted at once, only the topmost may act, so each marks
// its node and the last one in document order wins.
export function useFocusTrap(ref, { onEscape = null, active = true } = {}) {
  useEffect(() => {
    if (!active) return undefined;
    const node = ref.current;
    if (!node) return undefined;
    const opener = document.activeElement;
    node.setAttribute('data-focus-trap', '');
    node.querySelector(FOCUSABLE)?.focus();

    const isTopmost = () => {
      const traps = document.querySelectorAll('[data-focus-trap]');
      return traps.length === 0 || traps[traps.length - 1] === node;
    };

    const onDocKey = (e) => {
      if (e.key !== 'Escape' || !onEscape || !isTopmost()) return;
      e.stopPropagation();
      onEscape();
    };

    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      // Focus may have fallen outside the dialog (the element holding it was
      // removed). Pull it back in rather than letting Tab walk the page behind.
      if (!node.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKey);
    document.addEventListener('keydown', onDocKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      document.removeEventListener('keydown', onDocKey);
      node.removeAttribute('data-focus-trap');
      opener?.focus?.();
    };
  }, [ref, onEscape, active]);
}
