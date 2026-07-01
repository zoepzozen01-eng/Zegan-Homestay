import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Eye, EyeOff, ShieldAlert, UserPlus, LogIn, ClipboardList } from 'lucide-react';
import { authenticateStaff, signUpStaff } from '../services/authService';

interface StaffLoginProps {
  lang: 'id' | 'en';
  onLoginSuccess: (user: { name: string; username: string; role: 'Owner' | 'Receptionist' | 'Admin' }) => void;
  onGoHome: () => void;
}

export default function StaffLogin({ lang, onLoginSuccess, onGoHome }: StaffLoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Login & Register States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Owner' | 'Receptionist' | 'Admin'>('Receptionist');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isSignUp) {
      if (!name.trim() || !username.trim() || !password) {
        setErrorMsg(lang === 'id' ? 'Semua bidang harus diisi.' : 'All fields are required.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg(lang === 'id' ? 'Password minimal terdiri dari 6 karakter.' : 'Password must be at least 6 characters.');
        return;
      }
      
      setIsLoading(true);
      try {
        const newUser = await signUpStaff(name.trim(), username.trim(), password, role);
        if (newUser) {
          setSuccessMsg(lang === 'id' 
            ? 'Pendaftaran akun berhasil! Silakan masuk dengan akun baru Anda.' 
            : 'Registration successful! Please sign in with your new account.'
          );
          setIsSignUp(false);
          setPassword('');
        }
      } catch (err: any) {
        console.error('Registration error:', err);
        setErrorMsg(err.message || (lang === 'id' ? 'Gagal mendaftarkan akun.' : 'Failed to register account.'));
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!username.trim() || !password) {
        setErrorMsg(lang === 'id' ? 'Username/Email dan Password harus diisi.' : 'Username/Email and Password are required.');
        return;
      }

      setIsLoading(true);
      try {
        const user = await authenticateStaff(username.trim(), password);
        if (user) {
          onLoginSuccess(user);
        } else {
          setErrorMsg(lang === 'id' 
            ? 'Username/Email atau Password salah.' 
            : 'Invalid Username/Email or Password.'
          );
        }
      } catch (err: any) {
        console.error('Login error:', err);
        setErrorMsg(err.message || (lang === 'id' ? 'Terjadi kesalahan sistem.' : 'A system error occurred.'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-800/10 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand-700/10 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-stone-850 border border-stone-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 text-stone-100"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-900/50 text-brand-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-800/80 shadow-inner">
            {isSignUp ? <UserPlus className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
            {isSignUp 
              ? (lang === 'id' ? 'Daftar Akun Staff' : 'Register Staff Account')
              : (lang === 'id' ? 'Pintu Masuk Staff' : 'Staff Portal Access')}
          </h2>
          <p className="text-xs text-stone-400 mt-1.5 leading-relaxed font-light">
            {isSignUp
              ? (lang === 'id' 
                ? 'Buat akun pengelola baru dengan mendaftarkannya ke Supabase.' 
                : 'Create a new manager account in Supabase.')
              : (lang === 'id' 
                ? 'Silakan masukkan kredensial resmi Anda untuk mengelola homestay.' 
                : 'Please enter your credentials to manage the homestay.')}
          </p>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200 text-xs flex items-start gap-3"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-xs flex items-start gap-3"
          >
            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
            <span className="font-medium leading-relaxed">{successMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name (Sign Up only) */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="block text-[11px] text-stone-400 uppercase tracking-widest font-semibold">
                {lang === 'id' ? 'Nama Lengkap' : 'Full Name'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'id' ? 'cth: Triyanto' : 'e.g. Triyanto'}
                  className="w-full bg-stone-900/50 border border-stone-800 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Username / Email Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-stone-400 uppercase tracking-widest font-semibold">
              {lang === 'id' ? 'Email / Username' : 'Email / Username'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={lang === 'id' ? 'cth: triyanto atau triyanto@zegan.com' : 'e.g. triyanto or triyanto@zegan.com'}
                className="w-full bg-stone-900/50 border border-stone-800 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-stone-400 uppercase tracking-widest font-semibold">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-900/50 border border-stone-800 rounded-xl py-3 pl-11 pr-10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-stone-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role Dropdown (Sign Up only) */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="block text-[11px] text-stone-400 uppercase tracking-widest font-semibold">
                Role
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500">
                  <ClipboardList className="w-4 h-4" />
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-stone-900/50 border border-stone-800 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium appearance-none"
                  disabled={isLoading}
                >
                  <option value="Receptionist" className="bg-stone-800 text-white">Receptionist</option>
                  <option value="Owner" className="bg-stone-800 text-white">Owner</option>
                  <option value="Admin" className="bg-stone-800 text-white">Admin (Unauthorized role for testing 403)</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-brand-700 hover:bg-brand-600 active:scale-98 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all border border-brand-600/30 flex items-center justify-center gap-2 mt-2 disabled:opacity-55 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading 
              ? (lang === 'id' ? 'Memproses...' : 'Processing...') 
              : isSignUp 
                ? (lang === 'id' ? 'Daftar Akun Baru' : 'Register Account')
                : (lang === 'id' ? 'Masuk ke Sistem' : 'Sign In')}
          </button>
        </form>

        {/* Toggle link to switch between login and register */}
        <div className="mt-6 text-center border-t border-stone-800 pt-5">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-brand-400 hover:text-brand-300 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            {isSignUp 
              ? (lang === 'id' ? 'Sudah punya akun? Masuk di sini' : 'Already have an account? Sign In')
              : (lang === 'id' ? 'Belum punya akun? Buat akun Staff baru' : 'Do not have an account? Register Staff')}
          </button>
        </div>

        {/* Fast Service Signals Monitor access for gaptek users */}
        <div className="mt-4 border-t border-stone-800/60 pt-4 text-center space-y-3">
          <button
            type="button"
            onClick={() => window.location.pathname = '/service-signals'}
            className="w-full bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 font-bold py-3 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-101 shadow-inner"
          >
            <span className="text-sm">🛎️</span>
            <span>{lang === 'id' ? 'Monitor Sinyal & Layanan Kamar' : 'Service Signals & Room Monitor'}</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onGoHome}
            className="text-stone-500 hover:text-stone-300 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>←</span>
            <span>{lang === 'id' ? 'Kembali ke Website Utama' : 'Back to Main Website'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
