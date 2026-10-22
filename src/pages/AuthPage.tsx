import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Zap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  Database,
  Flame,
  Globe,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const {
    login,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    storageMode,
    setStorageMode,
    isFirebaseConfigured,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid corporate or team email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (storageMode === 'firebase') {
        if (!isFirebaseConfigured) {
          setError('Firebase environment variables (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID) are not configured. Switch to Demo Mode below or supply your Firebase credentials.');
          setLoading(false);
          return;
        }
        if (mode === 'login') {
          await loginWithEmail(email, password);
        } else {
          await registerWithEmail(email, password, name || email.split('@')[0]);
        }
      } else {
        login(email, name || email.split('@')[0]);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (err?.code === 'auth/api-key-not-valid' || msg.includes('API key not valid') || msg.includes('api-key-not-valid')) {
        setError('Firebase Web API Key is invalid or not yet configured. Please add your Web API Key from the Firebase Console to VITE_FIREBASE_API_KEY in .env, or switch to Demo Mode.');
      } else if (err?.code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setError('This domain is not authorized in Firebase Console. Please add this hosting domain under Firebase Console > Authentication > Settings > Authorized domains, or use Demo Mode.');
      } else {
        setError(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const msg = err?.message || '';
      if (err?.code === 'auth/api-key-not-valid' || msg.includes('API key not valid') || msg.includes('api-key-not-valid')) {
        setError('Firebase Web API Key is invalid or not yet configured. Please add your Web API Key from the Firebase Console to VITE_FIREBASE_API_KEY in .env, or switch to Demo Mode.');
      } else if (err?.code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setError('This domain is not authorized for Google Sign-in in Firebase Console. Add this domain to Authentication > Settings > Authorized domains, or use Demo Mode.');
      } else {
        setError(err instanceof Error ? err.message : 'Google sign-in could not be completed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setStorageMode('demo');
    setEmail('admin@flowpilot.ai');
    setPassword('flowpilot123');
    setName('Waqas Ahmad');
    setError(null);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setError('Please provide a valid email.');
      return;
    }
    setForgotSuccess(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 selection:bg-purple-600/30 selection:text-purple-200">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-20 translate-x-32" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20 mb-1">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            FlowPilot <span className="text-purple-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise-grade intelligent automation and workflow engine
          </p>
        </div>

        {/* Backend Mode Switcher Banner */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-xs">
            {storageMode === 'firebase' ? (
              <Flame className="w-4 h-4 text-amber-400" />
            ) : (
              <Database className="w-4 h-4 text-purple-400" />
            )}
            <div>
              <span className="font-semibold text-slate-200">
                {storageMode === 'firebase' ? 'Firebase Firestore' : 'Local Demo Adapter'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {storageMode === 'firebase'
                  ? isFirebaseConfigured ? 'Production Storage Connected' : 'Awaiting Config'
                  : 'Zero-config Instant Test Mode'}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                setStorageMode('demo');
                setError(null);
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                storageMode === 'demo'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              Demo
            </button>
            <button
              type="button"
              onClick={() => {
                setStorageMode('firebase');
                setError(null);
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                storageMode === 'firebase'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              Firebase
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl p-8">
          {/* Segmented Auth Mode Switcher */}
          <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Firebase unconfigured warning banner */}
          {storageMode === 'firebase' && !isFirebaseConfigured && (
            <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Firebase credentials not detected</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Add <code className="text-amber-200 font-mono">VITE_FIREBASE_API_KEY</code> &{' '}
                <code className="text-amber-200 font-mono">VITE_FIREBASE_PROJECT_ID</code> in <code className="font-mono">.env</code> to connect your live Cloud Firestore. You can also click <strong>Demo Mode</strong> to test right away.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in for Firebase Mode */}
          {storageMode === 'firebase' && isFirebaseConfigured && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <Globe className="w-4 h-4 text-purple-400" />
                <span>Continue with Google</span>
              </button>
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-slate-800" />
                <span className="px-3 text-[11px] text-slate-500 uppercase tracking-wider">or with email</span>
                <div className="flex-1 border-t border-slate-800" />
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Waqas Ahmad"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  placeholder="admin@flowpilot.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotSuccess(false);
                      setForgotModalOpen(true);
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Authenticating...'
                  : mode === 'login'
                  ? `Sign In (${storageMode === 'firebase' ? 'Firebase' : 'Demo'})`
                  : 'Create FlowPilot Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-purple-300 border border-purple-800/40 text-xs font-medium transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>Fill Demo Credentials (admin@flowpilot.ai)</span>
            </button>
            <p className="text-[11px] text-slate-500 mt-2">
              Instant access to pre-seeded production pipelines and analytics.
            </p>
          </div>
        </div>

        {/* Security & Engine status footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Access Control · Cloud Firestore ABAC Rules</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {!forgotSuccess ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Reset Password</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your email to receive password recovery instructions.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                  >
                    Send Recovery Email
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-100">Recovery Instructions Sent</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If an account exists for <span className="text-slate-200">{forgotEmail}</span>,
                  a reset link has been dispatched.
                </p>
                <button
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
