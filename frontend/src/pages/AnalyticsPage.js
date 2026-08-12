import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../store/analyticsSlice';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import './AnalyticsPage.css';

const PRIORITY_COLORS = { critical:'#ff4d6a', high:'#ffb547', medium:'#4ea8de', low:'#3ddc97' };
const STATUS_COLORS   = { open:'#ffb547', in_progress:'#4ea8de', pending:'#7b8db0', resolved:'#3ddc97', closed:'#4a5568' };
const CAT_SHORT = { access_management:'Access', service_interruption:'Service Int.', hardware_software:'HW/SW', data_integrity:'Data', general_inquiry:'General' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0e1424', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'10px 14px' }}>
      <p style={{ color:'#7b8db0', fontSize:'0.72rem', marginBottom:4, fontFamily:'DM Mono' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#00e5c4', fontSize:'0.82rem', margin:'2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector(s => s.analytics);
  const [exporting, setExporting] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  useEffect(() => {
    dispatch(fetchAnalytics({ from: dateFrom, to: dateTo }));
  }, [dispatch, dateFrom, dateTo]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/analytics/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `servicedesk-export-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch(e) { console.error(e); }
    setExporting(false);
  };

  if (loading && !data) return <div className="loading-state"><span className="spinner" /></div>;
  if (!data)   return null;

  const { summary, byStatus, byPriority, byCategory, dailyVolume, mttr, sla } = data;

  const priorityChartData = byPriority.map(x => ({ name: x.priority, value: x.count, fill: PRIORITY_COLORS[x.priority] || '#7b8db0' }));
  const statusChartData   = byStatus.map(x   => ({ name: x.status.replace('_',' '), value: x.count, fill: STATUS_COLORS[x.status] || '#7b8db0' }));
  const categoryChartData = byCategory.map(x  => ({ name: CAT_SHORT[x.category] || x.category, value: x.count }));
  const mttrChartData     = mttr.map(x => ({ priority: x.priority, minutes: x.avgMinutes, tickets: x.count })).sort((a,b) => { const o=['critical','high','medium','low']; return o.indexOf(a.priority)-o.indexOf(b.priority); });

  return (
    <div className="analytics-page">
      <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Operational metrics, SLA compliance, and MTTR tracking</p>
        </div>
        <div className="analytics-controls">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="date-input" placeholder="From" />
          <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="date-input" placeholder="To" />
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? <><span className="spinner" /> Exporting…</> : '↓ Export CSV'}
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid">
        {[
          { label:'Total Tickets',    value: summary.total,                  color:'info'    },
          { label:'Open',             value: summary.open,                   color:'warning' },
          { label:'Resolved',         value: summary.resolved,               color:'success' },
          { label:'SLA Compliance',   value: summary.slaCompliancePercent != null ? `${summary.slaCompliancePercent}%` : '—', color: summary.slaCompliancePercent >= 80 ? 'success' : 'danger' },
          { label:'SLA Breaches',     value: summary.slaBreachedCount,       color:'danger'  },
          { label:'Escalations',      value: summary.escalationCount,        color:'info'    },
        ].map(({ label, value, color }) => (
          <div key={label} className={`kpi-card kpi-${color}`}>
            <div className="kpi-value">{value ?? '—'}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      {/* SLA compliance bar */}
      {sla.total > 0 && (
        <div className="card sla-compliance-card">
          <div className="sla-comp-header">
            <span className="sla-comp-title">SLA Compliance</span>
            <span className="sla-comp-pct" style={{ color: sla.compliancePercent >= 80 ? 'var(--success)' : 'var(--danger)' }}>
              {sla.compliancePercent}% ({sla.met}/{sla.total} tickets met SLA)
            </span>
          </div>
          <div className="sla-comp-track">
            <div className="sla-comp-fill"
              style={{ width:`${sla.compliancePercent}%`, background: sla.compliancePercent >= 80 ? 'var(--success)' : sla.compliancePercent >= 60 ? 'var(--warning)' : 'var(--danger)' }} />
          </div>
        </div>
      )}

      {/* Charts row 1 */}
      <div className="charts-row">
        {/* Daily volume */}
        <div className="card chart-card chart-wide">
          <h3 className="chart-title">Daily Ticket Volume (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyVolume} margin={{ top:5, right:10, bottom:5, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill:'#4a5568', fontSize:10, fontFamily:'DM Mono' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill:'#4a5568', fontSize:10, fontFamily:'DM Mono' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Tickets" stroke="#00e5c4" strokeWidth={2} dot={false} activeDot={{ r:4, fill:'#00e5c4' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* By priority pie */}
        <div className="card chart-card">
          <h3 className="chart-title">By Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={priorityChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                {priorityChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:'0.75rem', color:'#7b8db0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="charts-row">
        {/* By status */}
        <div className="card chart-card">
          <h3 className="chart-title">By Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusChartData} margin={{ top:5, right:10, bottom:5, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill:'#4a5568', fontSize:10, fontFamily:'DM Mono' }} />
              <YAxis tick={{ fill:'#4a5568', fontSize:10, fontFamily:'DM Mono' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>
                {statusChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By category */}
        <div className="card chart-card">
          <h3 className="chart-title">By Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryChartData} margin={{ top:5, right:10, bottom:5, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill:'#4a5568', fontSize:10, fontFamily:'DM Mono' }} />
              <YAxis tick={{ fill:'#4a5568', fontSize:10, fontFamily:'DM Mono' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" fill="#4ea8de" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MTTR */}
        <div className="card chart-card">
          <h3 className="chart-title">Avg MTTR by Priority (minutes)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mttrChartData} margin={{ top:5, right:10, bottom:5, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="priority" tick={{ fill:'#4a5568', fontSize:10, fontFamily:'DM Mono' }} />
              <YAxis tick={{ fill:'#4a5568', fontSize:10, fontFamily:'DM Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="minutes" name="Avg MTTR (min)" radius={[4,4,0,0]}>
                {mttrChartData.map((e, i) => <Cell key={i} fill={PRIORITY_COLORS[e.priority] || '#7b8db0'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
