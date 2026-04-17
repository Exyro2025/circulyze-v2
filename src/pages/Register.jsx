import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        displayName: form.name,
        email: form.email,
        role: 'member',
        tier: 'founding',
        inviteCode: form.code,
        createdAt: Date.now(),
      });
      navigate('/feed');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email already registered.' : 'Registration failed. Please try again.');
    }
    setLoading(false);
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Circulyze</div>
        <p className="auth-tagline">Create Your Account</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Full Name</label>
            <input className="auth-input" type="text" value={form.name} onChange={set('name')} placeholder="Your name" required />
          </div>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" minLength={8} required />
          </div>
          <div className="auth-field">
            <label className="auth-label">Invite Code</label>
            <input className="auth-input" type="text" value={form.code} onChange={set('code')} placeholder="Enter your invite code" />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Join Circulyze'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/login" className="auth-link">Already a member? Sign In</Link>
        </div>
      </div>
    </div>
  );
}
