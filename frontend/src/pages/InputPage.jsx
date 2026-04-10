import { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './InputPage.css';

const MAX_TEXT_LENGTH = 100000;

export default function InputPage({ onPlanGenerated }) {
  const [mode, setMode] = useState('text'); // 'text' | 'file'
  const [projectName, setProjectName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleFileSelect = (f) => {
    const allowed = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/markdown'];
    const ext = f.name.split('.').pop().toLowerCase();
    const allowedExts = ['pdf', 'txt', 'docx', 'doc', 'md'];
    if (!allowedExts.includes(ext)) {
      toast.error(`Unsupported file type. Use: PDF, TXT, DOCX, MD`);
      return;
    }
    setFile(f);
    if (!projectName) setProjectName(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    if (mode === 'text' && !textContent.trim()) {
      toast.error('Please enter project documentation');
      return;
    }

    if (mode === 'file' && !file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsLoading(true);

    try {
      let content = '';

      if (mode === 'file') {
        setLoadingStep('Extracting text from file...');
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await axios.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        content = uploadRes.data.content;
        toast.success(`Extracted ${uploadRes.data.wordCount.toLocaleString()} words from ${uploadRes.data.filename}`);
      } else {
        content = textContent;
      }

      setLoadingStep('Analysing with Claude AI — this takes 1-2 minutes...');

      const headers = {};
      if (apiKey.trim()) {
        headers['x-api-key-override'] = apiKey.trim();
      }

      const generateRes = await axios.post('/api/generate', {
        content,
        projectName: projectName.trim()
      }, { headers, timeout: 210000 });

      setLoadingStep('Processing migration plan...');
      onPlanGenerated(generateRes.data.plan, content, projectName.trim());
      toast.success('Migration plan generated successfully!');
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'An error occurred';
      toast.error(message);
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="input-page">
      <div className="page-hero">
        <h1>Migrate Your Project to <span className="highlight">OutSystems</span></h1>
        <p>Upload or paste your project documentation and let AI generate a complete OutSystems migration plan.</p>
      </div>

      <div className="input-card">
        {/* Project Name */}
        <div className="form-group">
          <label className="form-label">Project Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Customer Portal, HR Management System..."
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`toggle-btn ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
            disabled={isLoading}
          >
            Paste Text
          </button>
          <button
            className={`toggle-btn ${mode === 'file' ? 'active' : ''}`}
            onClick={() => setMode('file')}
            disabled={isLoading}
          >
            Upload File
          </button>
        </div>

        {/* Text Input */}
        {mode === 'text' && (
          <div className="form-group">
            <label className="form-label">
              Project Documentation
              <span className="char-count">{textContent.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()} chars</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Paste your project documentation, requirements, technical specs, database schema, user stories, or any relevant information..."
              value={textContent}
              onChange={e => setTextContent(e.target.value.slice(0, MAX_TEXT_LENGTH))}
              disabled={isLoading}
              rows={16}
            />
          </div>
        )}

        {/* File Upload */}
        {mode === 'file' && (
          <div className="form-group">
            <label className="form-label">Upload Documentation File</label>
            <div
              className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => !isLoading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx,.doc,.md"
                style={{ display: 'none' }}
                onChange={e => e.target.files[0] && handleFileSelect(e.target.files[0])}
                disabled={isLoading}
              />
              {file ? (
                <div className="file-selected">
                  <span className="file-icon">📄</span>
                  <div>
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button className="remove-file" onClick={e => { e.stopPropagation(); setFile(null); }}>✕</button>
                </div>
              ) : (
                <div className="drop-prompt">
                  <span className="drop-icon">📂</span>
                  <p>Drag & drop your file here, or <span className="link">browse</span></p>
                  <p className="drop-hint">Supports PDF, TXT, DOCX, MD (max 20MB)</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optional API Key */}
        <div className="form-group api-key-group">
          <label className="form-label">
            Anthropic API Key
            <span className="optional-badge">optional – uses server key if omitted</span>
          </label>
          <div className="api-key-input-wrap">
            <input
              type={showApiKey ? 'text' : 'password'}
              className="form-input"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              disabled={isLoading}
            />
            <button className="toggle-visibility" onClick={() => setShowApiKey(v => !v)}>
              {showApiKey ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          className={`submit-btn ${isLoading ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              {loadingStep || 'Processing...'}
            </>
          ) : (
            <>⚡ Generate OutSystems Migration Plan</>
          )}
        </button>
      </div>

      {/* How it works */}
      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          {[
            { icon: '📥', title: 'Input', desc: 'Upload docs or paste your project description' },
            { icon: '🧠', title: 'AI Analysis', desc: 'Claude analyzes your architecture, data, and logic' },
            { icon: '🏗️', title: 'Generation', desc: 'Full OutSystems blueprint is created automatically' },
            { icon: '📊', title: 'Export', desc: 'Download JSON, text, or full documentation' },
          ].map(step => (
            <div key={step.title} className="step-card">
              <span className="step-icon">{step.icon}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
