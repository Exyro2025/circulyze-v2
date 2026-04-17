import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const FEATURES = [
  { icon: '◈', name: 'Collective Mind', desc: 'Ask anything. AI synthesizes answers from your network\'s collective expertise and lived experience.' },
  { icon: '◉', name: 'Shadow Board', desc: 'A private AI advisory board that thinks like your most trusted advisors — available at any hour.' },
  { icon: '◎', name: 'Pulse Check', desc: 'Anonymous sentiment analysis across your circle. Know what the room is thinking before you speak.' },
  { icon: '◇', name: 'Deal Rooms', desc: 'Private AI-facilitated collaboration spaces. Synergy briefings. Strategic alignment at speed.' },
  { icon: '◆', name: 'Smart Intros', desc: 'AI identifies high-value connections and writes the introduction. No cold outreach. No awkward asks.' },
  { icon: '○', name: 'Influence Score', desc: 'A living metric of your impact, reach, and authority within the network. Earned, never bought.' },
  { icon: '⬡', name: 'AI Roundtable', desc: 'Curated mastermind groups assembled by AI. Complementary minds. Uncommon conversations.' },
];

const STEPS = [
  { num: '01', title: 'Apply', desc: 'Submit your application. Tell us who you are, what you\'ve built, and what you bring to the circle.' },
  { num: '02', title: 'Vetting & Review', desc: 'Every application is personally reviewed. We are not building a crowd — we are building a circle.' },
  { num: '03', title: 'Enter the Circle', desc: 'Access the full network, all seven AI engines, and leaders who operate at your level.' },
];

const TIERS = [
  {
    name: 'Member',
    price: '$0',
    period: 'Invite Only',
    desc: 'For founding members who shape the culture of Circulyze from the beginning.',
    features: ['Full network access', 'All 7 AI engines', 'Direct messaging', 'Events & Deal Rooms', 'Founding Member badge'],
    cta: 'Apply for Membership',
    highlight: false,
  },
  {
    name: 'Inner Circle',
    price: '$99',
    period: 'per month',
    desc: 'For leaders who want the deepest access, priority placement, and advanced intelligence tools.',
    features: ['Everything in Member', 'Priority AI processing', 'Exclusive Inner Circle events', 'Advanced analytics', 'White-glove onboarding'],
    cta: 'Join Inner Circle',
    highlight: true,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const handleWaitlist = (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistSubmitted(true);
  };

  return (
    <div className="landing">

      {/* NAV */}
      <nav className="land-nav">
        <div className="land-nav-logo">Circulyze</div>
        <div className="land-nav-right">
          <button className="land-nav-link" onClick={() => navigate('/apply')}>Apply</button>
          <button className="land-nav-btn" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="land-hero">
        <div className="hero-bg-grid" />
        <div className="hero-bg-glow" />
        <div className="hero-content">
          <div className="hero-badge">INVITE-ONLY</div>
          <h1 className="hero-headline">
            Intelligence<br />
            <em>in Circulation.</em>
          </h1>
          <p className="hero-sub">
            The private network where the world's most consequential leaders
            think, connect, and decide. Powered by seven engines of AI.
          </p>
          <div className="hero-ctas">
            <button className="btn-gold" onClick={() => navigate('/apply')}>Apply for Membership</button>
            <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In →</button>
          </div>
          <div className="hero-stat-row">
            <div className="hero-stat"><span>7</span><small>AI Features</small></div>
            <div className="hero-stat-div" />
            <div className="hero-stat"><span>18</span><small>Industries</small></div>
            <div className="hero-stat-div" />
            <div className="hero-stat"><span>100%</span><small>Vetted</small></div>
          </div>
        </div>
        <div className="hero-orb" />
      </section>

      {/* MANIFESTO */}
      <section className="land-manifesto">
        <div className="manifesto-line" />
        <blockquote className="manifesto-quote">
          "This is not another social network. This is where decisions are made,
          alliances are forged, and intelligence compounds."
        </blockquote>
        <div className="manifesto-attr">— Australia Lawrence, Founder & CEO</div>
        <div className="manifesto-line" />
      </section>

      {/* 7 AI FEATURES */}
      <section className="land-features">
        <div className="section-eyebrow">POWERED BY AI</div>
        <h2 className="section-title">Seven Engines<br />of Intelligence</h2>
        <p className="section-sub">Each engine is purpose-built for the way consequential leaders actually think and operate.</p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-name">{f.name}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW YOU GET IN */}
      <section className="land-how">
        <div className="section-eyebrow">THE PROCESS</div>
        <h2 className="section-title">How You Get In</h2>
        <div className="steps-row">
          {STEPS.map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-num">{s.num}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="land-pricing">
        <div className="section-eyebrow">MEMBERSHIP</div>
        <h2 className="section-title">Two Tiers.<br />One Standard.</h2>
        <div className="pricing-grid">
          {TIERS.map((t, i) => (
            <div key={i} className={`pricing-card ${t.highlight ? 'pricing-highlight' : ''}`}>
              {t.highlight && <div className="pricing-badge">RECOMMENDED</div>}
              <div className="pricing-name">{t.name}</div>
              <div className="pricing-price">
                <span className="price-amount">{t.price}</span>
                <span className="price-period">{t.period}</span>
              </div>
              <p className="pricing-desc">{t.desc}</p>
              <ul className="pricing-features">
                {t.features.map((f, j) => (
                  <li key={j}><span className="check">◈</span>{f}</li>
                ))}
              </ul>
              <button
                className={t.highlight ? 'btn-gold' : 'btn-outline'}
                onClick={() => navigate('/apply')}
                style={{ width: '100%' }}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* WAITLIST + APPLY */}
      <section className="land-apply">
        <div className="apply-inner">
          <div className="apply-eyebrow">JOIN THE WAITLIST</div>
          <h2 className="apply-title">Your Circle<br />Is Waiting.</h2>
          <p className="apply-sub">
            Enter your email to join the waitlist. When a spot opens,
            you'll be the first to know.
          </p>
          {waitlistSubmitted ? (
            <div className="waitlist-success">
              <span>◈</span> You're on the list. We'll be in touch.
            </div>
          ) : (
            <form className="waitlist-form" onSubmit={handleWaitlist}>
              <input
                className="waitlist-input"
                type="email"
                placeholder="Your email address"
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn-gold">JOIN WAITLIST</button>
            </form>
          )}
          <div className="apply-divider">or</div>
          <button className="btn-outline-full" onClick={() => navigate('/apply')}>
            Apply for Full Membership →
          </button>
          <p className="apply-note">Applications are reviewed within 48 hours. Not everyone is admitted.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="land-footer">
        <div className="footer-logo">Circulyze</div>
        <div className="footer-tagline">Intelligence in Circulation</div>
        <div className="footer-links">
          <button onClick={() => navigate('/apply')}>Apply</button>
          <button onClick={() => navigate('/login')}>Sign In</button>
          <button onClick={() => navigate('/privacy')}>Privacy & Terms</button>
        </div>
        <div className="footer-copy">© 2026 Circulyze · A Vōrai Private Holdings Platform · All Rights Reserved</div>
      </footer>

    </div>
  );
}

