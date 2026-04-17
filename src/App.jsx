import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Apply from './pages/Apply';
import Privacy from './pages/Privacy';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Network from './pages/Network';
import Messages from './pages/Messages';
import Insights from './pages/Insights';
import Admin from './pages/Admin';
import AppLayout from './components/AppLayout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#000', color:'#C9A96C', fontFamily:'Montserrat', fontSize:11, letterSpacing:3 }}>
      LOADING...
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/feed" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/feed" element={<PrivateRoute><AppLayout><Feed /></AppLayout></PrivateRoute>} />
      <Route path="/network" element={<PrivateRoute><AppLayout><Network /></AppLayout></PrivateRoute>} />
      <Route path="/messages" element={<PrivateRoute><AppLayout><Messages /></AppLayout></PrivateRoute>} />
      <Route path="/insights" element={<PrivateRoute><AppLayout><Insights /></AppLayout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AppLayout><Admin /></AppLayout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
