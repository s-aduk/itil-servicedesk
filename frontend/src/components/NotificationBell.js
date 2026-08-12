import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markRead, markAllRead } from '../store/notificationSlice';
import './NotificationBell.css';

const TYPE_ICON = {
  sla_warning:     '⚠',
  sla_breach:      '!',
  escalation:      '↑',
  ticket_assigned: '◈',
  status_changed:  '↻',
  note_added:      '✎',
};

export default function NotificationBell() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { list, unreadCount } = useSelector(s => s.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications({ limit:25 }));
    const id = setInterval(() => dispatch(fetchNotifications({ limit:25 })), 30000);
    return () => clearInterval(id);
  }, [dispatch]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleItem = (n) => {
    if (!n.read) dispatch(markRead(n._id));
    if (n.ticketId) { navigate(`/tickets/${n.ticketId}`); setOpen(false); }
  };

  return (
    <div className="nb-wrap" ref={ref}>
      <button className="nb-btn" onClick={() => setOpen(o=>!o)} aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="nb-panel animate-fade">
          <div className="nb-header">
            <span className="nb-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="nb-mark-all" onClick={() => dispatch(markAllRead())}>Mark all read</button>
            )}
          </div>

          <div className="nb-list">
            {list.length === 0 && <div className="nb-empty">No notifications yet</div>}
            {list.map(n => (
              <div
                key={n._id}
                className={`nb-item nb-${n.type} ${!n.read ? 'unread' : ''}`}
                onClick={() => handleItem(n)}
              >
                <span className={`nb-icon nb-icon-${n.type}`}>{TYPE_ICON[n.type] || '●'}</span>
                <div className="nb-body">
                  <div className="nb-item-title">{n.title}</div>
                  <div className="nb-msg">{n.message}</div>
                  <div className="nb-time">{new Date(n.createdAt).toLocaleString('en-GB')}</div>
                </div>
                {!n.read && <span className="nb-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
