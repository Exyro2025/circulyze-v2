import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/feed');
    } catch (err) {
      setError('Invalid email or password.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Circulyze</div>
        <p className="auth-tagline">Intelligence in Circulation</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Enter Circulyze'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/apply" className="auth-link">Apply for Membership</Link>
          <span className="auth-sep">·</span>
          <Link to="/" className="auth-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
