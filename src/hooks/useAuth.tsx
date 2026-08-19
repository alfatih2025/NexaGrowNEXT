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
      if (firebaseUser) {
        try {
          // Fetch role from firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCurrentUser({
              id: firebaseUser.uid,
              username: data.email?.split('@')[0] || 'User',
              email: data.email,
              role: data.role as Role
            });
          } else {
            // If no user doc, default to admin if first user, else user
            const isFirstUser = firebaseUser.email === 'alfatihwibowo264@gmail.com'; // Admin
            const role: Role = isFirstUser ? 'admin' : 'user';
            
            const newUser = {
              id: firebaseUser.uid,
              username: firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setCurrentUser(newUser);
          }
        } catch (firestoreError: any) {
          console.error('Firestore Error saat login:', firestoreError);
          // Fallback jika Firestore gagal, tetap set user agar bisa login (hanya di memori)
          setCurrentUser({
            id: firebaseUser.uid,
            username: firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: firebaseUser.email === 'alfatihwibowo264@gmail.com' ? 'admin' : 'user'
          });
          setAuthError(`Peringatan Firestore: ${firestoreError.message} (Login tetap dilanjutkan di memori)`);
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
      // Coba popup dulu (lebih reliable di SPA/Vercel)
      await signInWithPopup(auth, googleAuthProvider);
      return true;
    } catch (error: any) {
      // Jika popup diblokir browser (biasanya oleh adblock), otomatis fallback ke redirect
      if (error.code === 'auth/popup-blocked') {
        console.warn('Popup diblokir, menggunakan redirect...');
        await signInWithRedirect(auth, googleAuthProvider);
        return true;
      }
      // Khusus jika user sengaja menutup popup, jangan tampilkan sebagai error merah, cukup kembalikan ke awal
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

  const addUser = async (email: string, role: Role = 'user') => {
    return true;
  };

  const removeUser = async (id: string) => {
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
