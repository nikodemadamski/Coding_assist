import { Suspense, lazy, useMemo, useState } from 'react';
import { Lock, Check, Coins } from 'lucide-react';
import { BELTS, beltFor, isSolved } from '../state/progress.js';
import {
  ITEMS,
  SLOTS,
  coinBalance,
  earnBreakdown,
  equipItem,
  equipped,
  itemState,
  buyItem,
  outfitFor,
} from '../state/shop.js';
import { useReveal } from '../anim/useReveal.js';
import { prefersReducedMotion } from '../anim/useAnime.js';
import CountUp from './CountUp.jsx';

// The same canvas the header uses, at a size where you can see what you bought.
const DojoFace = lazy(() => import('./header/DojoFace.jsx'));

const SLOT_LABEL = { hat: 'Head', face: 'Face', neck: 'Neck', aura: 'Aura' };

export default function ShopView({ questions, progress, onChange, onExit }) {
  const revealRef = useReveal('shop');
  const [flat] = useState(() => prefersReducedMotion());

  const solvedCount = useMemo(
    () => questions.filter((q) => isSolved(progress.solved[q.id])).length,
    [questions, progress]
  );
  const belt = beltFor(solvedCount);
  const balance = coinBalance(progress, questions);
  const earned = useMemo(() => earnBreakdown(progress, questions), [progress, questions]);
  const worn = useMemo(() => outfitFor(progress, null), [progress]);
  const mine = equipped(progress);

  const bySlot = SLOTS.map((slot) => ({
    slot,
    items: ITEMS.filter((i) => i.slot === slot),
  }));

  const buy = (item) => onChange(buyItem(progress, item, questions));
  const toggle = (item) =>
    onChange(equipItem(progress, item.slot, mine[item.slot] === item.id ? null : item.id));

  return (
    <div className="stats shop" ref={revealRef}>
      <header className="page-head" data-reveal>
        <h1>The dojo shop</h1>
        <p className="page-lede">
          Everything here was paid for with training. Belts unlock, coins buy — you can&apos;t
          buy your way past a rank, and a rank you haven&apos;t paid for still costs coins.
        </p>
      </header>

      {/* Your mascot, at a size where the thing you just bought is visible. */}
      <section className="shop-top" data-reveal>
        <div className="shop-stage">
          {flat ? (
            <p className="shop-stage-flat">Preview is off while reduced motion is on.</p>
          ) : (
            <Suspense fallback={<div className="shop-stage-flat" />}>
              <DojoFace outfit={worn} beltColor={belt.color} fit={1.9} />
            </Suspense>
          )}
        </div>
        <div className="shop-wallet">
          <span className="shop-balance">
            <Coins size={22} strokeWidth={2} aria-hidden="true" />
            <CountUp value={balance} className="shop-balance-n" />
            <span className="shop-balance-l">coins</span>
          </span>
          <p className="shop-belt">
            <span className="shop-belt-dot" style={{ background: belt.color }} aria-hidden="true" />
            {belt.name} belt
            {belt.next && (
              <span className="shop-belt-next">
                — {belt.next.threshold - solvedCount} solves to {belt.next.name}
              </span>
            )}
          </p>
          {/* Show the working. A balance nobody can predict reads as arbitrary. */}
          <details className="shop-earn">
            <summary>Where your coins came from</summary>
            <ul className="shop-earn-rows">
              {earned.rows.map((r) => (
                <li key={r.key} className={r.n === 0 ? 'is-zero' : ''}>
                  <span className="shop-earn-label">{r.label}</span>
                  <span className="shop-earn-calc">
                    {r.n} × {r.each}
                  </span>
                  <span className="shop-earn-sum">{r.n * r.each}</span>
                </li>
              ))}
              <li className="shop-earn-total">
                <span className="shop-earn-label">Earned all-time</span>
                <span className="shop-earn-sum">{earned.total}</span>
              </li>
            </ul>
          </details>
        </div>
      </section>

      {bySlot.map(({ slot, items }) => (
        <section className="shop-rack" key={slot} data-reveal>
          <h2 className="shop-rack-head">{SLOT_LABEL[slot]}</h2>
          <div className="shop-grid">
            {items.map((item) => {
              const st = itemState(item, progress, questions);
              const isOn = mine[slot] === item.id;
              return (
                <div
                  key={item.id}
                  className={`shop-item ${st.owned ? 'is-owned' : ''} ${st.locked ? 'is-locked' : ''} ${isOn ? 'is-worn' : ''}`}
                >
                  <span className="shop-item-top">
                    <span className="shop-item-name">{item.name}</span>
                    {st.owned ? (
                      <span className="shop-item-tag owned">
                        <Check size={12} strokeWidth={3} aria-hidden="true" /> owned
                      </span>
                    ) : st.locked ? (
                      <span className="shop-item-tag locked">
                        <Lock size={11} strokeWidth={2.6} aria-hidden="true" /> {st.lockedBy}
                      </span>
                    ) : (
                      <span className={`shop-item-tag price ${st.affordable ? '' : 'short'}`}>
                        {item.price === 0 ? 'free' : `${item.price}`}
                      </span>
                    )}
                  </span>
                  <span className="shop-item-blurb">{item.blurb}</span>
                  {st.owned ? (
                    <button className={`btn shop-item-btn ${isOn ? 'btn-jade' : ''}`} onClick={() => toggle(item)}>
                      {isOn ? 'Worn — take off' : 'Wear it'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary shop-item-btn"
                      onClick={() => buy(item)}
                      disabled={!st.buyable}
                      title={
                        st.locked
                          ? `Reach ${st.lockedBy} belt to unlock this`
                          : st.affordable
                            ? undefined
                            : `${item.price - balance} more coins`
                      }
                    >
                      {st.locked
                        ? `${st.lockedBy} belt`
                        : st.affordable
                          ? 'Buy it'
                          : `${item.price - balance} short`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="shop-foot" data-reveal>
        Belts come from solving: {BELTS.map((b) => `${b.name} at ${b.threshold}`).join(' · ')}.
      </p>
      <button className="btn" onClick={onExit} data-reveal>
        ← Back to the dojo
      </button>
    </div>
  );
}
