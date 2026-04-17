import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) setUserProfile(snap.data());
        } catch (e) { console.error(e); }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signOut = () => firebaseSignOut(auth);

  const updateProfile = async (data) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), data);
      setUserProfile(prev => ({ ...prev, ...data }));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

