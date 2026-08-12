import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMe } from './store/authSlice';

import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import TicketsPage      from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import NewTicketPage    from './pages/NewTicketPage';
import KnowledgePage    from './pages/KnowledgePage';
import ArticlePage      from './pages/ArticlePage';
import NewArticlePage   from './pages/NewArticlePage';
import AnalyticsPage    from './pages/AnalyticsPage';
import AuditPage        from './pages/AuditPage';
import ReportsPage     from './pages/ReportsPage';
import AppLayout        from './components/AppLayout';

const PrivateRoute = ({ children }) => {
  const { token } = useSelector(s => s.auth);
  return token ? children : <Navigate to="/login" replace />;
};
const PublicRoute = ({ children }) => {
  const { token } = useSelector(s => s.auth);
  return token ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector(s => s.auth);
  useEffect(() => { if (token) dispatch(fetchMe()); }, [dispatch, token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"   element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/*" element={
          <PrivateRoute>
            <AppLayout>
              <Routes>
                <Route path="dashboard"       element={<DashboardPage />} />
                <Route path="tickets"         element={<TicketsPage />} />
                <Route path="tickets/new"     element={<NewTicketPage />} />
                <Route path="tickets/:id"     element={<TicketDetailPage />} />
                <Route path="knowledge"       element={<KnowledgePage />} />
                <Route path="knowledge/new"   element={<NewArticlePage />} />
                <Route path="knowledge/:id"   element={<ArticlePage />} />
                <Route path="analytics"       element={<AnalyticsPage />} />
                <Route path="audit"           element={<AuditPage />} />
                <Route path="reports"         element={<ReportsPage />} />
                <Route path="*"              element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
