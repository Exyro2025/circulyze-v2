import { Link } from 'react-router-dom';
import './Landing.css';

const ENGINES = [
  { icon: '◈', name: 'Collective Mind', desc: 'Ask any question — AI synthesizes answers from the collective expertise of your entire network.' },
  { icon: '◉', name: 'Shadow Board', desc: 'It simulates a board of advisors from real member profiles.' },
  { icon: '◎', name: 'Pulse Check', desc: 'Conduct real-time sentiment polls across elite leaders with AI analysis.' },
  { icon: '◇', name: 'Deal Rooms', desc: 'AI-powered private collaboration spaces with synergy briefings.' },
  { icon: '◆', name: 'Smart Intros', desc: 'AI-curates personalized connection messages.' },
  { icon: '▣', name: 'Influence Score', desc: 'Calculates impact metrics across 4 dimensions.' },
  { icon: '○', name: 'AI Roundtables', desc: 'AI-curated mastermind groups of complementary leaders.' },
];

const STEPS = [
  { n: '01', title: 'Apply or Get Invited', desc: 'Submit your application or receive an exclusive invite code from an existing member.' },
  { n: '02', title: 'Vetting & Review', desc: 'We verify your credentials, company, and leadership impact. Only proven leaders are accepted.' },
  { n: '03', title: 'Enter the Circle', desc: 'AI calibrates your profile against the network and immediately surfaces your highest-value connections.' },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">Circulyze</div>
        <div className="landing-nav">
          <Link to="/login" className="landing-nav-link">Sign In</Link>
          <Link to="/apply" className="landing-nav-btn">Apply</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <span className="hero-eyebrow">✦ INVITE-ONLY NETWORK</span>
        <h1 className="hero-title">Intelligence<br />in Circulation</h1>
        <p className="hero-sub">An exclusive AI-powered strategy engine and social network for the world's most influential business leaders.</p>
        <div className="hero-actions">
          <Link to="/apply" className="hero-btn-primary">Apply for Membership</Link>
          <Link to="/login" className="hero-btn-secondary">Sign In</Link>
        </div>
        <div className="hero-stats">
          <div className="hstat"><span className="hstat-n">7</span><span className="hstat-l">AI ENGINES</span></div>
          <div className="hstat-div" />
          <div className="hstat"><span className="hstat-n">6</span><span className="hstat-l">INDUSTRIES</span></div>
          <div className="hstat-div" />
          <div className="hstat"><span className="hstat-n">100%</span><span className="hstat-l">VETTED</span></div>
        </div>
      </section>

      {/* Quote */}
      <section className="quote-section">
        <blockquote className="landing-quote">
          <em>This is not another social network.<br />This is where decisions are made,<br />alliances are forged,<br />and intelligence compounds.</em>
        </blockquote>
      </section>

      {/* Engines */}
      <section className="engines-section">
        <span className="section-eyebrow">POWERED BY AI</span>
        <h2 className="section-title">Seven Engines of Intelligence</h2>
        <p className="section-sub">Each feature is designed to amplify your network. Not just connect it.</p>
        <div className="engines-grid">
          {ENGINES.map(e => (
            <div key={e.name} className="engine-card">
              <span className="engine-card-icon">{e.icon}</span>
              <div>
                <div className="engine-card-name">{e.name}</div>
                <div className="engine-card-desc">{e.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How to join */}
      <section className="process-section">
        <span className="section-eyebrow">THE PROCESS</span>
        <h2 className="section-title">How You Get In</h2>
        <div className="steps-list">
          {STEPS.map(s => (
            <div key={s.n} className="step">
              <span className="step-num">{s.n}</span>
              <div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Membership */}
      <section className="membership-section">
        <span className="section-eyebrow">MEMBERSHIP</span>
        <h2 className="section-title">Choose Your Circle</h2>
        <div className="tiers-grid">
          <div className="tier-card featured">
            <div className="tier-badge">LIMITED — 50 FOUNDING SPOTS</div>
            <div className="tier-name">Founding Member</div>
            <div className="tier-price">$0 <span>Free forever</span></div>
            <ul className="tier-perks">
              <li>✓ Full access to everything</li>
              <li>✓ Founding badge on profile</li>
              <li>✓ Priority AI features</li>
              <li>✓ Locked in free — always</li>
            </ul>
            <Link to="/apply" className="tier-btn">Claim Founding Spot</Link>
          </div>
          <div className="tier-card">
            <div className="tier-name">Inner Circle</div>
            <div className="tier-price">$99 <span>/month</span></div>
            <ul className="tier-perks">
              <li>✓ Everything in Founding tier</li>
              <li>✓ Priority Collective Mind</li>
              <li>✓ VIP Badge & Featured Profile</li>
              <li>✓ For members joining after founding phase</li>
            </ul>
            <Link to="/apply" className="tier-btn-outline">Apply Now</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <span className="section-eyebrow">JOIN THE WAITLIST</span>
        <h2 className="section-title">Your Circle Awaits</h2>
        <p className="section-sub">Claim the full membership, or join the waitlist to be first in line when we expand.</p>
        <div className="cta-actions">
          <Link to="/apply" className="hero-btn-primary">Apply for Full Membership →</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-logo">Circulyze</div>
        <p className="footer-tag">Intelligence in Circulation</p>
        <div className="footer-links">
          <Link to="/login">Sign In</Link>
          <span>·</span>
          <Link to="/apply">Apply</Link>
          <span>·</span>
          <Link to="/privacy">Privacy & Terms</Link>
        </div>
        <p className="footer-copy">© 2026 Circulyze. All rights reserved.</p>
      </footer>
    </div>
  );
}
