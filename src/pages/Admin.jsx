import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Admin.css';

export default function Admin() {
  const { userProfile } = useAuth();
  const [tab, setTab] = useState('overview');
  const [members, setMembers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [mSnap, aSnap, pSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'applications'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'posts'), orderBy('created_at', 'desc'))),
      ]);
      setMembers(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setApplications(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPosts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function approveApp(id) {
    await updateDoc(doc(db, 'applications', id), { status: 'approved' });
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
  }

  async function rejectApp(id) {
    await updateDoc(doc(db, 'applications', id), { status: 'rejected' });
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
  }

  async function deletePost(id) {
    await deleteDoc(doc(db, 'posts', id));
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  async function updateRole(memberId, role) {
    await updateDoc(doc(db, 'users', memberId), { role });
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  }

  if (userProfile?.role !== 'admin') return (
    <div className="admin-denied">
      <p>Access restricted to administrators.</p>
    </div>
  );

  const stats = [
    { label: 'Total Members', value: members.length },
    { label: 'Applications', value: applications.length },
    { label: 'Pending', value: applications.filter(a => !a.status || a.status === 'pending').length },
    { label: 'Total Posts', value: posts.length },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <span className="admin-eyebrow">ADMINISTRATION</span>
        <h1 className="admin-title">Admin Dashboard</h1>
      </div>

      <div className="admin-tabs">
        {['overview', 'members', 'applications', 'content'].map(t => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="admin-loading">Loading...</div> : (
        <>
          {tab === 'overview' && (
            <div className="overview-grid">
              {stats.map(s => (
                <div key={s.label} className="stat-card">
                  <span className="stat-num">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
              <div className="recent-section">
                <h3 className="section-heading">Recent Applications</h3>
                {applications.slice(0, 5).map(a => (
                  <div key={a.id} className="recent-row">
                    <span className="recent-name">{a.name || a.email}</span>
                    <span className={`status-pill ${a.status || 'pending'}`}>{a.status || 'Pending'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'members' && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Role</th><th>Tier</th><th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td>{m.full_name || '—'}</td>
                      <td className="td-dim">{m.email}</td>
                      <td>
                        <select
                          className="role-select"
                          value={m.role || 'member'}
                          onChange={e => updateRole(m.id, e.target.value)}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="td-dim">{m.subscription_tier || 'founding'}</td>
                      <td className="td-dim">{m.member_since ? new Date(m.member_since).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'applications' && (
            <div className="applications-list">
              {applications.map(a => (
                <div key={a.id} className="app-card">
                  <div className="app-card-header">
                    <div>
                      <div className="app-name">{a.name || 'Anonymous'}</div>
                      <div className="app-email">{a.email}</div>
                    </div>
                    <span className={`status-pill ${a.status || 'pending'}`}>{a.status || 'Pending'}</span>
                  </div>
                  {a.why && <p className="app-answer"><strong>Why Circulyze:</strong> {a.why}</p>}
                  {a.company && <p className="app-answer"><strong>Company:</strong> {a.company}</p>}
                  {a.title && <p className="app-answer"><strong>Title:</strong> {a.title}</p>}
                  {(!a.status || a.status === 'pending') && (
                    <div className="app-actions">
                      <button className="btn-approve" onClick={() => approveApp(a.id)}>Approve</button>
                      <button className="btn-reject" onClick={() => rejectApp(a.id)}>Decline</button>
                    </div>
                  )}
                </div>
              ))}
              {applications.length === 0 && <p className="admin-empty">No applications yet.</p>}
            </div>
          )}

          {tab === 'content' && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Author</th><th>Post</th><th>Likes</th><th>Date</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {posts.map(p => (
                    <tr key={p.id}>
                      <td>{p.author_name || '—'}</td>
                      <td className="td-preview">{p.content?.slice(0, 80)}...</td>
                      <td className="td-dim">{p.likes?.length || 0}</td>
                      <td className="td-dim">{p.created_at?.toDate?.()?.toLocaleDateString() || '—'}</td>
                      <td>
                        <button className="btn-delete-sm" onClick={() => deletePost(p.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {posts.length === 0 && <p className="admin-empty">No posts yet.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
