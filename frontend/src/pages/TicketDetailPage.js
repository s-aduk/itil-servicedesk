import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTicketById, updateTicket, addNote, clearCurrent } from '../store/ticketSlice';
import api from '../services/api';
import AiSuggestionPanel from '../components/AiSuggestionPanel';
import './TicketDetailPage.css';

const STATUS_FLOW = {
  open:        ['in_progress','closed'],
  in_progress: ['pending','resolved','open'],
  pending:     ['in_progress','resolved'],
  resolved:    ['closed','open'],
  closed:      [],
};
const STATUS_LABELS = { open:'Open', in_progress:'In Progress', pending:'Pending', resolved:'Resolved', closed:'Closed' };
const CATEGORY_LABELS = {
  access_management:'Access Management', service_interruption:'Service Interruption',
  hardware_software:'Hardware / Software', data_integrity:'Data Integrity', general_inquiry:'General Inquiry',
};
const ROLE_CAN_EDIT = ['admin','tier1','tier2','tier3'];

const fmtDuration = (mins) => {
  if (mins === null || mins === undefined) return '—';
  if (mins < 0) return 'Breached';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins/60); const m = mins%60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export default function TicketDetailPage() {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current:ticket, loading, error } = useSelector(s => s.tickets);
  const { user } = useSelector(s => s.auth);

  const [note, setNote]           = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusErr, setStatusErr] = useState('');

  // Escalation state
  const [escalating, setEscalating]   = useState(false);
  const [escTier, setEscTier]         = useState('tier2');
  const [escReason, setEscReason]     = useState('');
  const [escSubmitting, setEscSubmitting] = useState(false);
  const [escMsg, setEscMsg]           = useState('');

  // SLA live tick
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t+1), 30000);
    return () => clearInterval(id);
  }, []);

  const canEdit = ROLE_CAN_EDIT.includes(user?.role);
  const availableTransitions = ticket ? STATUS_FLOW[ticket.status] || [] : [];
  const isTerminal = ticket?.status === 'closed' || ticket?.status === 'resolved';

  useEffect(() => {
    dispatch(fetchTicketById(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  const handleStatusChange = async (newStatus) => {
    setStatusErr('');
    const result = await dispatch(updateTicket({ id, updates:{ status:newStatus } }));
    if (result.error) { setStatusErr(result.payload || 'Update failed'); }
    else { setStatusMsg(`Status updated to "${STATUS_LABELS[newStatus]}"`); setTimeout(() => setStatusMsg(''), 3000); }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSubmittingNote(true);
    await dispatch(addNote({ id, content:note }));
    setNote('');
    setSubmittingNote(false);
  };

  const handleEscalate = async (e) => {
    e.preventDefault();
    setEscSubmitting(true);
    try {
      await api.post(`/tickets/${id}/escalate`, { targetTier:escTier, reason:escReason });
      setEscMsg(`Escalated to ${escTier.toUpperCase()} successfully.`);
      setEscReason(''); setEscalating(false);
      dispatch(fetchTicketById(id));
    } catch(err) {
      setEscMsg(err.response?.data?.message || 'Escalation failed');
    }
    setEscSubmitting(false);
    setTimeout(() => setEscMsg(''), 4000);
  };

  // SLA bar calculations
  const getSlaBar = useCallback(() => {
    if (!ticket?.slaResolutionDeadline || !ticket?.createdAt) return null;
    const created  = new Date(ticket.createdAt).getTime();
    const deadline = new Date(ticket.slaResolutionDeadline).getTime();
    const now      = Date.now();
    const total    = deadline - created;
    const elapsed  = now - created;
    const pct      = Math.min(100, Math.round((elapsed/total)*100));
    const minsLeft = Math.round((deadline - now)/60000);
    return { pct, minsLeft, breached: now > deadline };
  }, [ticket]);

  if (loading && !ticket) return <div className="loading-state" style={{ padding:80 }}><span className="spinner" /></div>;
  if (error)   return <div className="alert alert-error" style={{ margin:24 }}>{error}</div>;
  if (!ticket) return null;

  const sla = getSlaBar();
  const barColor = sla?.breached ? 'var(--danger)' : sla?.pct >= 75 ? 'var(--warning)' : 'var(--accent)';

  return (
    <div className="ticket-detail animate-fade">
      <div className="detail-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <div className="detail-meta">
          <span className="detail-number">{ticket.ticketNumber}</span>
          <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
          <span className={`badge badge-${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
          {ticket.slaBreached && <span className="sla-breach-pill">SLA BREACHED</span>}
          {ticket.currentEscalationTier && (
            <span className="escalation-pill">↑ {ticket.currentEscalationTier.toUpperCase()}</span>
          )}
        </div>
      </div>

      <h1 className="detail-title">{ticket.title}</h1>

      {/* SLA Bar */}
      {sla && !isTerminal && (
        <div className="sla-bar-wrap">
          <div className="sla-bar-header">
            <span className="sla-bar-label">
              SLA Resolution — {sla.breached ? 'BREACHED' : `${fmtDuration(sla.minsLeft)} remaining`}
            </span>
            <span className="sla-bar-pct" style={{ color:barColor }}>{sla.pct}%</span>
          </div>
          <div className="sla-bar-track">
            <div className="sla-bar-fill" style={{ width:`${sla.pct}%`, background:barColor }} />
          </div>
          <div className="sla-bar-deadlines">
            <span>Response: {new Date(ticket.slaResponseDeadline).toLocaleString('en-GB')}</span>
            <span>Resolution: {new Date(ticket.slaResolutionDeadline).toLocaleString('en-GB')}</span>
          </div>
        </div>
      )}

      <div className="detail-layout">
        {/* Main column */}
        <div className="detail-main">

          {/* Description */}
          <div className="card detail-section">
            <h3 className="section-heading">Incident Description</h3>
            <p className="detail-description">{ticket.description}</p>
          </div>

          {/* Status change */}
          {canEdit && availableTransitions.length > 0 && (
            <div className="card detail-section">
              <h3 className="section-heading">Update Status</h3>
              {statusMsg && <div className="alert alert-success">{statusMsg}</div>}
              {statusErr && <div className="alert alert-error">{statusErr}</div>}
              <div className="status-actions">
                {availableTransitions.map(s => (
                  <button key={s} className={`btn status-btn status-btn-${s}`} onClick={() => handleStatusChange(s)}>
                    → {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Escalation panel */}
          {canEdit && !isTerminal && (
            <div className="card detail-section escalation-panel">
              <div className="escalation-header">
                <h3 className="section-heading">Escalation</h3>
                {ticket.currentEscalationTier && (
                  <span className="escalation-pill" style={{ fontSize:'0.72rem' }}>
                    Currently: {ticket.currentEscalationTier.toUpperCase()}
                  </span>
                )}
              </div>
              {escMsg && <div className={`alert ${escMsg.includes('success') ? 'alert-success' : 'alert-error'}`}>{escMsg}</div>}

              {ticket.escalations?.length > 0 && (
                <div className="escalation-history">
                  {ticket.escalations.map((e,i) => (
                    <div key={i} className="esc-history-item">
                      <span className="esc-tier">↑ {e.escalatedTo.toUpperCase()}</span>
                      <span className="esc-reason">{e.reason}</span>
                      <span className="esc-by">{e.triggeredBy === 'system' ? 'System' : 'Manual'} · {new Date(e.escalatedAt).toLocaleString('en-GB')}</span>
                    </div>
                  ))}
                </div>
              )}

              {!escalating ? (
                <button className="btn btn-secondary" style={{ fontSize:'0.82rem' }} onClick={() => setEscalating(true)}>
                  ↑ Manual Escalate
                </button>
              ) : (
                <form onSubmit={handleEscalate} className="escalation-form">
                  <div className="esc-row">
                    <div className="form-group" style={{ flex:1, marginBottom:0 }}>
                      <label className="form-label">Escalate To</label>
                      <select value={escTier} onChange={e => setEscTier(e.target.value)}>
                        <option value="tier2">Tier-2 Engineer</option>
                        <option value="tier3">Tier-3 Engineer</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom:10 }}>
                    <label className="form-label">Reason *</label>
                    <textarea value={escReason} onChange={e => setEscReason(e.target.value)}
                      placeholder="Describe why this ticket needs escalation…" rows={2} required minLength={5} />
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button type="button" className="btn btn-secondary" style={{ fontSize:'0.82rem' }}
                      onClick={() => { setEscalating(false); setEscReason(''); }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ fontSize:'0.82rem' }}
                      disabled={escSubmitting || escReason.trim().length < 5}>
                      {escSubmitting ? <span className="spinner" /> : '↑ Submit Escalation'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* AI Suggestion */}
          {canEdit && <AiSuggestionPanel ticketId={id} />}

          {/* Resolution notes */}
          <div className="card detail-section">
            <h3 className="section-heading">
              Resolution Notes
              <span className="notes-count">{ticket.resolutionNotes?.length || 0}</span>
            </h3>
            {ticket.resolutionNotes?.length === 0 && (
              <p className="no-notes">No notes yet.</p>
            )}
            <div className="notes-list">
              {ticket.resolutionNotes?.map((n,i) => (
                <div key={i} className="note-item animate-slide">
                  <div className="note-header">
                    <div className="note-avatar">{n.addedByName?.charAt(0)}</div>
                    <div>
                      <span className="note-author">{n.addedByName}</span>
                      <span className="note-time">{new Date(n.createdAt).toLocaleString('en-GB')}</span>
                    </div>
                  </div>
                  <div className="note-content">{n.content}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddNote} className="note-form">
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Add a resolution note, update, or diagnostic finding…" rows={3} />
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                <button type="submit" className="btn btn-primary" disabled={submittingNote || !note.trim()}>
                  {submittingNote ? <span className="spinner" /> : '↑ Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <div className="card meta-card">
            <h3 className="section-heading">Ticket Details</h3>
            <div className="meta-list">
              {[
                ['Ticket #', <span className="meta-mono">{ticket.ticketNumber}</span>],
                ['Category', CATEGORY_LABELS[ticket.category] || ticket.category],
                ['Priority', <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>],
                ['Status',   <span className={`badge badge-${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>],
                ['Reporter', ticket.reporterName],
                ['Assigned', ticket.assigneeName || <span style={{ color:'var(--text-muted)' }}>Unassigned</span>],
                ['Logged',   <span className="meta-mono">{new Date(ticket.createdAt).toLocaleString('en-GB')}</span>],
                ...(ticket.resolvedAt ? [['Resolved', <span className="meta-mono">{new Date(ticket.resolvedAt).toLocaleString('en-GB')}</span>]] : []),
                ...(ticket.mttrMinutes !== null && ticket.mttrMinutes !== undefined
                  ? [['MTTR', <span style={{ color:'var(--success)' }}>{fmtDuration(ticket.mttrMinutes)}</span>]] : []),
                ...(ticket.slaResponseMet !== null ? [['SLA Response', <span style={{ color: ticket.slaResponseMet ? 'var(--success)' : 'var(--danger)' }}>{ticket.slaResponseMet ? '✓ Met' : '✗ Missed'}</span>]] : []),
              ].map(([k,v],i) => (
                <div key={i} className="meta-row">
                  <span className="meta-key">{k}</span>
                  <span className="meta-val">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ITIL lifecycle */}
          <div className="card lifecycle-card">
            <h3 className="section-heading">ITIL Lifecycle</h3>
            <div className="lifecycle-steps">
              {['open','in_progress','resolved','closed'].map(s => {
                const order = ['open','in_progress','pending','resolved','closed'];
                const cur   = order.indexOf(ticket.status);
                const idx   = order.indexOf(s);
                const state = idx < cur ? 'done' : idx === cur ? 'active' : 'future';
                return (
                  <div key={s} className={`lifecycle-step lifecycle-${state}`}>
                    <div className="lifecycle-dot" />
                    <span>{STATUS_LABELS[s]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SLA summary card */}
          {sla && (
            <div className={`card sla-summary-card ${sla.breached ? 'sla-breached' : sla.pct >= 75 ? 'sla-warning' : ''}`}>
              <h3 className="section-heading">SLA Status</h3>
              <div className="sla-summary-body">
                <div className="sla-summary-pct" style={{ color:barColor }}>{sla.pct}%</div>
                <div className="sla-summary-label">
                  {sla.breached ? 'SLA Breached' : sla.pct >= 75 ? 'Warning: Nearing deadline' : 'Within SLA'}
                </div>
                {!sla.breached && (
                  <div className="sla-summary-remain" style={{ color:barColor }}>
                    {fmtDuration(sla.minsLeft)} remaining
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
