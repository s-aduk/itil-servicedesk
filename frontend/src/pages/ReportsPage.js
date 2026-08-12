import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import './ReportsPage.css';

const PRIORITY_COLORS = { critical: '#e05c5c', high: '#e08a3c', medium: '#c9a84c', low: '#4caf82' };
const CATEGORY_COLORS = ['#c9a84c', '#4c7bc9', '#4caf82', '#9b59b6', '#e05c5c'];
const TABS = ['Overview', 'SLA Compliance', 'Ticket Volume', 'Agent Performance', 'Category Breakdown', 'Export'];

const fmt = (v, d = 1) => (v == null ? '—' : Number(v).toFixed(d));
const fmtMins = (m) => {
  if (m == null) return '—';
  if (m < 60) return `${Math.round(m)}m`;
  return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;
};

const Spinner = () => <div className="rp-spinner" />;
const Err = ({ msg }) => <div className="rp-error">⚠ {msg}</div>;

const StatCard = ({ label, value, color }) => (
  <div className="rp-stat-card">
    <div className="rp-stat-value" style={{ color }}>{value}</div>
    <div className="rp-stat-label">{label}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rp-tooltip">
      <p className="rp-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const [tab, setTab] = useState('Overview');
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [granularity, setGranularity] = useState('daily');
  const [exportFormat, setExportFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  const [overview, setOverview]     = useState(null);
  const [sla, setSla]               = useState(null);
  const [volume, setVolume]         = useState(null);
  const [agents, setAgents]         = useState(null);
  const [categories, setCategories] = useState(null);
  const [loading, setLoading]       = useState({});
  const [errors, setErrors]         = useState({});

  const load = useCallback(async (key, url) => {
    setLoading(l => ({ ...l, [key]: true }));
    setErrors(e => ({ ...e, [key]: null }));
    try {
      const params = { from, to, ...(key === 'volume' ? { granularity } : {}) };
      const { data } = await api.get(url, { params });
      return data.data;
    } catch (e) {
      setErrors(err => ({ ...err, [key]: e.response?.data?.message || 'Failed to load' }));
      return null;
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  }, [from, to, granularity]);

  useEffect(() => {
    if (tab === 'Overview')           load('overview', '/reports/summary').then(setOverview);
    if (tab === 'SLA Compliance')     load('sla', '/reports/sla-compliance').then(setSla);
    if (tab === 'Ticket Volume')      load('volume', '/reports/ticket-volume').then(setVolume);
    if (tab === 'Agent Performance')  load('agents', '/reports/agent-performance').then(setAgents);
    if (tab === 'Category Breakdown') load('categories', '/reports/category-breakdown').then(setCategories);
  }, [tab, from, to, granularity, load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/reports/audit-export', {
        params: { from, to, format: exportFormat },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${Date.now()}.${exportFormat}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">Reports &amp; Analytics</h1>
          <p className="rp-subtitle">Service desk performance metrics and SLA compliance</p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="rp-filters">
        <span className="rp-filter-label">DATE RANGE</span>
        <input type="date" className="rp-date-input" value={from} onChange={e => setFrom(e.target.value)} />
        <span className="rp-filter-sep">→</span>
        <input type="date" className="rp-date-input" value={to} onChange={e => setTo(e.target.value)} />
        <button className="rp-btn rp-btn-ghost" onClick={() => { setFrom(monthAgo); setTo(today); }}>Reset</button>
      </div>

      {/* Tab nav */}
      <div className="rp-tabs">
        {TABS.map(t => (
          <button key={t} className={`rp-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <div>
          {loading.overview && <Spinner />}
          {errors.overview && <Err msg={errors.overview} />}
          {overview && (
            <>
              <div className="rp-stat-grid">
                <StatCard label="TOTAL TICKETS"   value={overview.summary?.total}               color="var(--gold)" />
                <StatCard label="OPEN"             value={overview.summary?.open}                color="#4c7bc9" />
                <StatCard label="RESOLVED"         value={overview.summary?.resolved}            color="#4caf82" />
                <StatCard label="SLA BREACHED"     value={overview.summary?.slaBreachedCount}    color="#e05c5c" />
                <StatCard label="ESCALATIONS"      value={overview.summary?.escalationCount}     color="#e08a3c" />
                <StatCard label="SLA COMPLIANCE"   value={overview.summary?.slaCompliancePercent != null ? `${overview.summary.slaCompliancePercent}%` : '—'} color="#4caf82" />
              </div>
              <div className="rp-card" style={{ marginTop: 20 }}>
                <h2 className="rp-card-title">Ticket Volume (Last 30 Days)</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={overview.dailyVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="date" tick={{ fill: '#8899bb', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#8899bb', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Tickets" fill="#c9a84c" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rp-two-col">
                <div className="rp-card">
                  <h2 className="rp-card-title">By Priority</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={overview.byPriority} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={80}>
                        {overview.byPriority?.map((e, i) => (
                          <Cell key={i} fill={PRIORITY_COLORS[e.priority] || '#c9a84c'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#8899bb' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="rp-card">
                  <h2 className="rp-card-title">MTTR by Priority (min)</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={overview.mttr}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="priority" tick={{ fill: '#8899bb', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#8899bb', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgMinutes" name="Avg MTTR (min)" radius={[3,3,0,0]}>
                        {overview.mttr?.map((e, i) => (
                          <Cell key={i} fill={PRIORITY_COLORS[e.priority] || '#c9a84c'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SLA Compliance ── */}
      {tab === 'SLA Compliance' && (
        <div>
          {loading.sla && <Spinner />}
          {errors.sla && <Err msg={errors.sla} />}
          {sla && (
            <>
              <div className="rp-card">
                <h2 className="rp-card-title">Compliance Rate by Priority</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sla}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="priority" tick={{ fill: '#8899bb', fontSize: 12 }} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#8899bb', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="complianceRate" name="Compliance %" radius={[4, 4, 0, 0]}>
                      {sla.map((e, i) => <Cell key={i} fill={PRIORITY_COLORS[e.priority] || '#c9a84c'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rp-card" style={{ marginTop: 20 }}>
                <h2 className="rp-card-title">Detail Table</h2>
                <table className="rp-table">
                  <thead>
                    <tr>{['Priority','Total','Met','Breached','Compliance %','Avg MTTR'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {sla.map((r, i) => (
                      <tr key={i}>
                        <td><span className="rp-priority-badge" style={{ background: PRIORITY_COLORS[r.priority] + '22', color: PRIORITY_COLORS[r.priority] }}>{r.priority?.toUpperCase()}</span></td>
                        <td>{r.total}</td>
                        <td style={{ color: '#4caf82' }}>{r.met}</td>
                        <td style={{ color: r.breached > 0 ? '#e05c5c' : '#8899bb' }}>{r.breached}</td>
                        <td style={{ color: r.complianceRate >= 90 ? '#4caf82' : r.complianceRate >= 75 ? '#c9a84c' : '#e05c5c' }}>{fmt(r.complianceRate)}%</td>
                        <td style={{ color: '#8899bb' }}>{fmtMins(r.avgMttrMinutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Ticket Volume ── */}
      {tab === 'Ticket Volume' && (
        <div>
          <div className="rp-sub-tabs">
            {['daily', 'weekly', 'monthly'].map(g => (
              <button key={g} className={`rp-tab ${granularity === g ? 'active' : ''}`} onClick={() => setGranularity(g)}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
          {loading.volume && <Spinner />}
          {errors.volume && <Err msg={errors.volume} />}
          {volume && (
            <div className="rp-card">
              <h2 className="rp-card-title">Ticket Volume Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={volume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="period" tick={{ fill: '#8899bb', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#8899bb', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="total" name="Tickets" stroke="#c9a84c" strokeWidth={2.5} dot={{ fill: '#c9a84c', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Agent Performance ── */}
      {tab === 'Agent Performance' && (
        <div>
          {loading.agents && <Spinner />}
          {errors.agents && <Err msg={errors.agents} />}
          {agents && (
            <div className="rp-card">
              <h2 className="rp-card-title">Agent Performance</h2>
              <table className="rp-table">
                <thead>
                  <tr>{['Agent','Assigned','Resolved','Resolution %','Avg MTTR','Breach %'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {agents.length === 0 && <tr><td colSpan={6} style={{ color: '#8899bb', textAlign: 'center', padding: 24 }}>No data for this period.</td></tr>}
                  {agents.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ color: '#f0f4ff', fontWeight: 600 }}>{a.agentName}</div>
                        <div style={{ color: '#8899bb', fontSize: 11 }}>{a.agentEmail}</div>
                      </td>
                      <td>{a.total}</td>
                      <td style={{ color: '#4caf82' }}>{a.resolved}</td>
                      <td style={{ color: a.resolutionRate >= 80 ? '#4caf82' : a.resolutionRate >= 60 ? '#c9a84c' : '#e05c5c' }}>{fmt(a.resolutionRate)}%</td>
                      <td style={{ color: '#8899bb' }}>{fmtMins(a.avgMttrMinutes)}</td>
                      <td style={{ color: a.breachRate > 20 ? '#e05c5c' : a.breachRate > 10 ? '#c9a84c' : '#4caf82' }}>{fmt(a.breachRate)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Category Breakdown ── */}
      {tab === 'Category Breakdown' && (
        <div>
          {loading.categories && <Spinner />}
          {errors.categories && <Err msg={errors.categories} />}
          {categories && (
            <div className="rp-two-col">
              <div className="rp-card">
                <h2 className="rp-card-title">Tickets by Category</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100}>
                      {categories.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#8899bb' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rp-card">
                <h2 className="rp-card-title">Category Detail</h2>
                <table className="rp-table">
                  <thead>
                    <tr>{['Category','Total','Open','Resolved','Breached'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {categories.map((r, i) => (
                      <tr key={i}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0, display: 'inline-block' }} />
                          {r.category}
                        </td>
                        <td>{r.total}</td>
                        <td style={{ color: '#c9a84c' }}>{r.open}</td>
                        <td style={{ color: '#4caf82' }}>{r.resolved}</td>
                        <td style={{ color: r.breached > 0 ? '#e05c5c' : '#8899bb' }}>{r.breached}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Export ── */}
      {tab === 'Export' && (
        <div className="rp-card">
          <h2 className="rp-card-title">Export Audit Log</h2>
          <p className="rp-export-desc">
            Download the complete audit trail for the selected date range. Includes all ticket changes, user actions, escalations, and SLA events.
          </p>
          <div className="rp-export-row">
            <div className="rp-sub-tabs" style={{ margin: 0 }}>
              {['csv', 'json'].map(f => (
                <button key={f} className={`rp-tab ${exportFormat === f ? 'active' : ''}`} onClick={() => setExportFormat(f)}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="rp-btn rp-btn-gold" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : `↓ Download ${exportFormat.toUpperCase()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
