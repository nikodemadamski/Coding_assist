import { useEffect, useState } from 'react';

// True when the viewport is narrower than `px`. Used where a phone needs a
// genuinely DIFFERENT component rather than the same one restyled — the
// algorithm map is the case in point: scaled to fit a 390px screen its labels
// land around 4px, so "responsive" there meant legible on desktop and useless
// on a phone.
//
// matchMedia rather than a resize listener: the browser evaluates the query
// itself and only calls back when the answer actually changes, so this costs
// nothing while the user is just resizing within a breakpoint.
export function useIsNarrow(px = 700) {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${px}px)`).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px}px)`);
    const onChange = (e) => setNarrow(e.matches);
    setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [px]);
  return narrow;
}
