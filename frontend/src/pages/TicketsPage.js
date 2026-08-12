import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTickets } from '../store/ticketSlice';
import './TicketsPage.css';

const STATUSES = ['', 'open', 'in_progress', 'pending', 'resolved', 'closed'];
const PRIORITIES = ['', 'critical', 'high', 'medium', 'low'];
const CATEGORIES = ['', 'access_management', 'service_interruption', 'hardware_software', 'data_integrity', 'general_inquiry'];
const CATEGORY_LABELS = {
  access_management: 'Access Mgmt',
  service_interruption: 'Service Interruption',
  hardware_software: 'Hardware / Software',
  data_integrity: 'Data Integrity',
  general_inquiry: 'General Inquiry',
};
const PRIORITY_DOT = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--success)' };

export default function TicketsPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.tickets);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '', page: 1 });

  const load = useCallback(() => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    params.page = filters.page;
    params.limit = 15;
    dispatch(fetchTickets(params));
  }, [dispatch, filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  return (
    <div className="tickets-page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Incidents</h1>
          <p className="page-subtitle">
            {pagination ? `${pagination.total} total ticket${pagination.total !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          className="filter-search"
          placeholder="Search by title, number, or description…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className="filter-select">
          <option value="">All Statuses</option>
          {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} className="filter-select">
          <option value="">All Priorities</option>
          {PRIORITIES.slice(1).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className="filter-select">
          <option value="">All Categories</option>
          {CATEGORIES.slice(1).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <div className="empty-text">No tickets match your filters.</div>
        </div>
      ) : (
        <>
          <div className="ticket-table">
            <div className="table-header">
              <span>Ticket</span>
              <span>Title</span>
              <span>Category</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Reporter</span>
              <span>Date</span>
            </div>
            {list.map((t, i) => (
              <Link
                key={t._id}
                to={`/tickets/${t._id}`}
                className="table-row animate-fade"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <span className="t-number">{t.ticketNumber}</span>
                <span className="t-title">{t.title}</span>
                <span className="t-category">{CATEGORY_LABELS[t.category] || t.category}</span>
                <span>
                  <span className={`badge badge-${t.priority}`}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_DOT[t.priority], display: 'inline-block' }} />
                    {t.priority}
                  </span>
                </span>
                <span><span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span></span>
                <span className="t-reporter">{t.reporterName || t.reporter?.name || '—'}</span>
                <span className="t-date">{new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >‹ Prev</button>
              <span className="page-info">Page {pagination.page} of {pagination.pages}</span>
              <button
                className="btn btn-secondary"
                disabled={filters.page >= pagination.pages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >Next ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
