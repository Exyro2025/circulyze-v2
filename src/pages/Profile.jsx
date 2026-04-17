import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './Profile.css';

const FOUNDING_LIMIT = 50;

const INDUSTRIES = [
  'Technology & AI', 'Finance & Investment', 'Private Equity & VC',
  'Healthcare & Biotech', 'Real Estate & Development', 'Law & Legal',
  'Energy & Sustainability', 'Media & Entertainment', 'Government & Policy',
  'Aerospace & Defense', 'Sports & Athletics', 'Luxury & Fashion',
  'Hospitality & Travel', 'Agriculture & Food', 'Telecommunications',
  'Consulting', 'Manufacturing', 'Other'
];

function getBadge(userProfile) {
  const tier = userProfile?.subscription_tier;
  const role = userProfile?.role;
  if (role === 'admin' || tier === 'founder') return { label: 'FOUNDER', className: 'badge-founder' };
  if (tier === 'founding' || userProfile?.is_founding_member) return { label: 'FOUNDING MEMBER', className: 'badge-founding' };
  if (tier === 'inner_circle') return { label: 'INNER CIRCLE', className: 'badge-inner' };
  return { label: 'MEMBER', className: 'badge-member' };
}

function getMembershipDesc(userProfile) {
  const tier = userProfile?.subscription_tier;
  const role = userProfile?.role;
  if (role === 'admin' || tier === 'founder') return 'Founder · Free · Permanent';
  if (tier === 'founding' || userProfile?.is_founding_member) return 'Founding Member · $0 forever';
  if (tier === 'inner_circle') return 'Inner Circle · $99/mo';
  return 'Member';
}

export default function Profile() {
  const { user, userProfile, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', title: '', company: '', industry: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [myInviteCodes, setMyInviteCodes] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setForm({
        full_name: userProfile.full_name || '',
        title: userProfile.title || '',
        company: userProfile.company || '',
        industry: userProfile.industry || '',
        bio: userProfile.bio || '',
      });
    }
  }, [userProfile]);

  useEffect(() => { loadInviteData(); }, []);

  const loadInviteData = async () => {
    try {
      const [inviteSnap, memberSnap] = await Promise.all([
        getDocs(query(collection(db, 'invites'), where('created_by_uid', '==', user.uid))),
        getDocs(collection(db, 'users'))
      ]);
      setMyInviteCodes(inviteSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const nonAdmin = memberSnap.docs.filter(d => d.data().role !== 'admin');
      setMemberCount(nonAdmin.length);
    } catch (err) { console.error(err); }
  };

  const generateInviteCode = async () => {
    if (memberCount >= FOUNDING_LIMIT) return;
    setGeneratingCode(true);
    try {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const docRef = await addDoc(collection(db, 'invites'), {
        code, created_by: userProfile.full_name,
        created_by_uid: user.uid, used: false, created_at: serverTimestamp()
      });
      setMyInviteCodes(prev => [...prev, { id: docRef.id, code, used: false }]);
    } catch (err) { console.error(err); }
    finally { setGeneratingCode(false); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { alert('Please use an image under 500KB'); return; }
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await updateProfile({ profile_image: reader.result });
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) { console.error(err); setUploadingPhoto(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await updateProfile(form); setEditing(false); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (!userProfile) return <div className="profile-loading">LOADING...</div>;

  const spotsLeft = Math.max(0, FOUNDING_LIMIT - memberCount);
  const badge = getBadge(userProfile);
  const membershipDesc = getMembershipDesc(userProfile);
  const isFreeForLife = badge.label === 'FOUNDER' || badge.label === 'FOUNDING MEMBER';
  const showUpgrade = !isFreeForLife && userProfile?.subscription_tier !== 'inner_circle';

  return (
    <div className="profile-page">

      {/* HEADER */}
      <div className="profile-header">
        <div className="profile-avatar-large" onClick={() => fileInputRef.current?.click()}>
          {userProfile.profile_image
            ? <img src={userProfile.profile_image} alt="" />
            : <span>{userProfile.full_name?.charAt(0) || 'U'}</span>}
          <div className="avatar-overlay">{uploadingPhoto ? '...' : '📷'}</div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
        <h1 className="profile-name">{userProfile.full_name}</h1>
        <p className="profile-title">{userProfile.title}</p>
        <p className="profile-company">{userProfile.company}</p>
        <div className="profile-tier">
          <span className={`tier-badge ${badge.className}`}>◈ {badge.label}</span>
        </div>
      </div>

      {/* STATS */}
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="stat-val">{userProfile.connection_count || 0}</span>
          <span className="stat-lbl">Connections</span>
        </div>
        <div className="stat-div" />
        <div className="profile-stat">
          <span className="stat-val" style={{ fontSize: userProfile.industry ? '13px' : '28px', fontFamily: 'Montserrat' }}>
            {userProfile.industry || '—'}
          </span>
          <span className="stat-lbl">Industry</span>
        </div>
        <div className="stat-div" />
        <div className="profile-stat">
          <span className="stat-val" style={{ fontSize: '15px', fontFamily: 'Montserrat' }}>
            {userProfile.member_since ? new Date(userProfile.member_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
          </span>
          <span className="stat-lbl">Member Since</span>
        </div>
      </div>

      {/* ABOUT */}
      <div className="profile-section">
        <div className="section-header">
          <h3>About</h3>
          <button className="edit-btn" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        {editing ? (
          <div className="edit-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="input-field" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="input-field" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select className="input-field" value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}>
                <option value="">Select industry...</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="input-field" rows={4} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        ) : (
          <div className="profile-bio-content">
            <p className="bio-text">{userProfile.bio || 'No bio yet.'}</p>
            <div className="profile-meta">
              <div className="meta-item"><span className="meta-icon">✉</span><span>{userProfile.email}</span></div>
              <div className="meta-item"><span className="meta-icon">◈</span>
                <span>Member since {userProfile.member_since ? new Date(userProfile.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MEMBERSHIP */}
      {!editing && (
        <div className="profile-section">
          <h3>Membership</h3>
          <div className="subscription-badge">
            <span className="sub-icon">◈</span>
            <span className="sub-label">{badge.label}</span>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(232,224,208,0.3)', marginTop: '12px', fontFamily: 'Montserrat', fontWeight: 300, lineHeight: 1.7 }}>
            {membershipDesc}
          </p>
          {showUpgrade && (
            <div className="upgrade-card" style={{ marginTop: 24 }}>
              <div className="upgrade-title">Inner Circle</div>
              <div className="upgrade-price">$99<span>/mo</span></div>
              <p className="upgrade-desc">Priority AI processing, exclusive events, advanced analytics, and white-glove onboarding.</p>
              <button className="btn-primary">UPGRADE TO INNER CIRCLE</button>
            </div>
          )}
        </div>
      )}

      {/* INVITE */}
      {!editing && (
        <div className="profile-section">
          <div className="invite-card">
            <div className="invite-header">
              <div>
                <h3>Invite a Leader</h3>
                <p>Share your invite code to bring exceptional leaders into the circle.</p>
              </div>
              <div className="founding-spots">
                <span className="spots-num">{spotsLeft}</span>
                <span className="spots-lbl">Founding spots left</span>
              </div>
            </div>
            {spotsLeft === 0 ? (
              <div className="founding-closed">Founding membership is now closed. Inner Circle memberships available.</div>
            ) : (
              <button className="btn-secondary" style={{ marginTop: 20 }} onClick={generateInviteCode} disabled={generatingCode}>
                {generatingCode ? 'GENERATING...' : 'GENERATE INVITE CODE'}
              </button>
            )}
            {myInviteCodes.length > 0 && (
              <div className="my-codes">
                <div className="codes-label">Your Invite Codes</div>
                {myInviteCodes.map(inv => (
                  <div key={inv.id} className={`code-row ${inv.used ? 'used' : ''}`}>
                    <span className="code-text">{inv.code}</span>
                    <span className={`code-status ${inv.used ? 'used' : 'active'}`}>{inv.used ? 'USED' : 'ACTIVE'}</span>
                    {!inv.used && (
                      <button className="copy-code-btn" onClick={() => copyCode(inv.code)}>
                        {copied === inv.code ? 'COPIED!' : 'COPY'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}





