import { useState } from 'react';
import { getAllPlans, deletePlan } from '../utils/storage';
import './HistoryPage.css';

const COMPLEXITY_COLOR = { Low: '#86BC24', Medium: '#f5a623', High: '#cc3333' };

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage({ onLoad }) {
  const [plans, setPlans] = useState(getAllPlans);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (id) => {
    deletePlan(id);
    setPlans(getAllPlans());
    setConfirmDelete(null);
  };

  if (plans.length === 0) {
    return (
      <div className="history-page">
        <div className="history-hero">
          <h1>Saved Analyses</h1>
          <p>Previously generated migration plans will appear here.</p>
        </div>
        <div className="history-empty">
          <span className="empty-icon">📂</span>
          <p>No saved analyses yet.</p>
          <p className="empty-hint">Generate a migration plan and it will be saved automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-hero">
        <h1>Saved Analyses</h1>
        <p>{plans.length} migration plan{plans.length !== 1 ? 's' : ''} saved — click any card to load it.</p>
      </div>

      <div className="history-grid">
        {plans.map(entry => (
          <div key={entry.id} className="history-card">
            <div className="hcard-top">
              <div className="hcard-name">{entry.projectName}</div>
              <div
                className="hcard-complexity"
                style={{ background: COMPLEXITY_COLOR[entry.complexity] || '#999' }}
              >
                {entry.complexity || '—'}
              </div>
            </div>

            <div className="hcard-meta">
              <span className="hcard-tech">{entry.originalTechnology || 'Unknown tech'}</span>
              <span className="hcard-dot">·</span>
              <span>{entry.estimatedModules} module{entry.estimatedModules !== 1 ? 's' : ''}</span>
            </div>

            <div className="hcard-date">{formatDate(entry.savedAt)}</div>

            <div className="hcard-actions">
              <button
                className="hcard-load-btn"
                onClick={() => onLoad(entry.plan, entry.originalContent, entry.projectName)}
              >
                Load Plan
              </button>

              {confirmDelete === entry.id ? (
                <div className="hcard-confirm">
                  <span>Delete?</span>
                  <button className="hcard-confirm-yes" onClick={() => handleDelete(entry.id)}>Yes</button>
                  <button className="hcard-confirm-no" onClick={() => setConfirmDelete(null)}>No</button>
                </div>
              ) : (
                <button className="hcard-delete-btn" onClick={() => setConfirmDelete(entry.id)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
