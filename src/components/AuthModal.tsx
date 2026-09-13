import React, { useState } from 'react';
import { X, Lock, Mail, Phone, User as UserIcon, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { User } from '../types';
import { registerWithEmail, loginWithEmail, loginWithGoogle } from '../../lib/dbService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onShowToast
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'pharmacist' | 'admin'>('patient');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        const user = await registerWithEmail(email, password, name, phone, role);
        onLoginSuccess(user);
        onShowToast('success', 'Account Created Successfully', `Welcome to Curadeck, ${user.name}!`);
        onClose();
      } else {
        const user = await loginWithEmail(email, password);
        onLoginSuccess(user);
        onShowToast('success', 'Signed In', `Welcome back, ${user.name}!`);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Incorrect email or password.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email. Please create an account.';
      } else if (err.message) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
      onShowToast('success', 'Signed In with Google', `Welcome, ${user.name}!`);
      onClose();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setErrorMsg(err.message || 'Google sign-in was cancelled or encountered an issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 to-teal-800 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-teal-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 rounded-xl bg-teal-600/50 border border-teal-400/40 flex items-center justify-center text-white mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          
          <h3 className="text-xl font-black font-display text-white">
            {mode === 'login' ? 'Sign in to Curadeck' : 'Create Your Account'}
          </h3>
          <p className="text-xs text-teal-200 mt-1">
            Access authentic NAFDAC medications, doctor teleconsultations, and custom quotes.
          </p>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Google Sign-in One-click */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[11px] font-bold text-slate-400 uppercase">Or with email</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">FULL NAME *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Babatunde Alabi"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIGERIAN PHONE NUMBER *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ACCOUNT TYPE *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 bg-white cursor-pointer"
                  >
                    <option value="patient">Patient / Consumer Account</option>
                    <option value="pharmacist">Licensed Pharmacist / Healthcare Staff</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">EMAIL ADDRESS *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">PASSWORD *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Account' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setMode(mode === 'login' ? 'signup' : 'login');
              }}
              className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
            >
              {mode === 'login' 
                ? "Don't have an account yet? Create one here" 
                : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
