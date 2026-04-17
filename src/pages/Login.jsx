import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/feed');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err) {
      setError('Email not found. Please check and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-logo" onClick={() => navigate('/')}>Circulyze</div>
          <h1 className="auth-title">RESET PASSWORD</h1>
          <div className="gold-divider"></div>
          {resetSent ? (
            <>
              <p className="auth-subtitle" style={{ color: '#C9A84C', marginBottom: 32 }}>
                Reset link sent! Check your email.
              </p>
              <button className="btn-primary" onClick={() => { setShowForgot(false); setResetSent(false); }}>
                BACK TO SIGN IN
              </button>
            </>
          ) : (
            <>
              <p className="auth-subtitle">Enter your email to receive a reset link</p>
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="form-group">
                  <label className="form-label">EMAIL</label>
                  <input type="email" className="input-field" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary" disabled={resetLoading}>
                  {resetLoading ? 'SENDING...' : 'SEND RESET LINK'}
                </button>
              </form>
              <p className="auth-link" onClick={() => setShowForgot(false)}>← Back to Sign In</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo" onClick={() => navigate('/')}>Circulyze</div>
        <div className="auth-brand-circle">CZ</div>
        <h1 className="auth-title">CIRCULYZE</h1>
        <div className="gold-divider"></div>
        <p className="auth-subtitle">Sign in to your exclusive network</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">EMAIL</label>
            <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">PASSWORD</label>
            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>
        <p className="auth-link" onClick={() => setShowForgot(true)}>Forgot Password?</p>
        <div className="auth-divider"><span>NEW TO CIRCULYZE?</span></div>
        <button className="btn-secondary" onClick={() => navigate('/register')}>JOIN WITH INVITE CODE</button>
        <button className="auth-apply" onClick={() => navigate('/apply')}>Apply for Membership →</button>
      </div>
    </div>
  );
}

