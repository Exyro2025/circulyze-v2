import { Link } from 'react-router-dom';
import './Landing.css';

export default function Privacy() {
  return (
    <div className="landing" style={{ padding: '80px 40px', maxWidth: 700, margin: '0 auto' }}>
      <Link to="/" style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--gold)', display: 'block', marginBottom: 48 }}>Circulyze</Link>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 42, fontWeight: 300, marginBottom: 32 }}>Privacy & Terms</h1>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <p>Circulyze is an invite-only professional network. Your data is private, never sold, and protected.</p>
        <p>By joining, you agree to maintain the confidentiality of member information and uphold the standards of this circle.</p>
        <p>We use Firebase for authentication and data storage. Your email is used only for account access and platform communications.</p>
        <p>For questions: <span style={{ color: 'var(--gold)' }}>privacy@circulyze.org</span></p>
      </div>
      <Link to="/" style={{ display: 'inline-block', marginTop: 40, fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', borderBottom: '1px solid var(--border)', paddingBottom: 2 }}>← Back to Home</Link>
    </div>
  );
}
