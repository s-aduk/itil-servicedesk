import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAiSuggestion, clearAi } from '../store/knowledgeSlice';
import './AiSuggestionPanel.css';

export default function AiSuggestionPanel({ ticketId }) {
  const dispatch = useDispatch();
  const { aiSuggestion: s, aiLoading, aiError } = useSelector(st => st.knowledge);

  const handleFetch = () => {
    dispatch(clearAi());
    dispatch(fetchAiSuggestion(ticketId));
  };

  return (
    <div className="ai-panel card">
      <div className="ai-panel-header">
        <div className="ai-label">
          <span className="ai-icon">✦</span>
          <span className="ai-title">AI Resolution Suggestion</span>
        </div>
        <button className="btn btn-secondary ai-btn" onClick={handleFetch} disabled={aiLoading}>
          {aiLoading ? <><span className="spinner" /> Thinking…</> : s ? '↻ Regenerate' : '✦ Suggest Fix'}
        </button>
      </div>

      {aiError && <div className="alert alert-error" style={{ marginTop:12 }}>{aiError}</div>}

      {s && (
        <div className="ai-result animate-fade">
          <div className="ai-section">
            <div className="ai-section-title">Immediate Steps</div>
            <ol className="ai-steps">
              {s.immediateSteps?.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
          <div className="ai-row">
            <div className="ai-section">
              <div className="ai-section-title">Root Cause</div>
              <p className="ai-text">{s.rootCauseLikely}</p>
            </div>
            <div className="ai-section">
              <div className="ai-section-title">Est. Resolution Time</div>
              <p className="ai-text ai-highlight">{s.estimatedResolutionTime}</p>
            </div>
            <div className="ai-section">
              <div className="ai-section-title">Relevant Team</div>
              <p className="ai-text">{s.relevantTeam}</p>
            </div>
          </div>
          {s.escalationRecommended && (
            <div className="ai-section ai-escalation-warn">
              <div className="ai-section-title">⚠ Escalation Recommended</div>
              <p className="ai-text">{s.escalationReason}</p>
            </div>
          )}
          {s.preventionTips?.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-title">Prevention Tips</div>
              <ul className="ai-tips">
                {s.preventionTips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
          <p className="ai-disclaimer">AI-generated suggestion. Always verify before applying.</p>
        </div>
      )}
    </div>
  );
}
