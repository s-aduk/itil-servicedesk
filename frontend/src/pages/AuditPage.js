import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './AuditPage.css';

const ACTION_COLORS = {
  TICKET_CREATED:'var(--success)', TICKET_UPDATED:'var(--info)', TICKET_DELETED:'var(--danger)',
  NOTE_ADDED:'var(--accent)', TICKET_ESCALATED:'var(--warning)', TICKET_ESCALATED_MANUAL:'var(--warning)',
  USER_LOGIN:'var(--text-muted)', USER_REGISTERED:'var(--text-secondary)',
};

export default function AuditPage() {
  const [logs, setLogs]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [filters, setFilters]   = useState({ ticketNumber:'', action:'', page:1 });
  const [chainStatus, setChainStatus] = useState(null);
  const [verifying, setVerifying]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit:50 });
      const res = await api.get(`/audit?${params}`);
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const verifyChain = async () => {
    setVerifying(true);
    try {
      const res = await api.get('/audit/verify');
      setChainStatus(res.data.data);
    } catch(e) { console.error(e); }
    setVerifying(false);
  };

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  return (
    <div className="audit-page">
      <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="page-title">Audit Ledger</h1>
          <p className="page-subtitle">Immutable hash-chained event log — every action recorded</p>
        </div>
        <button className="btn btn-secondary" onClick={verifyChain} disabled={verifying}>
          {verifying ? <><span className="spinner" /> Verifying…</> : '⬡ Verify Chain Integrity'}
        </button>
      </div>

      {chainStatus && (
        <div className={`alert ${chainStatus.valid ? 'alert-success' : 'alert-error'}`} style={{ marginBottom:20 }}>
          {chainStatus.valid
            ? `✓ Chain integrity verified — all ${chainStatus.totalEntries} entries intact`
            : `✗ Chain integrity compromised — ${chainStatus.results.filter(r => !r.chainOk).length} broken links detected`
          }
        </div>
      )}

      <div className="audit-filters">
        <input type="text" placeholder="Filter by ticket number…" value={filters.ticketNumber}
          onChange={e => setFilter('ticketNumber', e.target.value)} className="audit-filter-input" />
        <select value={filters.action} onChange={e => setFilter('action', e.target.value)} className="filter-select">
          <option value="">All Actions</option>
          {['TICKET_CREATED','TICKET_UPDATED','TICKET_DELETED','NOTE_ADDED','TICKET_ESCALATED','TICKET_ESCALATED_MANUAL','USER_LOGIN','USER_REGISTERED'].map(a => (
            <option key={a} value={a}>{a.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : (
        <>
          <div className="audit-table">
            <div className="audit-table-header">
              <span>Timestamp</span>
              <span>Action</span>
              <span>Actor</span>
              <span>Ticket</span>
              <span>Hash</span>
            </div>
            {logs.length === 0 && (
              <div className="audit-empty">No audit entries found</div>
            )}
            {logs.map((log, i) => (
              <div key={log._id} className="audit-row animate-fade" style={{ animationDelay:`${i*0.02}s` }}>
                <span className="audit-time">{new Date(log.createdAt).toLocaleString('en-GB')}</span>
                <span>
                  <span className="audit-action-badge" style={{ borderColor: ACTION_COLORS[log.action] || 'var(--border)', color: ACTION_COLORS[log.action] || 'var(--text-secondary)' }}>
                    {log.action.replace(/_/g,' ')}
                  </span>
                </span>
                <span className="audit-actor">{log.userName}</span>
                <span className="audit-ticket">{log.ticketNumber || '—'}</span>
                <span className="audit-hash" title={log.hash}>{log.hash?.slice(0,16)}…</span>
              </div>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary" disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>‹ Prev</button>
              <span className="page-info">Page {pagination.page} of {pagination.pages}</span>
              <button className="btn btn-secondary" disabled={filters.page >= pagination.pages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
