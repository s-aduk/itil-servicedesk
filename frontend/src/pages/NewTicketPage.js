import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createTicket } from '../store/ticketSlice';
import './NewTicketPage.css';

const CATEGORIES = [
  { value: 'access_management', label: 'Access Management', desc: 'Login issues, password resets, account lockouts', priority: 'high' },
  { value: 'service_interruption', label: 'Service Interruption', desc: 'Systems down, platforms unreachable, outages', priority: 'critical' },
  { value: 'hardware_software', label: 'Hardware / Software', desc: 'Device failures, software errors, peripheral issues', priority: 'medium' },
  { value: 'data_integrity', label: 'Data Integrity', desc: 'Incorrect records, transaction data errors', priority: 'high' },
  { value: 'general_inquiry', label: 'General Inquiry', desc: 'Non-urgent requests, routine maintenance', priority: 'low' },
];

const PRIORITY_COLOR = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--success)' };

export default function NewTicketPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submitting, error } = useSelector((s) => s.tickets);
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [success, setSuccess] = useState(null);

  const selectedCat = CATEGORIES.find((c) => c.value === form.category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createTicket(form));
    if (!result.error) {
      setSuccess(result.payload.ticketNumber);
      setTimeout(() => navigate(`/tickets/${result.payload._id}`), 1800);
    }
  };

  return (
    <div className="new-ticket-page">
      <div className="page-header">
        <h1 className="page-title">Log New Incident</h1>
        <p className="page-subtitle">Priority is automatically assigned based on the category you select.</p>
      </div>

      <div className="new-ticket-layout">
        {/* Form */}
        <div className="new-ticket-form card">
          {error && <div className="alert alert-error">{error}</div>}
          {success && (
            <div className="alert alert-success">
              ✓ Ticket <strong>{success}</strong> created — redirecting…
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Incident Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief, clear description of the problem"
                required
                minLength={5}
                maxLength={150}
              />
              <span className="form-hint">{form.title.length}/150</span>
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <div className="category-grid">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`category-card ${form.category === cat.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, category: cat.value })}
                  >
                    <div className="cat-header">
                      <span className="cat-name">{cat.label}</span>
                      <span
                        className="cat-priority"
                        style={{ color: PRIORITY_COLOR[cat.priority] }}
                      >{cat.priority}</span>
                    </div>
                    <div className="cat-desc">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the incident in detail. Include: what you were doing, what went wrong, any error messages, affected systems, number of users impacted."
                rows={6}
                required
                minLength={10}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !form.category}>
                {submitting ? <><span className="spinner" /> Submitting…</> : '↑ Submit Incident'}
              </button>
            </div>
          </form>
        </div>

        {/* ITIL Info Panel */}
        <div className="itil-panel">
          <div className="card itil-card">
            <h3 className="itil-title">ITIL Priority Matrix</h3>
            <div className="itil-matrix">
              {[
                { p: 'critical', def: 'Core banking failure or active breach', ex: 'Platform down across all branches' },
                { p: 'high', def: 'Major fault across multiple branches', ex: 'Multiple ATMs offline' },
                { p: 'medium', def: 'Isolated user or workstation fault', ex: 'Single account lockout' },
                { p: 'low', def: 'Non-urgent query or maintenance', ex: 'Record update request' },
              ].map(({ p, def, ex }) => (
                <div key={p} className="matrix-row">
                  <span className={`badge badge-${p}`} style={{ minWidth: 70, justifyContent: 'center' }}>{p}</span>
                  <div>
                    <div className="matrix-def">{def}</div>
                    <div className="matrix-ex">{ex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedCat && (
            <div className="card preview-card animate-fade">
              <h3 className="itil-title">Auto-assigned Priority</h3>
              <div className="preview-priority">
                <span className={`badge badge-${selectedCat.priority}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                  {selectedCat.priority.toUpperCase()}
                </span>
                <p className="preview-note">Based on category: <strong>{selectedCat.label}</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
