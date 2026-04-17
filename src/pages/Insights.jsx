import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Insights.css';

const ENGINES = [
  { id: 'collective', icon: '◈', label: 'Collective Mind', desc: 'Synthesizes your network\'s collective expertise' },
  { id: 'shadow', icon: '◉', label: 'Shadow Board', desc: 'Simulates a board of advisors from member profiles' },
  { id: 'pulse', icon: '◎', label: 'Pulse Check', desc: 'Real-time sentiment analysis across your circle' },
  { id: 'deal', icon: '◇', label: 'Deal Rooms', desc: 'Private AI collaboration with synergy briefings' },
  { id: 'intros', icon: '◆', label: 'Smart Intros', desc: 'AI-curated connection recommendations' },
  { id: 'roundtable', icon: '○', label: 'AI Roundtable', desc: 'Curated mastermind of complementary leaders' },
];

export default function Insights() {
  const { user } = useAuth();
  const [activeEngine, setActiveEngine] = useState('collective');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const engine = ENGINES.find(e => e.id === activeEngine);

  const SYSTEM_PROMPTS = {
    collective: `You are the Collective Mind engine for Circulyze — an exclusive AI-powered intelligence network for the world's most consequential business leaders. You synthesize insights from the collective expertise of elite CEO-level members. Respond with depth, precision, and strategic intelligence. Be concise but profound. Use refined language appropriate for C-suite leaders.`,
    shadow: `You are the Shadow Board engine for Circulyze. You simulate a board of seasoned advisors — think former Fortune 500 CEOs, elite investors, and strategic operators. Offer multi-perspective counsel as if from 3-4 distinct board members with different viewpoints. Be direct, contrarian where warranted, and strategically rigorous.`,
    pulse: `You are the Pulse Check engine for Circulyze. You analyze sentiment, trends, and signals across elite business networks. Provide real-time intelligence on market sentiment, leadership trends, and what top executives are focused on. Be data-informed, insightful, and forward-looking.`,
    deal: `You are the Deal Room AI for Circulyze. You facilitate private, high-stakes strategic collaboration. Analyze deals, partnerships, and strategic opportunities with the precision of a top-tier investment banker and strategic advisor. Focus on value creation, risk assessment, and synergy identification.`,
    intros: `You are the Smart Intros engine for Circulyze. You identify high-value connection opportunities between members based on complementary strengths, shared objectives, and strategic fit. Explain why specific connections would create mutual value with precision and specificity.`,
    roundtable: `You are the AI Roundtable facilitator for Circulyze. You curate and moderate mastermind-style discussions between complementary leaders. Synthesize diverse perspectives, challenge assumptions, and surface non-obvious insights. Think like a world-class facilitator who draws out the best thinking from elite minds.`,
  };

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', text: input.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    history.push({ role: 'user', content: userMsg.text });

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: SYSTEM_PROMPTS[activeEngine],
          messages: history,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || 'Intelligence unavailable. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection interrupted. Please try again.', ts: Date.now() }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function switchEngine(id) {
    setActiveEngine(id);
    setMessages([]);
  }

  return (
    <div className="insights-page">
      {/* Left: Engine selector */}
      <div className="engines-panel">
        <div className="engines-header">
          <span className="engines-eyebrow">POWERED BY AI</span>
          <h2 className="engines-title">Seven Engines<br />of Intelligence</h2>
        </div>
        <div className="engines-list">
          {ENGINES.map(e => (
            <button
              key={e.id}
              className={`engine-btn ${activeEngine === e.id ? 'active' : ''}`}
              onClick={() => switchEngine(e.id)}
            >
              <span className="engine-icon">{e.icon}</span>
              <div className="engine-info">
                <span className="engine-label">{e.label}</span>
                <span className="engine-desc">{e.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Chat interface */}
      <div className="insights-chat">
        <div className="insights-chat-header">
          <span className="active-engine-icon">{engine.icon}</span>
          <div>
            <div className="active-engine-name">{engine.label}</div>
            <div className="active-engine-desc">{engine.desc}</div>
          </div>
        </div>

        <div className="insights-messages">
          {messages.length === 0 && (
            <div className="insights-welcome">
              <div className="welcome-engine-icon">{engine.icon}</div>
              <h3>{engine.label}</h3>
              <p>{engine.desc}</p>
              <div className="welcome-prompts">
                {getStarterPrompts(activeEngine).map((p, i) => (
                  <button key={i} className="starter-prompt" onClick={() => { setInput(p); }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`insight-msg ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="ai-avatar">{engine.icon}</div>
              )}
              <div className="insight-bubble">
                <div className="insight-text">{msg.text}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="insight-msg assistant">
              <div className="ai-avatar">{engine.icon}</div>
              <div className="insight-bubble">
                <div className="thinking">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="insights-input-area">
          <textarea
            className="insights-input"
            placeholder={`Ask the ${engine.label}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button className="insights-send" onClick={sendMessage} disabled={!input.trim() || loading}>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function getStarterPrompts(engineId) {
  const prompts = {
    collective: [
      'What are the top strategic priorities CEOs are focused on right now?',
      'How should I think about expanding into a new market?',
      'What growth levers are most effective for scaling a service business?',
    ],
    shadow: [
      'Review my go-to-market strategy and challenge the assumptions',
      'What would a skeptical board member say about my current pricing model?',
      'Advise me on whether to raise capital or stay bootstrapped',
    ],
    pulse: [
      'What trends are shaping executive leadership in 2026?',
      'What is the sentiment around AI adoption at the C-suite level?',
      'Where is elite investor attention focused right now?',
    ],
    deal: [
      'Analyze the key risks in a strategic partnership structure',
      'What makes a deal term sheet favorable for the acquirer?',
      'How should I structure an equity-for-advisory arrangement?',
    ],
    intros: [
      'Who in my network would benefit from a connection with a fintech operator?',
      'What type of advisor would most accelerate my current stage?',
      'How do I approach a cold introduction to a strategic partner?',
    ],
    roundtable: [
      'Facilitate a discussion on scaling without losing company culture',
      'What do elite operators say about the right time to hire a COO?',
      'Explore different views on remote vs in-person team dynamics',
    ],
  };
  return prompts[engineId] || [];
}
