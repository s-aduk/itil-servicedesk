import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArticles, deleteArticle } from '../store/knowledgeSlice';
import './KnowledgePage.css';

const CATEGORIES = ['','access_management','service_interruption','hardware_software','data_integrity','general_inquiry'];
const CAT_LABELS = { access_management:'Access Mgmt', service_interruption:'Service Interruption', hardware_software:'Hardware/Software', data_integrity:'Data Integrity', general_inquiry:'General Inquiry' };
const SUPPORT_ROLES = ['admin','tier1','tier2','tier3'];

export default function KnowledgePage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { list, pagination, loading } = useSelector(s => s.knowledge);
  const { user }  = useSelector(s => s.auth);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => { dispatch(fetchArticles({ search, category, limit:20 })); }, [dispatch, search, category]);

  const canEdit = SUPPORT_ROLES.includes(user?.role);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Delete this article?')) return;
    await dispatch(deleteArticle(id));
  };

  return (
    <div className="kb-page">
      <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">Knowledge Base</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} articles — searchable resolution guides</p>
        </div>
        {canEdit && <Link to="/knowledge/new" className="btn btn-primary">+ New Article</Link>}
      </div>

      <div className="kb-filters">
        <input type="text" placeholder="Search articles…" value={search}
          onChange={e => setSearch(e.target.value)} className="kb-search" />
        <select value={category} onChange={e => setCategory(e.target.value)} className="filter-select">
          <option value="">All Categories</option>
          {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <div className="empty-text">No articles yet.{canEdit && ' Create the first one.'}</div>
          {canEdit && <Link to="/knowledge/new" className="btn btn-primary" style={{ marginTop:12 }}>Create Article</Link>}
        </div>
      ) : (
        <div className="kb-grid">
          {list.map(article => (
            <Link key={article._id} to={`/knowledge/${article._id}`} className="kb-card animate-fade">
              <div className="kb-card-header">
                <span className={`kb-cat-badge kb-cat-${article.category}`}>{CAT_LABELS[article.category]}</span>
                {canEdit && (
                  <button className="kb-delete-btn" onClick={e => handleDelete(article._id, e)} title="Delete">✕</button>
                )}
              </div>
              <h3 className="kb-card-title">{article.title}</h3>
              <div className="kb-card-meta">
                <span>✎ {article.authorName}</span>
                <span>👁 {article.views}</span>
                <span>👍 {article.helpful}</span>
                <span className="kb-date">{new Date(article.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
              {article.tags?.length > 0 && (
                <div className="kb-tags">
                  {article.tags.slice(0,4).map(t => <span key={t} className="kb-tag">{t}</span>)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
