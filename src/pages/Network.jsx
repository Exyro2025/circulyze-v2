import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Network.css';

const INDUSTRIES = [
  'All Industries', 'Technology & AI', 'Finance & Investment', 'Private Equity & VC',
  'Healthcare & Biotech', 'Real Estate & Development', 'Law & Legal',
  'Energy & Sustainability', 'Media & Entertainment', 'Government & Policy',
  'Aerospace & Defense', 'Sports & Athletics', 'Luxury & Fashion',
  'Hospitality & Travel', 'Agriculture & Food', 'Telecommunications',
  'Consulting', 'Manufacturing', 'Other'
];

export default function Network() {
  const { user, userProfile } = useAuth();
  const [members, setMembers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All Industries');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', location: '', type: 'virtual' });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [smartIntroMsg, setSmartIntroMsg] = useState(null);
  const [aiRecs, setAiRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [memberSnap, connSnap, eventSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'connections'), where('requester_id', '==', user.uid))),
        getDocs(collection(db, 'events')),
      ]);
      setMembers(memberSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.id !== user.uid));
      setConnections(connSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setEvents(eventSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db2 = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return da - db2;
      }));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generateSmartIntro = async (member) => {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Write a brief, warm professional introduction message (2-3 sentences) from ${userProfile?.full_name || 'a member'} (${userProfile?.title || ''} at ${userProfile?.company || ''}) to ${member.full_name} (${member.title || ''} at ${member.company || ''}). Make it specific to their backgrounds and genuine. No subject line, just the message body.`
          }]
        }),
      });
      const data = await res.json();
      return data.content?.[0]?.text || `Hi ${member.full_name}, I came across your profile on Circulyze and would love to connect.`;
    } catch {
      return `Hi ${member.full_name}, I came across your profile on Circulyze and would love to connect.`;
    }
  };

  const sendConnection = async (targetId, targetName, member) => {
    setSending(prev => ({ ...prev, [targetId]: true }));
    setSmartIntroMsg(null);
    try {
      // Generate Smart Intro
      const introMsg = await generateSmartIntro(member);
      setSmartIntroMsg({ memberId: targetId, memberName: targetName, message: introMsg });

      await addDoc(collection(db, 'connections'), {
        requester_id: user.uid,
        requester_name: userProfile.full_name,
        requester_title: userProfile.title,
        requester_company: userProfile.company,
        target_id: targetId,
        target_name: targetName,
        status: 'pending',
        smart_intro: introMsg,
        created_at: serverTimestamp()
      });
      setConnections(prev => [...prev, { target_id: targetId, status: 'pending' }]);
    } catch (err) { console.error(err); }
    finally { setSending(prev => ({ ...prev, [targetId]: false })); }
  };

  const loadAiRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const connectedIds = connections.filter(c => c.status === 'accepted').map(c => c.target_id);
      const pendingIds = connections.map(c => c.target_id);
      const unconnected = members.filter(m => !pendingIds.includes(m.id));

      if (unconnected.length === 0) { setAiRecs([]); setLoadingRecs(false); return; }

      const memberList = unconnected.slice(0, 10).map(m =>
        `- ${m.full_name}, ${m.title || 'Leader'} at ${m.company || 'Unknown'} (${m.industry || 'Various'})`
      ).join('\n');

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `You are the Smart Intros engine for Circulyze. Based on this member's profile:
Name: ${userProfile?.full_name}
Title: ${userProfile?.title}
Company: ${userProfile?.company}
Industry: ${userProfile?.industry}

Recommend the top 3 most valuable connections from this list and explain why in one sentence each:
${memberList}

Format as JSON array: [{"name": "...", "reason": "..."}]`
          }]
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '[]';
      const clean = text.replace(/```json|```/g, '').trim();
      const recs = JSON.parse(clean);
      // Match recs back to member objects
      const recMembers = recs.map(r => {
        const match = unconnected.find(m => m.full_name === r.name);
        return match ? { ...match, reason: r.reason } : null;
      }).filter(Boolean);
      setAiRecs(recMembers);
    } catch (err) { console.error(err); setAiRecs([]); }
    finally { setLoadingRecs(false); }
  };

  const createEvent = async () => {
    if (!eventForm.title || !eventForm.date) return;
    setCreatingEvent(true);
    try {
      await addDoc(collection(db, 'events'), {
        ...eventForm,
        creator_id: user.uid,
        creator_name: userProfile.full_name,
        attendees: [user.uid],
        created_at: serverTimestamp()
      });
      setShowCreateEvent(false);
      setEventForm({ title: '', description: '', date: '', location: '', type: 'virtual' });
      loadData();
    } catch (err) { console.error(err); }
    finally { setCreatingEvent(false); }
  };

  const rsvpEvent = async (eventId, attendees) => {
    const isAttending = attendees?.includes(user.uid);
    await updateDoc(doc(db, 'events', eventId), {
      attendees: isAttending ? attendees.filter(id => id !== user.uid) : arrayUnion(user.uid)
    });
    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e, attendees: isAttending ? e.attendees.filter(id => id !== user.uid) : [...(e.attendees || []), user.uid]
    } : e));
  };

  const getConnectionStatus = (memberId) => connections.find(c => c.target_id === memberId)?.status || null;

  const filteredMembers = members.filter(m => {
    const matchSearch = !searchQuery ||
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchIndustry = industryFilter === 'All Industries' || m.industry === industryFilter;
    return matchSearch && matchIndustry;
  });

  const accepted = connections.filter(c => c.status === 'accepted');
  const pending = connections.filter(c => c.status === 'pending');

  const formatEventDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="network-page">
      <div className="network-header">
        <h1>Network</h1>
        <div className="network-meta">
          <span>{accepted.length} Connections</span>
          <span className="dot">·</span>
          <span>{pending.length} Pending</span>
          <span className="dot">·</span>
          <span>{members.length} Members</span>
        </div>
      </div>

      <div className="network-tabs">
        <button className={`feed-tab ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>Discover</button>
        <button className={`feed-tab ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => { setActiveTab('recommendations'); loadAiRecommendations(); }}>
          AI Recommendations
        </button>
        <button className={`feed-tab ${activeTab === 'connections' ? 'active' : ''}`} onClick={() => setActiveTab('connections')}>
          Connected {accepted.length > 0 && `(${accepted.length})`}
        </button>
        <button className={`feed-tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          Events {events.length > 0 && `(${events.length})`}
        </button>
      </div>

      {/* Smart Intro Toast */}
      {smartIntroMsg && (
        <div className="smart-intro-toast">
          <div className="smart-intro-header">
            <span className="smart-intro-label">◆ Smart Intro Generated</span>
            <button className="smart-intro-close" onClick={() => setSmartIntroMsg(null)}>✕</button>
          </div>
          <div className="smart-intro-name">To {smartIntroMsg.memberName}</div>
          <div className="smart-intro-message">"{smartIntroMsg.message}"</div>
        </div>
      )}

      {loading ? <div className="feed-loading">Loading...</div> : (
        <>
          {/* DISCOVER */}
          {activeTab === 'discover' && (
            <>
              <div className="network-filters">
                <input className="filter-search" placeholder="Search by name, company, or title..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <select className="filter-select" value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="members-grid">
                {filteredMembers.length === 0 ? (
                  <div className="network-empty">No members match your search.</div>
                ) : filteredMembers.map(member => {
                  const status = getConnectionStatus(member.id);
                  return (
                    <div key={member.id} className="member-card">
                      <div className="member-card-avatar">
                        {member.profile_image ? <img src={member.profile_image} alt="" /> : <span>{member.full_name?.charAt(0)}</span>}
                      </div>
                      <div className="member-card-name">{member.full_name}</div>
                      <div className="member-card-title">{member.title}</div>
                      <div className="member-card-company">{member.company}</div>
                      <div className="member-card-industry">{member.industry}</div>
                      {member.bio && <p className="member-card-bio">{member.bio}</p>}
                      <button
                        className={`connect-btn ${status ? 'connected' : ''}`}
                        onClick={() => !status && sendConnection(member.id, member.full_name, member)}
                        disabled={!!status || sending[member.id]}
                      >
                        {sending[member.id] ? 'CONNECTING...' : status === 'pending' ? 'PENDING' : status === 'accepted' ? 'CONNECTED' : 'CONNECT'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* AI RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <div className="ai-recs-section">
              <div className="ai-recs-header">
                <span className="ai-recs-eyebrow">◆ SMART INTROS</span>
                <p className="ai-recs-desc">AI-curated connections based on your profile, industry, and strategic fit.</p>
              </div>
              {loadingRecs ? (
                <div className="feed-loading">Analyzing your network...</div>
              ) : aiRecs.length === 0 ? (
                <div className="network-empty">No recommendations available yet. Add more to your profile for better matches.</div>
              ) : aiRecs.map(member => {
                const status = getConnectionStatus(member.id);
                return (
                  <div key={member.id} className="rec-card">
                    <div className="rec-card-left">
                      <div className="member-card-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
                        {member.profile_image ? <img src={member.profile_image} alt="" /> : <span>{member.full_name?.charAt(0)}</span>}
                      </div>
                      <div>
                        <div className="member-card-name">{member.full_name}</div>
                        <div className="member-card-title">{member.title} {member.company ? `· ${member.company}` : ''}</div>
                        <div className="rec-reason">◈ {member.reason}</div>
                      </div>
                    </div>
                    <button
                      className={`connect-btn ${status ? 'connected' : ''}`}
                      style={{ width: 'auto', padding: '10px 24px' }}
                      onClick={() => !status && sendConnection(member.id, member.full_name, member)}
                      disabled={!!status || sending[member.id]}
                    >
                      {sending[member.id] ? 'CONNECTING...' : status === 'pending' ? 'PENDING' : status === 'accepted' ? 'CONNECTED' : 'CONNECT'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* CONNECTED */}
          {activeTab === 'connections' && (
            <div className="members-grid">
              {accepted.length === 0 ? (
                <div className="network-empty">No connections yet.</div>
              ) : members.filter(m => accepted.find(c => c.target_id === m.id)).map(member => (
                <div key={member.id} className="member-card">
                  <div className="member-card-avatar">
                    {member.profile_image ? <img src={member.profile_image} alt="" /> : <span>{member.full_name?.charAt(0)}</span>}
                  </div>
                  <div className="member-card-name">{member.full_name}</div>
                  <div className="member-card-title">{member.title}</div>
                  <div className="member-card-company">{member.company}</div>
                  <span className="connected-badge">CONNECTED</span>
                </div>
              ))}
            </div>
          )}

          {/* EVENTS */}
          {activeTab === 'events' && (
            <div className="events-section">
              <button className="create-event-btn" onClick={() => setShowCreateEvent(!showCreateEvent)}>+ CREATE EVENT</button>
              {showCreateEvent && (
                <div className="event-form">
                  <h3>Create Event</h3>
                  <div className="form-group">
                    <label className="form-label">TITLE</label>
                    <input className="input-field" value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DATE & TIME</label>
                    <input type="datetime-local" className="input-field" value={eventForm.date} onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))} style={{ colorScheme: 'dark' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">TYPE</label>
                    <select className="input-field" value={eventForm.type} onChange={e => setEventForm(p => ({ ...p, type: e.target.value }))} style={{ background: '#0a0a0a' }}>
                      <option value="virtual">Virtual</option>
                      <option value="in-person">In-Person</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">LOCATION / LINK</label>
                    <input className="input-field" value={eventForm.location} onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DESCRIPTION</label>
                    <textarea className="input-field" rows={3} value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
                  </div>
                  <button className="btn-primary" onClick={createEvent} disabled={creatingEvent}>
                    {creatingEvent ? 'CREATING...' : 'CREATE EVENT'}
                  </button>
                </div>
              )}
              {events.length === 0 ? (
                <div className="network-empty">No events yet. Create the first one!</div>
              ) : events.map(event => {
                const isAttending = event.attendees?.includes(user.uid);
                return (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <div>
                        <div className="event-title">{event.title}</div>
                        <div className="event-meta">{formatEventDate(event.date)} · {event.creator_name}</div>
                      </div>
                      <span className={`event-type ${event.type}`}>{event.type?.toUpperCase()}</span>
                    </div>
                    {event.description && <p className="event-desc">{event.description}</p>}
                    {event.location && <div className="event-location">📍 {event.location}</div>}
                    <div className="event-footer">
                      <span className="event-attendees">{event.attendees?.length || 0} attending</span>
                      <button className={`rsvp-btn ${isAttending ? 'attending' : ''}`} onClick={() => rsvpEvent(event.id, event.attendees)}>
                        {isAttending ? 'ATTENDING ✓' : 'RSVP'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}


