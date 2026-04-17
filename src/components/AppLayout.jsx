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
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = () => {
    const name = profile?.displayName || user?.displayName || user?.email || 'U';
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
          {(profile?.role === 'admin') && (
            <NavLink to="/admin" className="admin-link">Admin</NavLink>
          )}
          <button className="avatar-btn" onClick={() => navigate('/profile')}>
            {initials()}
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
