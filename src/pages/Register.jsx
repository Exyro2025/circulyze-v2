import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const INDUSTRIES = [
  'Technology & AI',
  'Finance & Investment',
  'Private Equity & VC',
  'Healthcare & Biotech',
  'Real Estate & Development',
  'Law & Legal',
  'Energy & Sustainability',
  'Media & Entertainment',
  'Government & Policy',
  'Aerospace & Defense',
  'Sports & Athletics',
  'Luxury & Fashion',
  'Hospitality & Travel',
  'Agriculture & Food',
  'Telecommunications',
  'Consulting',
  'Manufacturing',
  'Other'
];

export default function Register() {
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', title: '',
    company: '', industry: '', bio: '', invite_code: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: 560 }}>
        <div className="auth-logo" onClick={() => navigate('/')}>Circulyze</div>
        <h1 className="auth-title">JOIN THE CIRCLE</h1>
        <div className="gold-divider"></div>
        <p className="auth-subtitle">Enter your invite code to join</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="register-grid">
            <div className="form-group full">
              <label className="form-label">INVITE CODE</label>
              <input type="text" name="invite_code" className="input-field" value={form.invite_code} onChange={handleChange} placeholder="OPTIONAL" />
            </div>
            <div className="form-group full">
              <label className="form-label">FULL NAME</label>
              <input type="text" name="full_name" className="input-field" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">EMAIL</label>
              <input type="email" name="email" className="input-field" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">PASSWORD</label>
              <input type="password" name="password" className="input-field" value={form.password} onChange={handleChange} required minLength={8} />
            </div>
            <div className="form-group">
              <label className="form-label">TITLE</label>
              <input type="text" name="title" className="input-field" value={form.title} onChange={handleChange} required placeholder="CEO, Founder, etc." />
            </div>
            <div className="form-group">
              <label className="form-label">COMPANY</label>
              <input type="text" name="company" className="input-field" value={form.company} onChange={handleChange} required />
            </div>
            <div className="form-group full">
              <label className="form-label">INDUSTRY</label>
              <select name="industry" className="input-field" value={form.industry} onChange={handleChange} required style={{ background: '#1a1a1a', cursor: 'pointer' }}>
                <option value="">Select Your Industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">BIO (OPTIONAL)</label>
              <textarea name="bio" className="input-field" value={form.bio} onChange={handleChange} rows={3} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <p className="register-back" onClick={() => navigate('/login')}>Already a member? Sign In</p>
      </div>
    </div>
  );
}

