import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/authSlice';
import './AuthPage.css';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => { return () => dispatch(clearError()); }, [dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (!result.error) navigate('/dashboard');
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-logo">SD</div>
        <h1 className="auth-brand-name">ServiceDesk</h1>
        <p className="auth-brand-tagline">ITIL-Aligned Operations Platform</p>
        <div className="auth-brand-features">
          <div className="auth-feature">◈ ITIL 4 Incident Lifecycle</div>
          <div className="auth-feature">⬡ Priority-Based Routing</div>
          <div className="auth-feature">⬛ Immutable Audit Ledger</div>
          <div className="auth-feature">◻ Role-Based Access Control</div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card animate-fade">
          <div className="auth-header">
            <h2 className="auth-title">Sign In</h2>
            <p className="auth-desc">Access your service desk</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@gcbbank.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            No account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
