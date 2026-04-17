import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './Auth.css';

const INDUSTRIES = [
  'Technology & AI', 'Finance & Investment', 'Private Equity & VC',
  'Healthcare & Biotech', 'Real Estate & Development', 'Law & Legal',
  'Energy & Sustainability', 'Media & Entertainment', 'Government & Policy',
  'Aerospace & Defense', 'Sports & Athletics', 'Luxury & Fashion',
  'Hospitality & Travel', 'Agriculture & Food', 'Telecommunications',
  'Consulting', 'Manufacturing', 'Other'
];

export default function Apply() {
  const [form, setForm] = useState({ full_name: '', email: '', title: '', company: '', industry: '', linkedin_url: '', reason: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'applications'), { ...form, status: 'pending', created_at: serverTimestamp() });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-logo" onClick={() => navigate('/')}>Circulyze</div>
          <div className="auth-brand-circle">✓</div>
          <h1 className="auth-title">APPLICATION RECEIVED</h1>
          <div className="gold-divider"></div>
          <p className="auth-subtitle" style={{ marginBottom: 32 }}>Our team will review your application within 5-7 business days.</p>
          <button className="btn-secondary" onClick={() => navigate('/')}>RETURN HOME</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: 560 }}>
        <div className="auth-logo" onClick={() => navigate('/')}>Circulyze</div>
        <h1 className="auth-title">APPLY FOR MEMBERSHIP</h1>
        <div className="gold-divider"></div>
        <p className="auth-subtitle">Tell us about yourself</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="register-grid">
            <div className="form-group full">
              <label className="form-label">FULL NAME</label>
              <input type="text" name="full_name" className="input-field" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">EMAIL</label>
              <input type="email" name="email" className="input-field" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">TITLE</label>
              <input type="text" name="title" className="input-field" value={form.title} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">COMPANY</label>
              <input type="text" name="company" className="input-field" value={form.company} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">INDUSTRY</label>
              <select name="industry" className="input-field" value={form.industry} onChange={handleChange} required style={{ background: '#1a1a1a', cursor: 'pointer' }}>
                <option value="">Select Industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">LINKEDIN URL (OPTIONAL)</label>
              <input type="url" name="linkedin_url" className="input-field" value={form.linkedin_url} onChange={handleChange} />
            </div>
            <div className="form-group full">
              <label className="form-label">WHY DO YOU WANT TO JOIN?</label>
              <textarea name="reason" className="input-field" value={form.reason} onChange={handleChange} required rows={4} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
          </button>
        </form>
        <p className="register-back" onClick={() => navigate('/')}>← Back to Home</p>
      </div>
    </div>
  );
}

