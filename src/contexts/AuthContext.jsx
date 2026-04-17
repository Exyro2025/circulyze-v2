import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext({});

const FOUNDING_LIMIT = 50;

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

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.exists()) setUserProfile(snap.data());
    return cred;
  };

  const register = async (form) => {
    const { email, password, full_name, title, company, industry, bio, invite_code } = form;

    // Validate invite code if provided
    if (invite_code) {
      const inviteQ = query(
        collection(db, 'invites'),
        where('code', '==', invite_code.toUpperCase()),
        where('used', '==', false)
      );
      const inviteSnap = await getDocs(inviteQ);
      if (inviteSnap.empty) throw new Error('Invalid or already used invite code.');
    }

    // Count current non-admin members to determine founding status
    const memberSnap = await getDocs(collection(db, 'users'));
    const nonAdminCount = memberSnap.docs.filter(d => d.data().role !== 'admin').length;
    const isFoundingMember = nonAdminCount < FOUNDING_LIMIT;

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    const profile = {
      full_name,
      title,
      company,
      industry,
      bio,
      email,
      role: 'member',
      subscription_tier: isFoundingMember ? 'founding' : 'member',
      is_founding_member: isFoundingMember,
      member_since: new Date().toISOString(),
      connection_count: 0,
      profile_image: null,
    };

    await setDoc(doc(db, 'users', cred.user.uid), profile);

    // Mark invite as used
    if (invite_code) {
      const inviteQ2 = query(collection(db, 'invites'), where('code', '==', invite_code.toUpperCase()));
      const inviteSnap2 = await getDocs(inviteQ2);
      if (!inviteSnap2.empty) {
        await updateDoc(doc(db, 'invites', inviteSnap2.docs[0].id), {
          used: true,
          used_by: cred.user.uid
        });
      }
    }

    setUserProfile(profile);
    return cred;
  };

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
    <AuthContext.Provider value={{ user, userProfile, loading, login, register, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);




