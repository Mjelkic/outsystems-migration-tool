import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { exportPptx } from '../utils/exportPptx';
import './ResultsPage.css';

const SECTIONS = [
  { id: 'summary', label: 'Summary', icon: '📋' },
  { id: 'dataModel', label: 'Data Model', icon: '🗄️' },
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
  { id: 'screens', label: 'Screens', icon: '🖥️' },
  { id: 'logic', label: 'Business Logic', icon: '⚙️' },
  { id: 'integrations', label: 'Integrations', icon: '🔌' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
  { id: 'json', label: 'Raw JSON', icon: '{ }' },
];

const COMPLEXITY_COLOR = { Low: '#86BC24', Medium: '#f5a623', High: '#cc3333' };
const LAYER_COLOR = {
  'End-User':    '#000000',
  'Core':        '#86BC24',
  'Foundation':  '#555555',
  'Integration': '#333333'
};
const LAYER_TEXT_COLOR = {
  'End-User':    '#ffffff',
  'Core':        '#000000',
  'Foundation':  '#ffffff',
  'Integration': '#ffffff'
};
const IMPACT_COLOR = { High: '#cc3333', Medium: '#f5a623', Low: '#86BC24' };

function Badge({ text, color, textColor }) {
  return (
    <span className="badge" style={{
      background: color || 'var(--surface2)',
      borderColor: color || 'var(--border)',
      color: textColor || (color ? 'var(--d-white)' : 'var(--d-black)')
    }}>
      {text}
    </span>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`result-card ${className}`}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );
}

function SummarySection({ data }) {
  const s = data.projectSummary;
  return (
    <div className="section-content">
      <div className="summary-grid">
        <div className="summary-stat">
          <span className="stat-label">Project</span>
          <span className="stat-value">{s.name}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Complexity</span>
          <span className="stat-value" style={{ color: COMPLEXITY_COLOR[s.complexity] }}>{s.complexity}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Modules</span>
          <span className="stat-value">{s.estimatedModules}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Source Tech</span>
          <span className="stat-value">{s.originalTechnology}</span>
        </div>
      </div>
      <Card title="Description">
        <p className="desc-text">{s.description}</p>
      </Card>
      {data.recommendations?.length > 0 && (
        <Card title="Key Recommendations">
          <ul className="rec-list">
            {data.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function DataModelSection({ data }) {
  const [expanded, setExpanded] = useState(null);
  const entities = data.dataModel?.entities || [];
  return (
    <div className="section-content">
      <p className="section-desc">{entities.length} entities identified</p>
      {entities.map((entity, i) => (
        <Card key={i} className="entity-card">
          <div className="entity-header" onClick={() => setExpanded(expanded === i ? null : i)}>
            <div>
              <h4 className="entity-name">{entity.name}</h4>
              <p className="entity-desc">{entity.description}</p>
            </div>
            <div className="entity-meta">
              <span className="attr-count">{entity.attributes?.length || 0} attrs</span>
              <span className="expand-btn">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </div>
          {expanded === i && (
            <div className="entity-details">
              {entity.attributes?.length > 0 && (
                <div className="attr-table-wrap">
                  <table className="attr-table">
                    <thead>
                      <tr>
                        <th>Attribute</th>
                        <th>Data Type</th>
                        <th>PK</th>
                        <th>Mandatory</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entity.attributes.map((attr, j) => (
                        <tr key={j} className={attr.isPrimaryKey ? 'pk-row' : ''}>
                          <td><code>{attr.name}</code></td>
                          <td><Badge text={attr.dataType} /></td>
                          <td>{attr.isPrimaryKey ? '🔑' : ''}</td>
                          <td>{attr.isMandatory ? '✓' : ''}</td>
                          <td className="attr-desc">{attr.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {entity.relationships?.length > 0 && (
                <div className="relationships">
                  <h5>Relationships</h5>
                  <div className="rel-list">
                    {entity.relationships.map((rel, j) => (
                      <div key={j} className="rel-item">
                        <Badge text={rel.type} color="var(--os-blue)" />
                        <span className="rel-arrow">→</span>
                        <strong>{rel.entity}</strong>
                        <span className="rel-desc">{rel.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function ArchitectureSection({ data }) {
  const modules = data.architecture?.modules || [];
  const layers = ['End-User', 'Core', 'Foundation', 'Integration'];
  return (
    <div className="section-content">
      {layers.map(layer => {
        const mods = modules.filter(m => m.layer === layer);
        if (!mods.length) return null;
        return (
          <div key={layer} className="arch-layer">
            <div className="layer-header" style={{ borderLeftColor: LAYER_COLOR[layer], borderLeftWidth: '4px' }}>
              <span className="layer-name">{layer} Layer</span>
              <span className="layer-count">{mods.length} module(s)</span>
            </div>
            <div className="module-grid">
              {mods.map((mod, i) => (
                <Card key={i} className="module-card">
                  <div className="module-header">
                    <h4>{mod.name}</h4>
                    <Badge text={mod.type} color={LAYER_COLOR[layer]} textColor={LAYER_TEXT_COLOR[layer]} />
                  </div>
                  <p className="module-desc">{mod.description}</p>
                  {mod.mainFunctionalities?.length > 0 && (
                    <ul className="func-list">
                      {mod.mainFunctionalities.map((f, j) => <li key={j}>{f}</li>)}
                    </ul>
                  )}
                  {mod.dependencies?.length > 0 && (
                    <div className="deps">
                      <span className="deps-label">Depends on: </span>
                      {mod.dependencies.map((d, j) => <Badge key={j} text={d} />)}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}
      {data.architecture?.layerDiagram && (
        <Card title="Architecture Notes">
          <pre className="diagram-text">{data.architecture.layerDiagram}</pre>
        </Card>
      )}
    </div>
  );
}

function ScreensSection({ data }) {
  const screens = data.screens || [];
  return (
    <div className="section-content">
      <p className="section-desc">{screens.length} screens identified</p>
      <div className="screens-grid">
        {screens.map((screen, i) => (
          <Card key={i} className="screen-card">
            <div className="screen-header">
              <h4>{screen.name}</h4>
              <Badge text={screen.type} />
            </div>
            <p className="screen-module">Module: <strong>{screen.module}</strong></p>
            <p className="screen-desc">{screen.description}</p>
            {screen.uiComponents?.length > 0 && (
              <div className="tag-group">
                <span className="tag-label">UI Components</span>
                <div className="tags">{screen.uiComponents.map((c, j) => <Badge key={j} text={c} />)}</div>
              </div>
            )}
            {screen.roles?.length > 0 && (
              <div className="tag-group">
                <span className="tag-label">Roles</span>
                <div className="tags">{screen.roles.map((r, j) => <Badge key={j} text={r} color="var(--os-blue)" />)}</div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function LogicSection({ data }) {
  const logic = data.businessLogic || {};
  const [activeTab, setActiveTab] = useState('server');
  const tabs = [
    { id: 'server', label: 'Server Actions', items: logic.serverActions || [] },
    { id: 'client', label: 'Client Actions', items: logic.clientActions || [] },
    { id: 'timers', label: 'Timers', items: logic.timers || [] },
  ].filter(t => t.items.length > 0);

  return (
    <div className="section-content">
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label} <span className="tab-count">{t.items.length}</span>
          </button>
        ))}
      </div>
      {tabs.find(t => t.id === activeTab)?.items.map((item, i) => (
        <Card key={i}>
          <div className="action-header">
            <h4><code>{item.name}</code></h4>
            {'module' in item && <Badge text={item.module} />}
            {'screen' in item && <Badge text={item.screen} />}
            {'schedule' in item && <Badge text={item.schedule} color="var(--warning)" />}
          </div>
          <p className="action-desc">{item.description}</p>
          {'inputs' in item && item.inputs?.length > 0 && (
            <div className="io-group">
              <span className="io-label">Inputs</span>
              {item.inputs.map((inp, j) => (
                <span key={j} className="io-item"><code>{inp.name}</code> <Badge text={inp.dataType} /></span>
              ))}
            </div>
          )}
          {'outputs' in item && item.outputs?.length > 0 && (
            <div className="io-group">
              <span className="io-label">Outputs</span>
              {item.outputs.map((out, j) => (
                <span key={j} className="io-item"><code>{out.name}</code> <Badge text={out.dataType} /></span>
              ))}
            </div>
          )}
          {item.logic && <p className="logic-text">{item.logic}</p>}
        </Card>
      ))}
    </div>
  );
}

function IntegrationsSection({ data }) {
  const integrations = data.integrations || [];
  return (
    <div className="section-content">
      {integrations.length === 0 ? <p className="empty">No integrations identified.</p> : (
        <div className="integrations-grid">
          {integrations.map((int, i) => (
            <Card key={i} className="integration-card">
              <div className="int-header">
                <h4>{int.name}</h4>
                <div className="int-badges">
                  <Badge text={int.type} color="var(--d-black)" />
                  <Badge text={int.direction} color="#555555" />
                </div>
              </div>
              <p>{int.description}</p>
              {int.endpoints?.length > 0 && (
                <div className="endpoints">
                  <span className="tag-label">Endpoints</span>
                  {int.endpoints.map((e, j) => <code key={j} className="endpoint">{e}</code>)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SecuritySection({ data }) {
  const sec = data.security || {};
  return (
    <div className="section-content">
      <div className="security-meta">
        {sec.authenticationMethod && (
          <Card title="Authentication Method">
            <p>{sec.authenticationMethod}</p>
          </Card>
        )}
        {sec.sensitiveData?.length > 0 && (
          <Card title="Sensitive Data">
            <div className="tags">{sec.sensitiveData.map((d, i) => <Badge key={i} text={d} color="var(--os-red)" textColor="var(--d-black)" />)}</div>
          </Card>
        )}
      </div>
      <h3 className="subsection-title">Roles & Permissions</h3>
      {(sec.roles || []).map((role, i) => (
        <Card key={i}>
          <div className="role-header">
            <h4>{role.name}</h4>
          </div>
          <p>{role.description}</p>
          {role.permissions?.length > 0 && (
            <div className="tags" style={{ marginTop: 8 }}>
              {role.permissions.map((p, j) => <Badge key={j} text={p} />)}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function RoadmapSection({ data }) {
  const roadmap = data.roadmap || {};
  return (
    <div className="section-content">
      {roadmap.totalEstimatedDuration && (
        <div className="roadmap-header">
          <span className="total-duration">Total Estimated Duration: <strong>{roadmap.totalEstimatedDuration}</strong></span>
        </div>
      )}
      <div className="phases">
        {(roadmap.phases || []).map((phase, i) => (
          <div key={i} className="phase">
            <div className="phase-marker">
              <span className="phase-num">{phase.phase}</span>
            </div>
            <div className="phase-content">
              <div className="phase-header">
                <h4>{phase.name}</h4>
                <Badge text={phase.duration} color="var(--os-blue)" textColor="var(--d-black)" />
              </div>
              <div className="phase-body">
                {phase.tasks?.length > 0 && (
                  <div className="phase-section">
                    <h5>Tasks</h5>
                    <ul>{phase.tasks.map((t, j) => <li key={j}>{t}</li>)}</ul>
                  </div>
                )}
                {phase.deliverables?.length > 0 && (
                  <div className="phase-section">
                    <h5>Deliverables</h5>
                    <ul>{phase.deliverables.map((d, j) => <li key={j}>{d}</li>)}</ul>
                  </div>
                )}
                {phase.dependencies?.length > 0 && (
                  <div className="phase-section">
                    <h5>Dependencies</h5>
                    <ul>{phase.dependencies.map((d, j) => <li key={j}>{d}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {roadmap.risks?.length > 0 && (
        <>
          <h3 className="subsection-title">Risk Register</h3>
          {roadmap.risks.map((risk, i) => (
            <Card key={i} className="risk-card">
              <div className="risk-header">
                <span className="risk-impact" style={{ background: IMPACT_COLOR[risk.impact] }}>{risk.impact} Impact</span>
                <p className="risk-text">{risk.risk}</p>
              </div>
              <p className="mitigation"><strong>Mitigation:</strong> {risk.mitigation}</p>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

function JsonSection({ data }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <div className="section-content">
      <pre className="json-view">{json}</pre>
    </div>
  );
}

export default function ResultsPage({ plan, originalContent, projectName, onPlanGenerated, onReset }) {
  const [activeSection, setActiveSection] = useState('summary');
  const [showRefine, setShowRefine] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [showPptMenu, setShowPptMenu] = useState(false);
  const pptMenuRef = useRef(null);

  useEffect(() => {
    if (!showPptMenu) return;
    const handler = (e) => {
      if (pptMenuRef.current && !pptMenuRef.current.contains(e.target)) {
        setShowPptMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPptMenu]);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPpt = async (density) => {
    setShowPptMenu(false);
    setIsExportingPpt(true);
    try {
      await exportPptx(plan, density);
      toast.success('PowerPoint exported');
    } catch (err) {
      toast.error('Failed to generate PowerPoint: ' + (err.message || 'Unknown error'));
      console.error(err);
    } finally {
      setIsExportingPpt(false);
    }
  };

  const handleRefine = async () => {
    if (!additionalNotes.trim()) {
      toast.error('Please enter additional information before refining');
      return;
    }
    setIsRefining(true);
    try {
      const res = await axios.post('/api/refine', {
        content: originalContent,
        projectName,
        currentPlan: plan,
        additionalNotes: additionalNotes.trim()
      }, { timeout: 210000 });
      onPlanGenerated(res.data.plan);
      setAdditionalNotes('');
      setShowRefine(false);
      toast.success('Plan refined successfully!');
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Refinement failed';
      toast.error(message);
    } finally {
      setIsRefining(false);
    }
  };

  const exportJSON = () => {
    downloadBlob(
      new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' }),
      `${plan.projectSummary?.name || 'migration'}-outsystems-plan.json`
    );
    toast.success('JSON exported');
  };

  const exportText = () => {
    let text = `OutSystems Migration Plan\n${'='.repeat(40)}\n\n`;
    text += `Project: ${plan.projectSummary?.name}\n`;
    text += `Description: ${plan.projectSummary?.description}\n`;
    text += `Complexity: ${plan.projectSummary?.complexity}\n`;
    text += `Source Technology: ${plan.projectSummary?.originalTechnology}\n\n`;

    text += `DATA MODEL\n${'-'.repeat(30)}\n`;
    plan.dataModel?.entities?.forEach(e => {
      text += `\nEntity: ${e.name}\n${e.description}\n`;
      e.attributes?.forEach(a => { text += `  - ${a.name} (${a.dataType})${a.isPrimaryKey ? ' [PK]' : ''}${a.isMandatory ? ' [Required]' : ''}\n`; });
    });

    text += `\nARCHITECTURE\n${'-'.repeat(30)}\n`;
    plan.architecture?.modules?.forEach(m => {
      text += `\nModule: ${m.name} [${m.layer}]\n${m.description}\n`;
    });

    text += `\nROADMAP\n${'-'.repeat(30)}\n`;
    text += `Total Duration: ${plan.roadmap?.totalEstimatedDuration}\n`;
    plan.roadmap?.phases?.forEach(p => {
      text += `\nPhase ${p.phase}: ${p.name} (${p.duration})\n`;
      p.tasks?.forEach(t => { text += `  - ${t}\n`; });
    });

    downloadBlob(
      new Blob([text], { type: 'text/plain' }),
      `${plan.projectSummary?.name || 'migration'}-outsystems-plan.txt`
    );
    toast.success('Text file exported');
  };

  const activeS = SECTIONS.find(s => s.id === activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case 'summary': return <SummarySection data={plan} />;
      case 'dataModel': return <DataModelSection data={plan} />;
      case 'architecture': return <ArchitectureSection data={plan} />;
      case 'screens': return <ScreensSection data={plan} />;
      case 'logic': return <LogicSection data={plan} />;
      case 'integrations': return <IntegrationsSection data={plan} />;
      case 'security': return <SecuritySection data={plan} />;
      case 'roadmap': return <RoadmapSection data={plan} />;
      case 'json': return <JsonSection data={plan} />;
      default: return null;
    }
  };

  return (
    <div className="results-page">
      <div className="results-topbar">
        <div>
          <h1 className="results-title">{plan.projectSummary?.name}</h1>
          <p className="results-subtitle">OutSystems Migration Plan <span className="saved-badge">✓ Saved</span></p>
        </div>
        <div className="results-actions">
          <button className="action-btn" onClick={exportJSON}>↓ JSON</button>
          <button className="action-btn" onClick={exportText}>↓ TXT</button>
          <div className="ppt-dropdown-wrap" ref={pptMenuRef}>
            <button
              className={`action-btn ppt-btn ${isExportingPpt ? 'loading' : ''}`}
              onClick={() => setShowPptMenu(v => !v)}
              disabled={isExportingPpt}
            >
              {isExportingPpt ? <><span className="spinner" /> Generating…</> : '↓ PPT ▾'}
            </button>
            {showPptMenu && (
              <div className="ppt-menu">
                <button className="ppt-menu-item" onClick={() => handleExportPpt('compact')}>Compact</button>
                <button className="ppt-menu-item" onClick={() => handleExportPpt('detailed')}>Detailed</button>
              </div>
            )}
          </div>
          <button
            className={`action-btn refine-toggle ${showRefine ? 'active' : ''}`}
            onClick={() => setShowRefine(v => !v)}
          >
            ↺ Refine Plan
          </button>
          <button className="action-btn secondary" onClick={onReset}>← New Analysis</button>
        </div>
      </div>

      {showRefine && (
        <div className="refine-panel">
          <div className="refine-panel-header">
            <h3 className="refine-title">Refine Migration Plan</h3>
            <p className="refine-subtitle">Add corrections, missing details, or new context. Claude will update the plan while keeping existing information intact.</p>
          </div>
          <textarea
            className="refine-textarea"
            placeholder="e.g. The system also integrates with SAP for payroll data. Add a Payroll entity with fields: EmployeeId, GrossAmount, NetAmount, PayDate. The ClaimApproval screen should be restricted to the Manager role only."
            value={additionalNotes}
            onChange={e => setAdditionalNotes(e.target.value)}
            rows={5}
            disabled={isRefining}
          />
          <div className="refine-actions">
            <button
              className="submit-refine-btn"
              onClick={handleRefine}
              disabled={isRefining}
            >
              {isRefining ? <><span className="spinner" /> Refining — this may take 1-2 minutes...</> : '↺ Apply Refinements'}
            </button>
            <button className="cancel-refine-btn" onClick={() => { setShowRefine(false); setAdditionalNotes(''); }} disabled={isRefining}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="results-layout">
        <nav className="results-sidebar">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`sidebar-btn ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span className="sidebar-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="results-main">
          <div className="section-header">
            <span className="section-icon">{activeS?.icon}</span>
            <h2>{activeS?.label}</h2>
          </div>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
