import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import './Apply.css';

export default function Apply() {
  const [form, setForm] = useState({ name: '', email: '', title: '', company: '', why: '', linkedin: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'applications'), { ...form, status: 'pending', createdAt: Date.now() });
      setSubmitted(true);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  if (submitted) return (
    <div className="apply-page">
      <div className="apply-success">
        <div className="success-icon">◈</div>
        <h2>Application Received</h2>
        <p>We review every application personally. You'll hear from us within 48 hours.</p>
        <Link to="/" className="back-link">Return to Circulyze</Link>
      </div>
    </div>
  );

  return (
    <div className="apply-page">
      <div className="apply-container">
        <Link to="/" className="apply-logo">Circulyze</Link>
        <div className="apply-header">
          <span className="apply-eyebrow">INVITE-ONLY NETWORK</span>
          <h1 className="apply-title">Apply for Membership</h1>
          <p className="apply-subtitle">Every application is reviewed by a human. Only proven leaders are accepted.</p>
        </div>
        <form className="apply-form" onSubmit={handleSubmit}>
          <div className="apply-row">
            <div className="apply-field">
              <label className="apply-label">Full Name</label>
              <input className="apply-input" value={form.name} onChange={set('name')} placeholder="Your full name" required />
            </div>
            <div className="apply-field">
              <label className="apply-label">Email</label>
              <input className="apply-input" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required />
            </div>
          </div>
          <div className="apply-row">
            <div className="apply-field">
              <label className="apply-label">Title</label>
              <input className="apply-input" value={form.title} onChange={set('title')} placeholder="CEO, Founder, Managing Director..." required />
            </div>
            <div className="apply-field">
              <label className="apply-label">Company</label>
              <input className="apply-input" value={form.company} onChange={set('company')} placeholder="Company name" required />
            </div>
          </div>
          <div className="apply-field">
            <label className="apply-label">LinkedIn Profile</label>
            <input className="apply-input" value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/..." />
          </div>
          <div className="apply-field">
            <label className="apply-label">Why Circulyze?</label>
            <textarea className="apply-textarea" value={form.why} onChange={set('why')} placeholder="Tell us about your vision, what you're building, and what you'd contribute to this circle..." rows={5} required />
          </div>
          <button className="apply-btn" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application →'}
          </button>
        </form>
        <div className="apply-footer">
          <Link to="/login" className="apply-link">Already a member? Sign In</Link>
        </div>
      </div>
    </div>
  );
}
