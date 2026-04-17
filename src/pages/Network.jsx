import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Network.css';

export default function Network() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingOut, setPendingOut] = useState([]);
  const [pendingIn, setPendingIn] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    try {
      // All members except self
      const snap = await getDocs(collection(db, 'users'));
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.id !== user.uid);
      setMembers(all);

      // Connections where current user is involved
      const connSnap = await getDocs(query(collection(db, 'connections'), where('status', '==', 'connected')));
      const myConns = connSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.from === user.uid || c.to === user.uid)
        .map(c => c.from === user.uid ? c.to : c.from);
      setConnections(myConns);

      // Pending outgoing
      const outSnap = await getDocs(query(collection(db, 'connections'), where('from', '==', user.uid), where('status', '==', 'pending')));
      setPendingOut(outSnap.docs.map(d => d.data().to));

      // Pending incoming
      const inSnap = await getDocs(query(collection(db, 'connections'), where('to', '==', user.uid), where('status', '==', 'pending')));
      setPendingIn(inSnap.docs.map(d => ({ id: d.id, from: d.data().from })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function connect(toId) {
    const id = [user.uid, toId].sort().join('_');
    await setDoc(doc(db, 'connections', id), {
      from: user.uid, to: toId, status: 'pending', createdAt: Date.now()
    });
    setPendingOut(prev => [...prev, toId]);
  }

  async function accept(connId, fromId) {
    await setDoc(doc(db, 'connections', connId), { status: 'connected' }, { merge: true });
    setConnections(prev => [...prev, fromId]);
    setPendingIn(prev => prev.filter(p => p.id !== connId));
  }

  async function decline(connId) {
    await deleteDoc(doc(db, 'connections', connId));
    setPendingIn(prev => prev.filter(p => p.id !== connId));
  }

  const filtered = members.filter(m =>
    (m.displayName || m.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const connectedMembers = members.filter(m => connections.includes(m.id));
  const pendingInMembers = pendingIn.map(p => ({ ...members.find(m => m.id === p.from), connId: p.id })).filter(Boolean);

  function getStatus(memberId) {
    if (connections.includes(memberId)) return 'connected';
    if (pendingOut.includes(memberId)) return 'pending';
    return 'none';
  }

  const initials = (m) => {
    const name = m.displayName || m.email || 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="network-page">
      <div className="network-header">
        <div className="network-title-block">
          <span className="network-eyebrow">YOUR CIRCLE</span>
          <h1 className="network-title">Network</h1>
          <p className="network-subtitle">Connect with the world's most consequential leaders.</p>
        </div>
        <div className="network-stats">
          <div className="nstat">
            <span className="nstat-num">{connections.length}</span>
            <span className="nstat-label">Connected</span>
          </div>
          <div className="nstat-divider" />
          <div className="nstat">
            <span className="nstat-num">{members.length}</span>
            <span className="nstat-label">Members</span>
          </div>
        </div>
      </div>

      {pendingInMembers.length > 0 && (
        <div className="pending-requests">
          <h3 className="pending-title">Pending Requests <span className="pending-badge">{pendingInMembers.length}</span></h3>
          <div className="pending-list">
            {pendingInMembers.map(m => (
              <div key={m.connId} className="pending-card">
                <div className="member-avatar-sm">{initials(m)}</div>
                <div className="pending-info">
                  <span className="pending-name">{m.displayName || m.email}</span>
                  {m.title && <span className="pending-title-text">{m.title}</span>}
                </div>
                <div className="pending-actions">
                  <button className="btn-accept" onClick={() => accept(m.connId, m.id)}>Accept</button>
                  <button className="btn-decline" onClick={() => decline(m.connId)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="network-tabs">
        {['discover', 'connected'].map(tab => (
          <button
            key={tab}
            className={`ntab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'discover' ? 'Discover' : `Connected (${connections.length})`}
          </button>
        ))}
      </div>

      <div className="network-search-wrap">
        <input
          className="network-search"
          placeholder="Search by name or title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="network-loading">
          <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
        </div>
      ) : (
        <div className="members-grid">
          {(activeTab === 'discover' ? filtered : connectedMembers.filter(m =>
            (m.displayName || m.email || '').toLowerCase().includes(search.toLowerCase())
          )).map(member => {
            const status = getStatus(member.id);
            return (
              <div key={member.id} className="member-card">
                <div className="member-card-top">
                  <div className="member-avatar">{initials(member)}</div>
                  {member.role === 'admin' && <span className="member-badge">Admin</span>}
                  {member.tier === 'inner_circle' && <span className="member-badge gold">Inner Circle</span>}
                </div>
                <div className="member-name">{member.displayName || member.email?.split('@')[0]}</div>
                {member.title && <div className="member-title">{member.title}</div>}
                {member.company && <div className="member-company">{member.company}</div>}
                {member.bio && <p className="member-bio">{member.bio.slice(0, 100)}{member.bio.length > 100 ? '...' : ''}</p>}
                <div className="member-card-footer">
                  {status === 'connected' && (
                    <span className="conn-status connected">✓ Connected</span>
                  )}
                  {status === 'pending' && (
                    <span className="conn-status pending">Request Sent</span>
                  )}
                  {status === 'none' && (
                    <button className="btn-connect" onClick={() => connect(member.id)}>
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {(activeTab === 'discover' ? filtered : connectedMembers).length === 0 && (
            <div className="network-empty">
              <div className="empty-icon">◈</div>
              <p>{activeTab === 'discover' ? 'No members found.' : 'No connections yet. Start connecting.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
