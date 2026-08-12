import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArticle, voteArticle, clearCurrent } from '../store/knowledgeSlice';
import './ArticlePage.css';

const CAT_LABELS = { access_management:'Access Management', service_interruption:'Service Interruption', hardware_software:'Hardware / Software', data_integrity:'Data Integrity', general_inquiry:'General Inquiry' };

export default function ArticlePage() {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: article, related, loading } = useSelector(s => s.knowledge);

  useEffect(() => { dispatch(fetchArticle(id)); return () => dispatch(clearCurrent()); }, [dispatch, id]);

  if (loading) return <div className="loading-state" style={{ padding:80 }}><span className="spinner" /></div>;
  if (!article) return null;

  return (
    <div className="article-page animate-fade">
      <div className="article-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <span className={`kb-cat-badge kb-cat-${article.category}`}>{CAT_LABELS[article.category]}</span>
      </div>

      <h1 className="article-title">{article.title}</h1>

      <div className="article-meta-bar">
        <span>✎ {article.authorName}</span>
        <span>👁 {article.views} views</span>
        <span>👍 {article.helpful}</span>
        <span>👎 {article.notHelpful}</span>
        <span className="article-date">{new Date(article.createdAt).toLocaleDateString('en-GB')}</span>
      </div>

      {article.tags?.length > 0 && (
        <div className="article-tags">
          {article.tags.map(t => <span key={t} className="kb-tag">{t}</span>)}
        </div>
      )}

      <div className="article-layout">
        <div className="article-body">
          <div className="article-content">{article.content}</div>

          <div className="article-vote">
            <p className="vote-label">Was this article helpful?</p>
            <div className="vote-btns">
              <button className="btn btn-secondary" onClick={() => dispatch(voteArticle({ id, helpful:true }))}>👍 Yes, helpful</button>
              <button className="btn btn-secondary" onClick={() => dispatch(voteArticle({ id, helpful:false }))}>👎 Not helpful</button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="article-sidebar">
            <h3 className="sidebar-section-title">Related Articles</h3>
            <div className="related-list">
              {related.map(r => (
                <Link key={r._id} to={`/knowledge/${r._id}`} className="related-item">
                  <span className="related-title">{r.title}</span>
                  <span className="related-meta">👁 {r.views} · 👍 {r.helpful}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
