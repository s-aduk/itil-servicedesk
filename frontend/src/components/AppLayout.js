import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import NotificationBell from './NotificationBell';
import './AppLayout.css';

const NAV = [
  { to:'/dashboard',  label:'Dashboard',      icon:'⬡', end:true  },
  { to:'/tickets',    label:'Tickets',         icon:'◈', end:false },
  { to:'/tickets/new',label:'New Ticket',      icon:'+', end:true  },
  { to:'/knowledge',  label:'Knowledge Base',  icon:'📚', end:false },
  { to:'/analytics',  label:'Analytics',       icon:'◻', end:false },
  { to:'/audit',      label:'Audit Log',       icon:'⬛', end:false },
];
const ROLE_LABELS = { admin:'Administrator', tier1:'Tier-1 Support', tier2:'Tier-2 Engineer', tier3:'Tier-3 Engineer', end_user:'End User' };
const ADMIN_ONLY  = ['/audit'];
const SUPPORT_ONLY= ['/analytics'];

export default function AppLayout({ children }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector(s => s.auth);
  const [collapsed, setCollapsed] = useState(false);

  const visibleNav = NAV.filter(({ to }) => {
    if (ADMIN_ONLY.includes(to)   && !['admin'].includes(user?.role)) return false;
    if (SUPPORT_ONLY.includes(to) && user?.role === 'end_user') return false;
    return true;
  });

  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">SD</span>
          {!collapsed && <span className="logo-text">ServiceDesk</span>}
          {!collapsed && <div className="sidebar-logo-actions"><NotificationBell /></div>}
        </div>
        <nav className="sidebar-nav">
          {visibleNav.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{icon}</span>
              {!collapsed && <span className="nav-label">{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {!collapsed && user && (
            <div className="user-info">
              <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <div className="user-meta">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{ROLE_LABELS[user.role] || user.role}</div>
              </div>
            </div>
          )}
          <button className="btn-collapse" onClick={() => setCollapsed(c => !c)}>{collapsed ? '›' : '‹'}</button>
          <button className="btn-logout" onClick={() => { dispatch(logout()); navigate('/login'); }}>
            <span>↩</span>{!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="content-inner animate-fade">{children}</div>
      </main>
    </div>
  );
}
