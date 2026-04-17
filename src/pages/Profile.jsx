import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    displayName: '',
    title: '',
    company: '',
    bio: '',
    location: '',
    website: '',
    linkedin: '',
    industry: '',
    focus: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  async function loadProfile() {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          displayName: data.displayName || user.displayName || '',
          title: data.title || '',
          company: data.company || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          linkedin: data.linkedin || '',
          industry: data.industry || '',
          focus: data.focus || '',
        });
      } else {
        setProfile(p => ({ ...p, displayName: user.displayName || '' }));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        email: user.email,
        updatedAt: Date.now(),
      }, { merge: true });
      if (profile.displayName) {
        await updateProfile(user, { displayName: profile.displayName });
      }
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  function initials() {
    const name = profile.displayName || user?.email || 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  if (loading) return (
    <div className="profile-loading">
      <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
    </div>
  );

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar-lg">{initials()}</div>
          <div className="profile-header-info">
            <span className="profile-eyebrow">MEMBER PROFILE</span>
            <h1 className="profile-name">{profile.displayName || 'Your Name'}</h1>
            {profile.title && <div className="profile-title-text">{profile.title}</div>}
            {profile.company && <div className="profile-company">{profile.company}</div>}
            <div className="profile-email">{user?.email}</div>
          </div>
          <div className="profile-header-actions">
            {!editing ? (
              <button className="btn-edit" onClick={() => setEditing(true)}>Edit Profile</button>
            ) : (
              <div className="edit-actions">
                <button className="btn-cancel" onClick={() => { setEditing(false); loadProfile(); }}>Cancel</button>
                <button className="btn-save" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
            {saved && <span className="saved-msg">✓ Saved</span>}
          </div>
        </div>

        <div className="profile-body">
          {/* Left column */}
          <div className="profile-main">
            {/* Bio */}
            <div className="profile-section">
              <h3 className="section-label">About</h3>
              {editing ? (
                <textarea
                  className="profile-textarea"
                  placeholder="Your bio — who you are, what you lead, what you're building..."
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  rows={5}
                />
              ) : (
                <p className="profile-bio-text">
                  {profile.bio || <span className="empty-field">Add your bio to tell your story.</span>}
                </p>
              )}
            </div>

            {/* Focus */}
            <div className="profile-section">
              <h3 className="section-label">Current Focus</h3>
              {editing ? (
                <input
                  className="profile-input"
                  placeholder="What are you working on right now?"
                  value={profile.focus}
                  onChange={e => setProfile(p => ({ ...p, focus: e.target.value }))}
                />
              ) : (
                <p className="profile-field-text">
                  {profile.focus || <span className="empty-field">Add your current focus.</span>}
                </p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="profile-sidebar">
            <div className="profile-section">
              <h3 className="section-label">Details</h3>
              <div className="profile-fields">
                <div className="profile-field-row">
                  <span className="field-label">Name</span>
                  {editing ? (
                    <input className="profile-input-sm" value={profile.displayName} onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))} placeholder="Full name" />
                  ) : (
                    <span className="field-value">{profile.displayName || <span className="empty-field">—</span>}</span>
                  )}
                </div>
                <div className="profile-field-row">
                  <span className="field-label">Title</span>
                  {editing ? (
                    <input className="profile-input-sm" value={profile.title} onChange={e => setProfile(p => ({ ...p, title: e.target.value }))} placeholder="CEO, Founder, Managing Director..." />
                  ) : (
                    <span className="field-value">{profile.title || <span className="empty-field">—</span>}</span>
                  )}
                </div>
                <div className="profile-field-row">
                  <span className="field-label">Company</span>
                  {editing ? (
                    <input className="profile-input-sm" value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} placeholder="Company name" />
                  ) : (
                    <span className="field-value">{profile.company || <span className="empty-field">—</span>}</span>
                  )}
                </div>
                <div className="profile-field-row">
                  <span className="field-label">Industry</span>
                  {editing ? (
                    <input className="profile-input-sm" value={profile.industry} onChange={e => setProfile(p => ({ ...p, industry: e.target.value }))} placeholder="Technology, Finance, Healthcare..." />
                  ) : (
                    <span className="field-value">{profile.industry || <span className="empty-field">—</span>}</span>
                  )}
                </div>
                <div className="profile-field-row">
                  <span className="field-label">Location</span>
                  {editing ? (
                    <input className="profile-input-sm" value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} placeholder="City, Country" />
                  ) : (
                    <span className="field-value">{profile.location || <span className="empty-field">—</span>}</span>
                  )}
                </div>
                <div className="profile-field-row">
                  <span className="field-label">Website</span>
                  {editing ? (
                    <input className="profile-input-sm" value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                  ) : (
                    <span className="field-value">
                      {profile.website
                        ? <a href={profile.website} target="_blank" rel="noreferrer" className="field-link">{profile.website}</a>
                        : <span className="empty-field">—</span>}
                    </span>
                  )}
                </div>
                <div className="profile-field-row">
                  <span className="field-label">LinkedIn</span>
                  {editing ? (
                    <input className="profile-input-sm" value={profile.linkedin} onChange={e => setProfile(p => ({ ...p, linkedin: e.target.value }))} placeholder="linkedin.com/in/..." />
                  ) : (
                    <span className="field-value">
                      {profile.linkedin
                        ? <a href={profile.linkedin} target="_blank" rel="noreferrer" className="field-link">{profile.linkedin}</a>
                        : <span className="empty-field">—</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3 className="section-label">Membership</h3>
              <div className="membership-card">
                <span className="membership-tier">Founding Member</span>
                <span className="membership-status">✓ Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
