// Unit tests for the visualizer pointer overlay logic (src/state/vizPointers.js)
import { scanSubscripts, computeMarkers, spanOf } from '../src/state/vizPointers.js';

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok - ${name}`);
  } else {
    failures++;
    console.error(`  FAIL - ${name}`);
  }
}

console.log('pointer-tests: scanSubscripts');
{
  const m = scanSubscripts(`
def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
`);
  check('i binds to nums', m.get('i')?.has('nums'));
  check('j binds to nums', m.get('j')?.has('nums'));
  check('target has no binding', !m.has('target'));
}
{
  const m = scanSubscripts('x = height[l + 1] - height[r-1]');
  check('offset subscript l+1 still binds l', m.get('l')?.has('height'));
  check('offset subscript r-1 still binds r', m.get('r')?.has('height'));
}
{
  const m = scanSubscripts('seen[target - n] = i\ngrid[r][c] = 1');
  check('computed key target-n binds target to seen (dict, inert later)', m.get('target')?.has('seen'));
  check('grid[r] binds r to grid', m.get('r')?.has('grid'));
  check('numeric literal not captured', !m.has('1'));
}
{
  const m = scanSubscripts('a[i] = 0\nb[i] = 0');
  check('one index can bind to two containers', m.get('i')?.has('a') && m.get('i')?.has('b'));
}

console.log('pointer-tests: computeMarkers');
const subs = scanSubscripts('if nums[i] + nums[j] == target: pass');
{
  const markers = computeMarkers({
    locals: { nums: [2, 7, 11, 15], target: 9, i: 0, j: 2 },
    listName: 'nums',
    listLength: 4,
    subscripts: subs,
    listCount: 1,
  });
  check('two markers found', markers.length === 2);
  check('sorted by index', markers[0].name === 'i' && markers[0].index === 0);
  check('j at 2', markers[1].name === 'j' && markers[1].index === 2);
}
{
  // target=9 is out of range [0,4) and has no subscript binding to nums
  const markers = computeMarkers({
    locals: { nums: [1, 2], target: 9, i: 5 },
    listName: 'nums',
    listLength: 2,
    subscripts: subs,
    listCount: 1,
  });
  check('out-of-range ints excluded', markers.length === 0);
}
{
  // no subscript evidence at all: name heuristic works only with one list in scope
  const noSubs = scanSubscripts('return mid');
  const one = computeMarkers({
    locals: { arr: [3, 1, 4], mid: 1, total: 2 },
    listName: 'arr',
    listLength: 3,
    subscripts: noSubs,
    listCount: 1,
  });
  check('index-like name (mid) marks with 1 list, no evidence', one.length === 1 && one[0].name === 'mid');
  check('non-index-like name (total) excluded', !one.some((m) => m.name === 'total'));
  const two = computeMarkers({
    locals: { arr: [3, 1, 4], other: [9], mid: 1 },
    listName: 'arr',
    listLength: 3,
    subscripts: noSubs,
    listCount: 2,
  });
  check('heuristic disabled when 2 lists in scope', two.length === 0);
}
{
  // subscript evidence binds a name to ITS list only
  const s = scanSubscripts('res[k] = nums[i]');
  const onRes = computeMarkers({
    locals: { res: [0, 0], nums: [5, 6], k: 1, i: 0 },
    listName: 'res',
    listLength: 2,
    subscripts: s,
    listCount: 2,
  });
  check('k marks res, i does not', onRes.length === 1 && onRes[0].name === 'k');
  const onNums = computeMarkers({
    locals: { res: [0, 0], nums: [5, 6], k: 1, i: 0 },
    listName: 'nums',
    listLength: 2,
    subscripts: s,
    listCount: 2,
  });
  check('i marks nums, k does not', onNums.length === 1 && onNums[0].name === 'i');
}
{
  // booleans and floats never mark
  const markers = computeMarkers({
    locals: { nums: [1, 2, 3], i: true, j: 1.5 },
    listName: 'nums',
    listLength: 3,
    subscripts: subs,
    listCount: 1,
  });
  check('bools/floats excluded', markers.length === 0);
}
{
  // ptr/index-suffixed custom names hit the regex heuristic
  const noSubs = new Map();
  const markers = computeMarkers({
    locals: { arr: [1, 2, 3], write_ptr: 2, curIndex: 0 },
    listName: 'arr',
    listLength: 3,
    subscripts: noSubs,
    listCount: 1,
  });
  check('ptr/index-named vars mark heuristically', markers.length === 2);
}

console.log('pointer-tests: spanOf');
check('null for no markers', spanOf([]) === null);
check('null for one marker', spanOf([{ name: 'i', index: 2 }]) === null);
check('null when both on same cell', spanOf([{ name: 'l', index: 2 }, { name: 'r', index: 2 }]) === null);
{
  const s = spanOf([
    { name: 'l', index: 1 },
    { name: 'm', index: 3 },
    { name: 'r', index: 5 },
  ]);
  check('span is outermost pair', s[0] === 1 && s[1] === 5);
}

if (failures) {
  console.error(`pointer-tests: ${failures} failure(s)`);
  process.exit(1);
}
console.log('pointer-tests: all passed');
