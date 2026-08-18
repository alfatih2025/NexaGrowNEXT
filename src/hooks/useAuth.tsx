import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  onSnapshot, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: () => Promise<boolean>;
  logout: () => void;
  addUser: (email: string, password?: string, role?: Role) => Promise<boolean>;
  removeUser: (email: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ROOT_ADMIN = import.meta.env.VITE_ROOT_ADMIN_EMAIL || 'alfatihwibowo264@gmail.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        if (fbUser.email === ROOT_ADMIN) {
          setCurrentUser({
            id: fbUser.uid,
            username: fbUser.displayName || fbUser.email.split('@')[0],
            email: fbUser.email,
            role: 'admin'
          });
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'allowed_users', fbUser.email);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentUser({
              id: fbUser.uid,
              username: fbUser.displayName || fbUser.email.split('@')[0],
              email: fbUser.email,
              role: data.role as Role
            });
          } else {
            // Not allowed
            await signOut(auth);
            setCurrentUser(null);
            setError('Email tidak diizinkan. Minta admin untuk mengundang Anda.');
          }
        } catch (err) {
          console.error(err);
          await signOut(auth);
          setCurrentUser(null);
          setError('Gagal memeriksa izin.');
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribeUsers = onSnapshot(collection(db, 'allowed_users'), (snapshot) => {
      const fetchedUsers: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        username: doc.id.split('@')[0],
        email: doc.id,
        role: doc.data().role
      }));
      // Always include root admin
      const allUsers = [
        { id: ROOT_ADMIN, username: ROOT_ADMIN.split('@')[0], email: ROOT_ADMIN, role: 'admin' as Role },
        ...fetchedUsers.filter(u => u.email !== ROOT_ADMIN)
      ];
      setUsers(allUsers);
    }, (err) => {
      console.error('Error fetching users', err);
    });

    return () => unsubscribeUsers();
  }, [currentUser]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    setError(null);
    try {
      await signInWithPopup(auth, provider);
      return true;
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, provider);
          return true;
        } catch (redirectErr: any) {
          setError(redirectErr.message || 'Failed to login via redirect');
          return false;
        }
      }
      setError(err.message || 'Failed to login');
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addUser = async (email: string, _password?: string, role: Role = 'user') => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    if (email === ROOT_ADMIN) return false;
    
    try {
      await setDoc(doc(db, 'allowed_users', email), {
        email,
        role,
        addedBy: currentUser.id,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      return false;
    }
  };

  const removeUser = async (email: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (email === ROOT_ADMIN) return;

    try {
      await deleteDoc(doc(db, 'allowed_users', email));
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, addUser, removeUser, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
