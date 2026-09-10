import React, { useState } from 'react';
import { 
  Smartphone, Lock, User, Eye, EyeOff, ShieldCheck, 
  ArrowRight, Key, AlertCircle, Wrench, Wallet, UserCheck 
} from 'lucide-react';
import { UserAccount, StoreConfig } from '../types';

interface LoginScreenProps {
  storeConfig: StoreConfig;
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  storeConfig,
  users,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap masukkan Username dan Password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user (case-insensitive username)
      const found = users.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!found) {
        setErrorMsg('Username tidak ditemukan di sistem.');
        setIsLoading(false);
        return;
      }

      if (!found.isActive) {
        setErrorMsg('Akun ini telah dinonaktifkan oleh Owner. Hubungi administrator.');
        setIsLoading(false);
        return;
      }

      // Check password
      if (found.password && found.password !== password.trim()) {
        setErrorMsg('Password salah. Periksa kembali password Anda.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLoginSuccess(found);
    }, 400);
  };

  const handleQuickLogin = (role: 'owner' | 'petugas' | 'teknisi') => {
    setErrorMsg(null);
    const target = users.find(u => u.role === role && u.isActive) || users[0];
    if (target) {
      setUsername(target.username);
      setPassword(target.password || 'admin123');
      onLoginSuccess(target);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-center items-center p-4 sm:p-6 text-stone-900 dark:text-white selection:bg-blue-600 selection:text-white relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border-2 border-blue-600/30 dark:border-blue-500/20 shadow-2xl p-6 sm:p-8 relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/30 mb-1">
            <Smartphone className="w-9 h-9 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-900 dark:text-blue-400">
              {storeConfig.storeName || 'AZ-ZAHRA SERVICE'}
            </h1>
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-300 mt-0.5">
              {storeConfig.tagline || 'Pusat Spesialis Service Smartphone & Tablet Bergaransi'}
            </p>
          </div>
          <div className="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-950/60 border border-yellow-300 dark:border-yellow-800 text-yellow-900 dark:text-yellow-300 rounded-full text-[11px] font-bold">
            Gerbang Masuk Staf & Manajemen
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: owner / kasir / teknisi"
                className="w-full pl-9 pr-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                Password
              </label>
              <span className="text-[10px] text-stone-500">Default: admin123 / kasir123</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button (Warna Biru Utama Toko dengan Aksen Kuning) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-700/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 mt-2"
          >
            {isLoading ? (
              <span>Memverifikasi Akun...</span>
            ) : (
              <>
                <span>Masuk ke Dashboard Sistem</span>
                <ArrowRight className="w-4 h-4 text-yellow-300" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
          <p className="text-center text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Akses Cepat (Klik untuk Coba Langsung)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('owner')}
              className="px-2.5 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl text-center text-blue-900 dark:text-blue-300 transition-all cursor-pointer flex flex-col items-center gap-1"
            >
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span className="text-[11px] font-bold leading-tight">Owner/Admin</span>
              <span className="text-[9px] text-stone-500">owner</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('petugas')}
              className="px-2.5 py-2 bg-yellow-50 dark:bg-yellow-950/40 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-xl text-center text-yellow-900 dark:text-yellow-300 transition-all cursor-pointer flex flex-col items-center gap-1"
            >
              <Wallet className="w-4 h-4 text-yellow-600" />
              <span className="text-[11px] font-bold leading-tight">Kasir</span>
              <span className="text-[9px] text-stone-500">kasir</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('teknisi')}
              className="px-2.5 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl text-center text-red-900 dark:text-red-300 transition-all cursor-pointer flex flex-col items-center gap-1"
            >
              <Wrench className="w-4 h-4 text-red-600" />
              <span className="text-[11px] font-bold leading-tight">Teknisi</span>
              <span className="text-[9px] text-stone-500">teknisi</span>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-stone-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tersinkronisasi dengan Tab Users Google Sheets az9618064@gmail.com</span>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="mt-6 text-center text-xs text-stone-500">
        &copy; {new Date().getFullYear()} {storeConfig.storeName || 'AZ-ZAHRA SERVICE'} • Sistem Manajemen Bengkel HP Modern
      </div>

    </div>
  );
};
