import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { Leaf, AlertCircle, LogIn } from 'lucide-react';
import { useEffect } from 'react';

export function LoginPage({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const { login, error, currentUser } = useAuth();

  useEffect(() => {
    if (currentUser && onLoginSuccess) {
      onLoginSuccess();
    }
  }, [currentUser, onLoginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login();
    if (success && onLoginSuccess) onLoginSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 bg-white/80 dark:bg-slate-900/80 shadow-2xl relative z-10 border border-slate-200/50 dark:border-slate-800/50">
          <div className="text-center mb-8">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 shadow-inner">
              <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">NexaGrow Admin</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Login dengan Google untuk mengakses kontrol panel pintar.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full py-4 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-semibold rounded-xl shadow border border-slate-200 dark:border-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.58C14.73 18.24 13.48 18.64 12 18.64C9.14 18.64 6.7 16.71 5.81 14.12H2.13V16.96C3.96 20.61 7.69 23 12 23Z" fill="#34A853"/>
                <path d="M5.81 14.12C5.58 13.44 5.45 12.73 5.45 12C5.45 11.27 5.58 10.56 5.81 9.88V7.04H2.13C1.37 8.56 0.95 10.24 0.95 12C0.95 13.76 1.37 15.44 2.13 16.96L5.81 14.12Z" fill="#FBBC05"/>
                <path d="M12 5.36C13.62 5.36 15.06 5.92 16.2 7L19.35 3.85C17.46 2.1 14.97 1 12 1C7.69 1 3.96 3.39 2.13 7.04L5.81 9.88C6.7 7.29 9.14 5.36 12 5.36Z" fill="#EA4335"/>
              </svg>
              Login dengan Google
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
            Hanya admin dan pengguna yang diundang yang memiliki akses.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
