import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard, fetchTickets } from '../store/ticketSlice';
import './DashboardPage.css';

const PRIORITY_DOT = { critical:'var(--danger)', high:'var(--warning)', medium:'var(--info)', low:'var(--success)' };
const STATUS_LABEL  = { open:'Open', in_progress:'In Progress', pending:'Pending', resolved:'Resolved', closed:'Closed' };

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { stats, list, loading } = useSelector(s => s.tickets);
  const { user }  = useSelector(s => s.auth);

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchTickets({ limit:8 }));
  }, [dispatch]);

  const STAT_CONFIG = [
    { key:'total',      label:'Total Tickets',    color:'info',    icon:'◈' },
    { key:'open',       label:'Open',             color:'warning', icon:'⬡' },
    { key:'inProgress', label:'In Progress',      color:'accent',  icon:'↻' },
    { key:'resolved',   label:'Resolved',         color:'success', icon:'✓' },
    { key:'critical',   label:'Critical Active',  color:'danger',  icon:'!' },
    { key:'slaBreached',label:'SLA Breached',     color:'breach',  icon:'⚠' },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome back, <strong>{user?.name}</strong> —{' '}
          {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>

      <div className="stats-grid">
        {STAT_CONFIG.map(({ key, label, color, icon }) => (
          <div key={key} className={`stat-card stat-${color} animate-fade`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{stats ? (stats[key] ?? 0) : '—'}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
        <Link to="/tickets"     className="btn btn-secondary">View All Tickets</Link>
      </div>

      <div className="section-header"><h2 className="section-title">Recent Incidents</h2></div>

      {loading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <div className="empty-text">No incidents yet.</div>
          <Link to="/tickets/new" className="btn btn-primary" style={{ marginTop:12 }}>Log First Incident</Link>
        </div>
      ) : (
        <div className="ticket-list">
          {list.slice(0,8).map((t,i) => (
            <Link key={t._id} to={`/tickets/${t._id}`} className="ticket-row animate-fade"
              style={{ animationDelay:`${i*0.04}s` }}>
              <div className="ticket-row-left">
                <div className="priority-dot" style={{ background:PRIORITY_DOT[t.priority] }} />
                <div>
                  <div className="ticket-number">{t.ticketNumber}</div>
                  <div className="ticket-title">{t.title}</div>
                </div>
              </div>
              <div className="ticket-row-right">
                {t.slaBreached && <span className="sla-breach-tag">SLA BREACHED</span>}
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                <span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status]}</span>
                <span className="ticket-date">{new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
