import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Picker from './components/Picker.jsx';
import ProblemView from './components/ProblemView.jsx';
import PracticeView from './components/PracticeView.jsx';
import WarmupView from './components/WarmupView.jsx';
import MockInterview from './components/MockInterview.jsx';
import Stats from './components/Stats.jsx';
import Guide from './components/Guide.jsx';
import Patterns from './components/Patterns.jsx';
import PatternQuiz from './components/PatternQuiz.jsx';
import RoadmapGraph from './components/RoadmapGraph.jsx';
import TrackMap from './components/TrackMap.jsx';
import Settings from './components/Settings.jsx';
import ImportModal from './components/ImportModal.jsx';
import SearchPalette from './components/SearchPalette.jsx';
import Onboarding from './components/Onboarding.jsx';
import Celebration from './components/Celebration.jsx';
import { SEED_QUESTIONS } from './data/questions.js';
import {
  loadProgress,
  saveProgress,
  loadCustomQuestions,
  saveCustomQuestions,
} from './state/storage.js';
import { recordSolve, recordFail, isSolved, currentStreak } from './state/progress.js';
import { markVisit, recordDaySolve, recordDayFail } from './state/activity.js';
import { getInitialTheme, applyTheme } from './state/theme.js';
import { nextCelebration } from './state/celebrate.js';

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [customQuestions, setCustomQuestions] = useState(loadCustomQuestions);
  const [view, setView] = useState({ name: 'home' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setThemeState] = useState(() => {
    const t = getInitialTheme();
    document.documentElement.dataset.theme = t; // set before first paint (no flash)
    return t;
  });
  const toggleTheme = useCallback(() => {
    setThemeState((cur) => {
      const next = cur === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);
  // First-run orientation: show once, then remember we did.
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return !localStorage.getItem('zoro.onboarded.v1');
    } catch {
      return false;
    }
  });
  const dismissOnboarding = useCallback(() => {
    try {
      localStorage.setItem('zoro.onboarded.v1', '1');
    } catch {
      /* ignore */
    }
    setShowOnboarding(false);
  }, []);

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => saveCustomQuestions(customQuestions), [customQuestions]);
  // Stamp attendance once when the app opens today.
  useEffect(() => setProgress((p) => markVisit(p)), []);

  // Global quick-open: Ctrl/⌘+K anywhere, or "/" when not typing.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
        return;
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target;
        const typing =
          t?.tagName === 'INPUT' ||
          t?.tagName === 'TEXTAREA' ||
          t?.tagName === 'SELECT' ||
          t?.isContentEditable;
        if (!typing) {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const allQuestions = useMemo(
    () => [...SEED_QUESTIONS, ...customQuestions.map((q) => ({ ...q, imported: true }))],
    [customQuestions]
  );

  // Celebrate belt promotions and streak milestones the moment they happen.
  const [celebration, setCelebration] = useState(null);
  const milestoneRef = useRef(null);
  const solvedCount = useMemo(
    () => allQuestions.filter((q) => isSolved(progress.solved[q.id])).length,
    [allQuestions, progress]
  );
  const streakVal = currentStreak(progress.streak);
  useEffect(() => {
    const cur = { solvedCount, streak: streakVal };
    if (milestoneRef.current === null) {
      milestoneRef.current = cur; // first render — establish the baseline, no fanfare
      return;
    }
    const cel = nextCelebration(milestoneRef.current, cur);
    milestoneRef.current = cur;
    if (cel) setCelebration(cel);
  }, [solvedCount, streakVal]);

  const currentQuestion =
    view.name === 'problem' ? allQuestions.find((q) => q.id === view.id) : null;
  // Problems remember which list opened them, so Back returns there.
  const backTo =
    view.from === 'browse'
      ? { name: 'browse' }
      : view.from === 'patterns'
        ? { name: 'patterns' }
        : { name: 'home' };

  const handleSolve = useCallback(
    (questionId, opts) => {
      setProgress((p) => {
        const afterSolve = recordSolve(p, questionId, new Date(), opts);
        return recordDaySolve(afterSolve, questionId, allQuestions);
      });
    },
    [allQuestions]
  );

  const handleFail = useCallback((questionId) => {
    setProgress((p) => recordDayFail(recordFail(p, questionId), questionId));
  }, []);

  const handleDraft = useCallback((questionId, code) => {
    setProgress((p) => ({ ...p, drafts: { ...p.drafts, [questionId]: code } }));
  }, []);

  const handleWarmupResult = useCallback((level, correctCount) => {
    setProgress((p) => {
      const cur = p.warmup?.[level] ?? { best: 0, runs: 0 };
      return {
        ...p,
        warmup: {
          ...p.warmup,
          [level]: {
            best: Math.max(cur.best, correctCount),
            runs: cur.runs + 1,
            lastRunAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const handleMockRecord = useCallback((record) => {
    setProgress((p) => ({ ...p, mock: [...(p.mock || []), record] }));
  }, []);

  const handleImported = useCallback((questions) => {
    setCustomQuestions((qs) => [...qs, ...questions]);
  }, []);

  const handleRestore = useCallback(({ progress: p, customQuestions: qs }) => {
    setProgress(p);
    setCustomQuestions(qs);
  }, []);

  return (
    <div className="app">
      <Header
        progress={progress}
        onHome={() => setView({ name: 'home' })}
        onSearch={() => setSearchOpen(true)}
        onBrowse={() => setView({ name: 'browse' })}
        onPatterns={() => setView({ name: 'patterns' })}
        onStats={() => setView({ name: 'stats' })}
        onGuide={() => setView({ name: 'guide' })}
        onSettings={() => setSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="app-main">
        {view.name === 'home' && (
          <RoadmapGraph
            questions={allQuestions}
            progress={progress}
            onOpenQuestion={(id) => setView({ name: 'problem', id, from: 'home' })}
            onStartPractice={() => setView({ name: 'practice' })}
            onWarmup={() => setView({ name: 'warmup' })}
            onMock={() => setView({ name: 'mock' })}
            onDrill={() => setView({ name: 'drill' })}
            onOpenTrack={(key) => setView({ name: 'track', trackKey: key })}
            onBrowse={(key) => setView({ name: 'browse', focusCategory: key })}
          />
        )}
        {view.name === 'track' && (
          <TrackMap
            trackKey={view.trackKey}
            questions={allQuestions}
            progress={progress}
            onOpenQuestion={(id) => setView({ name: 'problem', id, from: 'home' })}
            onBrowse={(key) => setView({ name: 'browse', focusCategory: key })}
            onBack={() => setView({ name: 'home' })}
          />
        )}
        {view.name === 'browse' && (
          <Picker
            questions={allQuestions}
            progress={progress}
            focusCategory={view.focusCategory}
            onOpen={(id) => setView({ name: 'problem', id, from: 'browse' })}
            onPractice={() => setView({ name: 'practice' })}
            onDrill={() => setView({ name: 'drill' })}
            onWarmup={() => setView({ name: 'warmup' })}
            onImport={() => setImportOpen(true)}
          />
        )}
        {view.name === 'warmup' && (
          <WarmupView
            progress={progress}
            onResult={handleWarmupResult}
            onExit={() => setView({ name: 'home' })}
          />
        )}
        {view.name === 'mock' && (
          <MockInterview
            questions={allQuestions}
            progress={progress}
            onRecordMock={handleMockRecord}
            onSolve={handleSolve}
            onFail={handleFail}
            onExit={() => setView({ name: 'home' })}
          />
        )}
        {(view.name === 'practice' || view.name === 'drill') && (
          <PracticeView
            key={view.name}
            questions={allQuestions}
            progress={progress}
            mode={view.name === 'drill' ? 'drill' : 'practice'}
            onSolve={handleSolve}
            onFail={handleFail}
            onDraft={handleDraft}
            onExit={() => setView({ name: 'browse' })}
          />
        )}
        {view.name === 'problem' && currentQuestion && (
          <ProblemView
            key={currentQuestion.id}
            question={currentQuestion}
            progress={progress}
            onSolve={handleSolve}
            onFail={handleFail}
            onDraft={handleDraft}
            onBack={() => setView(backTo)}
            onSeePattern={(key) => setView({ name: 'patterns', focusKey: key })}
          />
        )}
        {view.name === 'problem' && !currentQuestion && (
          <div className="picker">
            <p>That question no longer exists.</p>
            <button className="btn" onClick={() => setView({ name: 'home' })}>
              Back to the dojo
            </button>
          </div>
        )}
        {view.name === 'patterns' && (
          <Patterns
            questions={allQuestions}
            progress={progress}
            focusKey={view.focusKey}
            onOpenQuestion={(id) => setView({ name: 'problem', id, from: 'patterns' })}
            onQuiz={() => setView({ name: 'quiz' })}
          />
        )}
        {view.name === 'quiz' && (
          <PatternQuiz questions={allQuestions} onExit={() => setView({ name: 'patterns' })} />
        )}
        {view.name === 'stats' && <Stats questions={allQuestions} progress={progress} />}
        {view.name === 'guide' && <Guide />}
      </main>
      {settingsOpen && (
        <Settings
          progress={progress}
          customQuestions={customQuestions}
          onImport={handleRestore}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {importOpen && (
        <ImportModal
          existingIds={allQuestions.map((q) => q.id)}
          onImported={handleImported}
          onClose={() => setImportOpen(false)}
        />
      )}
      {searchOpen && (
        <SearchPalette
          questions={allQuestions}
          progress={progress}
          onOpen={(id) => {
            setSearchOpen(false);
            setView({ name: 'problem', id, from: view.name === 'browse' ? 'browse' : 'home' });
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}
      {showOnboarding && <Onboarding onDone={dismissOnboarding} />}
      {celebration && <Celebration celebration={celebration} onClose={() => setCelebration(null)} />}
    </div>
  );
}
