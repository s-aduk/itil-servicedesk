import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../store/authSlice';
import './AuthPage.css';

const ROLES = [
  { value: 'end_user', label: 'End User (Banking Staff)' },
  { value: 'tier1', label: 'Tier-1 Support' },
  { value: 'tier2', label: 'Tier-2 Engineer' },
  { value: 'tier3', label: 'Tier-3 Engineer' },
  { value: 'admin', label: 'Administrator' },
];

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'end_user', department: '' });

  useEffect(() => { return () => dispatch(clearError()); }, [dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser(form));
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
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-desc">Register for service desk access</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Stephen Adu Kwarteng" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@gcbbank.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="e.g. IT Operations" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
