import { useMemo } from 'react';
import { calendarDays, activitySummary, countRestDays } from '../state/activity.js';

// GitHub-style attendance grid: 12 weeks of days, colored by whether you showed
// up and whether you met the daily goal. Columns are weeks, rows are weekdays.
export default function Calendar({ progress }) {
  const days = useMemo(() => calendarDays(progress, 84), [progress]);
  const summary = useMemo(() => activitySummary(progress), [progress]);
  const rested = useMemo(() => countRestDays(days), [days]);

  // Pad the front so the first column starts on Sunday, then chunk into weeks.
  const [fy, fm, fd] = days[0].date.split('-').map(Number);
  const leadPad = new Date(fy, fm - 1, fd).getDay(); // 0=Sun
  const cells = [...Array(leadPad).fill(null), ...days];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="calendar-block">
      <div className="cal-summary">
        <span>
          <strong>{summary.daysVisited}</strong> days shown up
        </span>
        <span>
          <strong>{summary.daysGoalMet}</strong> daily goals met
        </span>
        <span>
          <strong>{summary.longestGoalStreak}</strong> best goal streak
        </span>
        {/* Rest is training data too: seeing that you took 6 days off across 12
            weeks is the difference between "I keep failing" and "I paced it". */}
        <span>
          <strong>{rested}</strong> rest days
        </span>
      </div>
      <div className="cal-grid" role="img" aria-label="Attendance over the last 12 weeks">
        {weeks.map((week, wi) => (
          <div className="cal-week" key={wi}>
            {Array.from({ length: 7 }).map((_, di) => {
              const cell = week[di];
              if (!cell) return <span className="cal-cell cal-empty" key={di} />;
              return (
                <span
                  className={`cal-cell cal-${cell.status}`}
                  key={di}
                  title={`${cell.date}: ${
                    cell.status === 'goal'
                      ? 'daily goal met'
                      : cell.status === 'visited'
                        ? `visited, ${cell.solves} solve(s)`
                        : cell.status === 'rest'
                          ? 'rest day — the streak held'
                          : 'missed'
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="cal-legend">
        <span className="cal-cell cal-none" /> missed
        <span className="cal-cell cal-rest" /> rest day
        <span className="cal-cell cal-visited" /> showed up
        <span className="cal-cell cal-goal" /> goal met
      </div>
    </div>
  );
}
