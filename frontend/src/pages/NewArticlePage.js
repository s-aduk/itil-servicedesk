import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createArticle } from '../store/knowledgeSlice';
import './NewArticlePage.css';

const CATEGORIES = [
  { value:'access_management', label:'Access Management' },
  { value:'service_interruption', label:'Service Interruption' },
  { value:'hardware_software', label:'Hardware / Software' },
  { value:'data_integrity', label:'Data Integrity' },
  { value:'general_inquiry', label:'General Inquiry' },
];

export default function NewArticlePage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { submitting, error } = useSelector(s => s.knowledge);
  const [form, setForm] = useState({ title:'', category:'', content:'', tags:'' });

  const handleSubmit = async e => {
    e.preventDefault();
    const tags = form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const result = await dispatch(createArticle({ ...form, tags }));
    if (!result.error) navigate(`/knowledge/${result.payload._id}`);
  };

  return (
    <div className="new-article-page">
      <div className="page-header">
        <h1 className="page-title">New Knowledge Article</h1>
        <p className="page-subtitle">Document a resolution guide for the team.</p>
      </div>

      <div className="new-article-layout">
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title:e.target.value})}
                placeholder="Clear, descriptive title (e.g. How to reset FLEXCUBE access)" required minLength={5} />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select value={form.category} onChange={e => setForm({...form, category:e.target.value})} required>
                <option value="">— Select category —</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Content *</label>
              <textarea value={form.content} onChange={e => setForm({...form, content:e.target.value})}
                placeholder="Write the resolution steps, causes, and prevention tips…" rows={14} required minLength={20} />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={e => setForm({...form, tags:e.target.value})}
                placeholder="e.g. password, reset, flexcube, access" />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><span className="spinner" /> Saving…</> : '↑ Publish Article'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
