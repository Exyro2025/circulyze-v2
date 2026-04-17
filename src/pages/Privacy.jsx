import { useNavigate } from 'react-router-dom';
import './Privacy.css';

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="privacy-page">
      <nav className="privacy-nav">
        <span className="privacy-logo" onClick={() => navigate('/')}>Circulyze</span>
        <button className="privacy-back" onClick={() => navigate(-1)}>← Back</button>
      </nav>

      <div className="privacy-body">
        <div className="privacy-eyebrow">LEGAL</div>
        <h1 className="privacy-title">Privacy & Terms</h1>
        <p className="privacy-updated">Last updated: April 2026</p>

        <section className="privacy-section">
          <h2>Privacy Policy</h2>

          <h3>What We Collect</h3>
          <p>We collect information you provide directly: name, email, title, company, industry, bio, and profile photo. We also collect usage data — which features you use and when — to improve the platform.</p>

          <h3>How We Use It</h3>
          <p>Your data is used to operate Circulyze, personalize your experience, and power AI features. We do not sell your data. We do not share it with advertisers.</p>

          <h3>AI Features</h3>
          <p>When you use AI engines (Collective Mind, Shadow Board, etc.), your inputs are processed by Anthropic's API. Inputs are not stored or used to train AI models beyond the scope of your session.</p>

          <h3>Data Sharing</h3>
          <p>Your profile is visible to other verified Circulyze members. Your email is never visible to other members. We share data with service providers only as necessary to operate the platform (Firebase, Anthropic, Stripe).</p>

          <h3>Your Rights</h3>
          <p>You may request deletion of your account and data at any time by contacting us. Upon deletion, your data is removed from active systems within 30 days.</p>

          <h3>Security</h3>
          <p>All data is encrypted in transit and at rest. Access is restricted to authenticated users only. We conduct regular security reviews.</p>

          <h3>Cookies</h3>
          <p>We use session cookies for authentication only. We do not use tracking or advertising cookies.</p>
        </section>

        <div className="privacy-divider" />

        <section className="privacy-section">
          <h2>Terms of Service</h2>

          <h3>Eligibility</h3>
          <p>Circulyze is available by invitation or approved application only. You must be 18 or older and a verified professional to maintain an account.</p>

          <h3>Conduct</h3>
          <p>Members are expected to engage with integrity. Harassment, misrepresentation, solicitation, and spam are grounds for immediate removal. Circulyze reserves the right to remove any member without notice.</p>

          <h3>Content Ownership</h3>
          <p>You own what you post. By posting, you grant Circulyze a limited license to display that content to other members within the platform. We claim no ownership over your intellectual property.</p>

          <h3>Subscriptions</h3>
          <p>Inner Circle subscriptions are billed monthly. You may cancel at any time. No refunds are issued for partial billing periods. Founding Member access is granted for life upon admission.</p>

          <h3>Termination</h3>
          <p>We may suspend or terminate access for violations of these terms, inactivity, or at our discretion. You may close your account at any time.</p>

          <h3>Limitation of Liability</h3>
          <p>Circulyze is provided as-is. We are not liable for business decisions made using AI-generated insights from the platform. AI outputs are advisory only.</p>

          <h3>Governing Law</h3>
          <p>These terms are governed by the laws of the United States. Disputes shall be resolved by binding arbitration.</p>

          <h3>Contact</h3>
          <p>For questions, data requests, or legal matters: <strong>legal@circulyze.org</strong></p>
        </section>

        <div className="privacy-footer-note">
          © 2026 Circulyze · A Vōrai Private Holdings Platform
        </div>
      </div>
    </div>
  );
}
