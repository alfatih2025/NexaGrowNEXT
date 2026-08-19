import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: Role;
  email: string;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  addUser: (email: string, role?: Role) => Promise<boolean>;
  removeUser: (id: string) => Promise<void>;
  loading: boolean;
  authError: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setUsers([]);
      return;
    }
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach((d) => usersData.push(d.data() as User));
      setUsers(usersData);
    });
    return () => unsubscribeUsers();
  }, [currentUser?.role]);

  useEffect(() => {
    // Tangkap hasil redirect login saat halaman dimuat kembali dari Google
    getRedirectResult(auth).then((result) => {
       if(result) {
         console.log("Redirect login berhasil:", result.user.email);
       }
    }).catch((error) => {
      console.error('Redirect result error:', error);
      setAuthError(`Error Redirect: ${error.code} - ${error.message}`);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        try {
          const docId = firebaseUser.email.toLowerCase();
          const userDoc = await getDoc(doc(db, 'users', docId));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCurrentUser({
              id: firebaseUser.uid,
              username: data.username || data.email?.split('@')[0] || 'User',
              email: data.email,
              role: data.role as Role
            });
          } else {
            // Jika belum ada di database, cek apakah dia admin pertama
            const isFirstUser = firebaseUser.email === 'alfatihwibowo264@gmail.com';
            const role: Role = isFirstUser ? 'admin' : 'user';
            
            const newUser = {
              id: firebaseUser.uid,
              username: firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email,
              role
            };
            // Gunakan email sebagai ID agar mudah diundang
            await setDoc(doc(db, 'users', docId), newUser);
            setCurrentUser(newUser);
          }
        } catch (firestoreError: any) {
          console.error('Firestore Error saat login:', firestoreError);
          setCurrentUser({
            id: firebaseUser.uid,
            username: firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: firebaseUser.email === 'alfatihwibowo264@gmail.com' ? 'admin' : 'user'
          });
          setAuthError(`Peringatan Firestore: ${firestoreError.message} (Login dilanjutkan di memori)`);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Auth state error:', error);
      setAuthError(`Auth State Error: ${error.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setAuthError('');
      await signInWithPopup(auth, googleAuthProvider);
      return true;
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        console.warn('Popup diblokir, menggunakan redirect...');
        await signInWithRedirect(auth, googleAuthProvider);
        return true;
      }
      if (error.code === 'auth/popup-closed-by-user') {
         throw new Error('Proses login dibatalkan.');
      }
      console.error('Login error full:', error);
      setAuthError(`Gagal login: ${error.code} - ${error.message}`);
      throw new Error(`Gagal login: ${error.code} - ${error.message}`);
    }
  };

  const logout = async () => {
    setAuthError('');
    await signOut(auth);
  };

  const addUser = async (email: string, role: Role = 'admin') => {
    try {
      const docId = email.toLowerCase().trim();
      const existing = await getDoc(doc(db, 'users', docId));
      if (existing.exists()) return false;

      await setDoc(doc(db, 'users', docId), {
        id: `invited_${Date.now()}`,
        username: email.split('@')[0],
        email: docId,
        role: role
      });
      return true;
    } catch (e) {
      console.error("Gagal menambah user:", e);
      return false;
    }
  };

  const removeUser = async (email: string) => {
    try {
      // Kita hapus berdasarkan ID (yang aslinya adalah email di sistem baru ini)
      // Namun berjaga-jaga jika ID-nya UID lama, kita query berdasarkan ID dokumen
      await deleteDoc(doc(db, 'users', email));
    } catch (e) {
      console.error("Gagal menghapus user:", e);
    }
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, addUser, removeUser, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
