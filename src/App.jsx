import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Picker from './components/Picker.jsx';
import ProblemView from './components/ProblemView.jsx';
import PracticeView from './components/PracticeView.jsx';
import Stats from './components/Stats.jsx';
import Guide from './components/Guide.jsx';
import RoadmapGraph from './components/RoadmapGraph.jsx';
import Settings from './components/Settings.jsx';
import ImportModal from './components/ImportModal.jsx';
import { SEED_QUESTIONS } from './data/questions.js';
import {
  loadProgress,
  saveProgress,
  loadCustomQuestions,
  saveCustomQuestions,
} from './state/storage.js';
import { recordSolve, recordFail } from './state/progress.js';
import { markVisit, recordDaySolve, recordDayFail } from './state/activity.js';

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [customQuestions, setCustomQuestions] = useState(loadCustomQuestions);
  const [view, setView] = useState({ name: 'home' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => saveCustomQuestions(customQuestions), [customQuestions]);
  // Stamp attendance once when the app opens today.
  useEffect(() => setProgress((p) => markVisit(p)), []);

  const allQuestions = useMemo(
    () => [...SEED_QUESTIONS, ...customQuestions.map((q) => ({ ...q, imported: true }))],
    [customQuestions]
  );

  const currentQuestion =
    view.name === 'problem' ? allQuestions.find((q) => q.id === view.id) : null;

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
        onRoadmap={() => setView({ name: 'roadmap' })}
        onStats={() => setView({ name: 'stats' })}
        onGuide={() => setView({ name: 'guide' })}
        onSettings={() => setSettingsOpen(true)}
      />
      <main className="app-main">
        {view.name === 'home' && (
          <Picker
            questions={allQuestions}
            progress={progress}
            focusCategory={view.focusCategory}
            onOpen={(id) => setView({ name: 'problem', id })}
            onPractice={() => setView({ name: 'practice' })}
            onDrill={() => setView({ name: 'drill' })}
            onImport={() => setImportOpen(true)}
          />
        )}
        {view.name === 'roadmap' && (
          <RoadmapGraph
            questions={allQuestions}
            progress={progress}
            onSelect={(key) => setView({ name: 'home', focusCategory: key })}
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
            onExit={() => setView({ name: 'home' })}
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
            onBack={() => setView({ name: 'home' })}
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
    </div>
  );
}
