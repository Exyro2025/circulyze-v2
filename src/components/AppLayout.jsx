import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AppLayout.css';

const NAV = [
  { to: '/feed', icon: '◈', label: 'FEED' },
  { to: '/network', icon: '◉', label: 'NETWORK' },
  { to: '/insights', icon: '◇', label: 'INSIGHTS' },
  { to: '/messages', icon: '▣', label: 'MESSAGES' },
  { to: '/profile', icon: '○', label: 'PROFILE' },
];

export default function AppLayout({ children }) {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = () => {
    const name = userProfile?.full_name || user?.displayName || user?.email || 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <NavLink to="/feed" className="app-logo">Circulyze</NavLink>
        <div className="app-header-right">
          {userProfile?.role === 'admin' && (
            <NavLink to="/admin" className="admin-link">Admin</NavLink>
          )}
          <button className="avatar-btn" onClick={() => navigate('/profile')}>
            {userProfile?.profile_image ? (
              <img src={userProfile.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              initials()
            )}
          </button>
        </div>
      </header>

      <main className="app-main">
        {children}
      </main>

      <nav className="app-nav">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

