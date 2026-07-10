// Pointer detection for the visualizer: figures out which integer variables
// act as indices into which list variables, so the UI can draw labeled ▲
// markers under the exact cells (and shade the window between two pointers).
//
// Two signals, in priority order:
//   1. Subscript evidence from the source code — `nums[i]`, `height[l + 1]`
//      binds `i`/`l` to that specific list name.
//   2. Name heuristics — `mid`, `left`, `slow`… look like indices; used only
//      when the code gave us no subscript evidence for that name AND there is
//      exactly one list in scope (so the binding is unambiguous).

const INDEXY = new Set([
  'i', 'j', 'k', 'l', 'r', 'lo', 'hi', 'left', 'right', 'start', 'end',
  'mid', 'low', 'high', 'slow', 'fast', 'p', 'q', 'p1', 'p2', 'idx', 'pos',
]);
const INDEXY_RE = /idx|index|ptr|pointer/i;

// Map of indexVarName -> Set of container names it subscripts in `code`.
// Handles `nums[i]`, `nums[i + 1]`, `nums[i-1]`; computed keys like
// `seen[target - n]` start with a non-name token or bind to a dict name,
// which simply never matches a list variable, so they are inert.
export function scanSubscripts(code) {
  const map = new Map();
  const re = /([A-Za-z_]\w*)\s*\[\s*([A-Za-z_]\w*)(?:\s*[+-]\s*\w+)?\s*\]/g;
  let m;
  while ((m = re.exec(code))) {
    const [, container, index] = m;
    if (!map.has(index)) map.set(index, new Set());
    map.get(index).add(container);
  }
  return map;
}

const isIndexy = (name) => INDEXY.has(name) || INDEXY_RE.test(name);

// Markers for one list variable at one trace step.
// locals: current step's locals (values as the trace encodes them)
// listName/listLength: the list being rendered
// subscripts: result of scanSubscripts(code)
// listCount: how many list-valued locals are in scope this step
export function computeMarkers({ locals, listName, listLength, subscripts, listCount }) {
  const markers = [];
  for (const [name, value] of Object.entries(locals)) {
    if (typeof value !== 'number' || !Number.isInteger(value)) continue;
    if (value < 0 || value >= listLength) continue;
    const evidence = subscripts.get(name);
    if (evidence) {
      if (!evidence.has(listName)) continue;
    } else {
      if (!isIndexy(name) || listCount !== 1) continue;
    }
    markers.push({ name, index: value });
  }
  markers.sort((a, b) => a.index - b.index || (a.name < b.name ? -1 : 1));
  return markers;
}

// The window between the outermost pointers: [min, max] or null if <2 markers.
export function spanOf(markers) {
  if (!markers || markers.length < 2) return null;
  let min = markers[0].index;
  let max = markers[0].index;
  for (const m of markers) {
    if (m.index < min) min = m.index;
    if (m.index > max) max = m.index;
  }
  return min === max ? null : [min, max];
}
