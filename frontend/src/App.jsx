import { useState } from 'react';
import InputPage from './pages/InputPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import { savePlan } from './utils/storage';
import './App.css';

export default function App() {
  const [plan, setPlan] = useState(null);
  const [originalContent, setOriginalContent] = useState('');
  const [projectName, setProjectName] = useState('');
  const [view, setView] = useState('input'); // 'input' | 'results' | 'history'

  const handlePlanGenerated = (generatedPlan, content, name) => {
    const resolvedContent = content !== undefined ? content : originalContent;
    const resolvedName = name !== undefined ? name : projectName;

    setPlan(generatedPlan);
    if (content !== undefined) setOriginalContent(content);
    if (name !== undefined) setProjectName(name);

    savePlan(generatedPlan, resolvedContent, resolvedName);
    setView('results');
  };

  const handleLoadFromHistory = (loadedPlan, loadedContent, loadedName) => {
    setPlan(loadedPlan);
    setOriginalContent(loadedContent || '');
    setProjectName(loadedName || '');
    setView('results');
  };

  const handleReset = () => {
    setPlan(null);
    setOriginalContent('');
    setProjectName('');
    setView('input');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">OutSystems <strong>Migration Tool</strong></span>
          </div>
          <nav className="header-nav">
            <button
              className={`nav-btn ${view === 'input' ? 'active' : ''}`}
              onClick={handleReset}
            >
              Input
            </button>
            {plan && (
              <button
                className={`nav-btn ${view === 'results' ? 'active' : ''}`}
                onClick={() => setView('results')}
              >
                Results
              </button>
            )}
            <button
              className={`nav-btn ${view === 'history' ? 'active' : ''}`}
              onClick={() => setView('history')}
            >
              History
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {view === 'input' && (
          <InputPage onPlanGenerated={handlePlanGenerated} />
        )}
        {view === 'results' && (
          <ResultsPage
            plan={plan}
            originalContent={originalContent}
            projectName={projectName}
            onPlanGenerated={handlePlanGenerated}
            onReset={handleReset}
          />
        )}
        {view === 'history' && (
          <HistoryPage onLoad={handleLoadFromHistory} />
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Claude AI &amp; OutSystems Architecture Best Practices</p>
      </footer>
    </div>
  );
}
