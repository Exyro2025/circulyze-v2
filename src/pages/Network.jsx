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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendConnection = async (targetId, targetName) => {
    setSending(prev => ({ ...prev, [targetId]: true }));
    try {
      await addDoc(collection(db, 'connections'), {
        requester_id: user.uid,
        requester_name: userProfile.full_name,
        requester_title: userProfile.title,
        requester_company: userProfile.company,
        target_id: targetId,
        target_name: targetName,
        status: 'pending',
        created_at: serverTimestamp()
      });
      setConnections(prev => [...prev, { target_id: targetId, status: 'pending' }]);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(prev => ({ ...prev, [targetId]: false }));
    }
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
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingEvent(false);
    }
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
        <button className={`feed-tab ${activeTab === 'connections' ? 'active' : ''}`} onClick={() => setActiveTab('connections')}>
          Connected {accepted.length > 0 && `(${accepted.length})`}
        </button>
        <button className={`feed-tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          Events {events.length > 0 && `(${events.length})`}
        </button>
      </div>

      {loading ? <div className="feed-loading">Loading...</div> : (
        <>
          {activeTab === 'discover' && (
            <>
              <div className="network-filters">
                <input
                  className="filter-search"
                  placeholder="Search by name, company, or title..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
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
                        onClick={() => !status && sendConnection(member.id, member.full_name)}
                        disabled={!!status || sending[member.id]}
                      >
                        {status === 'pending' ? 'PENDING' : status === 'accepted' ? 'CONNECTED' : sending[member.id] ? '...' : 'CONNECT'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

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

          {activeTab === 'events' && (
            <div className="events-section">
              <button className="create-event-btn" onClick={() => setShowCreateEvent(!showCreateEvent)}>
                + CREATE EVENT
              </button>

              {showCreateEvent && (
                <div className="event-form">
                  <h3>Create Event</h3>
                  <div className="form-group">
                    <label className="form-label">TITLE</label>
                    <input className="input-field" value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DATE & TIME</label>
                    <input type="datetime-local" className="input-field" value={eventForm.date} onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))} required style={{ colorScheme: 'dark' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">TYPE</label>
                    <select className="input-field" value={eventForm.type} onChange={e => setEventForm(p => ({ ...p, type: e.target.value }))} style={{ background: '#1a1a1a' }}>
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
                        <div className="event-meta">
                          {formatEventDate(event.date)} · {event.creator_name}
                        </div>
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

