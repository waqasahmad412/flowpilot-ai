import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { storage } from '../services/storage';
import { testFirestoreConnection } from '../services/firebase';
import {
  Settings,
  User,
  Sun,
  Sparkles,
  ShieldCheck,
  Building,
  LogOut,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Database,
  Flame,
  Globe,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    user,
    updateUser,
    theme,
    toggleTheme,
    currentWorkspace,
    logout,
    backendStatus,
    showToast,
    storageMode,
    setStorageMode,
    isFirebaseConfigured,
    workflows,
    executions,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'ai' | 'workspace' | 'backend' | 'security' | 'danger'>('profile');

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'America/Los_Angeles (UTC-7)');
  const [defaultTemp, setDefaultTemp] = useState('0.4');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [testingPing, setTestingPing] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, timezone });
  };

  const handleResetData = () => {
    storage.resetAllData();
    showToast({
      type: 'info',
      title: 'Demo Data Reset',
      message: 'Workspace restored to clean baseline state. Reloading...',
    });
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleTestPing = async () => {
    setTestingPing(true);
    try {
      const ok = await testFirestoreConnection();
      if (ok) {
        showToast({
          type: 'success',
          title: 'Firestore Connection Verified',
          message: 'Successfully reached Cloud Firestore service.',
        });
      } else {
        showToast({
          type: 'warning',
          title: 'Connection Inconclusive',
          message: 'Could not establish connection to Firestore instance.',
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Connection Check Failed',
        message: err instanceof Error ? err.message : 'Unknown Firestore error.',
      });
    } finally {
      setTestingPing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-400">
            <Settings className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Settings & Configuration</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Manage your account profile, workspace parameters, AI models, and storage backend.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Settings Navigation Tabs */}
        <div className="w-full md:w-56 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shrink-0">
          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'backend', label: 'Firebase & Storage', icon: Database },
            { id: 'appearance', label: 'Appearance & Theme', icon: Sun },
            { id: 'ai', label: 'AI Provider Engine', icon: Sparkles },
            { id: 'workspace', label: 'Workspace & Team', icon: Building },
            { id: 'security', label: 'Security & Secrets', icon: ShieldCheck },
            { id: 'danger', label: 'Data Management', icon: RotateCcw },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-6">
          {/* User Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">Profile Information</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your display credentials and regional workspace time.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/20">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{name || 'User'}</div>
                  <div className="text-xs text-slate-400">{user?.email}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-950/80 border border-purple-800 text-purple-300">
                    Role: {user?.role || 'Owner'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-slate-800 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preferred Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="America/Los_Angeles (UTC-7)">America/Los_Angeles (UTC-7)</option>
                    <option value="America/New_York (UTC-4)">America/New_York (UTC-4)</option>
                    <option value="Europe/London (UTC+1)">Europe/London (UTC+1)</option>
                    <option value="Asia/Tokyo (UTC+9)">Asia/Tokyo (UTC+9)</option>
                    <option value="Asia/Karachi (UTC+5)">Asia/Karachi (UTC+5)</option>
                    <option value="UTC">UTC Universal</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </form>
          )}

          {/* Firebase & Storage Backend Tab */}
          {activeTab === 'backend' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">Storage Backend Architecture</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure between Cloud Firestore production database and local browser demo adapter.
                </p>
              </div>

              {/* Backend Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setStorageMode('firebase')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    storageMode === 'firebase'
                      ? 'bg-amber-950/20 border-amber-500/80 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Flame className="w-4 h-4" />
                      <span>Cloud Firestore</span>
                    </div>
                    {storageMode === 'firebase' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Persistent multi-user database with Attribute-Based Access Control (ABAC), user-level isolation, and real-time synchronization.
                  </p>
                </div>

                <div
                  onClick={() => setStorageMode('demo')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    storageMode === 'demo'
                      ? 'bg-purple-950/20 border-purple-500/80 shadow-md shadow-purple-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                      <Database className="w-4 h-4" />
                      <span>Local Demo Storage</span>
                    </div>
                    {storageMode === 'demo' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500 text-slate-950">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Zero-dependency client adapter pre-seeded with 3 production workflows, executions, and instant testing capability.
                  </p>
                </div>
              </div>

              {/* Status details */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Backend Connectivity Status</span>
                  {storageMode === 'firebase' && (
                    <button
                      onClick={handleTestPing}
                      disabled={testingPing}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${testingPing ? 'animate-spin' : ''}`} />
                      <span>Test Ping</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Mode</span>
                    <span className="font-semibold text-slate-200">
                      {storageMode === 'firebase' ? 'Firebase' : 'Local Demo'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Configuration</span>
                    <span className={`font-semibold ${isFirebaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isFirebaseConfigured ? 'Configured' : 'Env Missing'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Workflows</span>
                    <span className="font-semibold text-slate-200">{workflows.length} records</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Executions</span>
                    <span className="font-semibold text-slate-200">{executions.length} logs</span>
                  </div>
                </div>
              </div>

              {/* Setup guide */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300">
                <span className="font-bold text-slate-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Connecting Your Firebase Project</span>
                </span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  FlowPilot reads its Firebase configuration from standard Vite environment variables. Add the following to your <code className="text-purple-300 font-mono">.env</code>:
                </p>

                <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto">
{`VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:123456:web:abcdef"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
VITE_FIREBASE_DATABASE_ID="(default)"`}
                </pre>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Security rules are defined in <code className="text-purple-300 font-mono">firestore.rules</code> with strict user-data isolation, immutable timestamps, and RBAC policies.
                </p>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">Appearance & Canvas View</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize the interface theme and visual workflow canvas brightness.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-200">Dark Theme (Default)</span>
                    {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <span className="text-[11px] text-slate-500">Optimized for low-light focus</span>
                  </div>
                </div>

                <div
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    theme === 'light'
                      ? 'bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-200">Light Theme</span>
                    {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="h-16 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center">
                    <span className="text-[11px] text-slate-600">High contrast daylight mode</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Model Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">AI Model & Reasoning Engine</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure server-side Gemini 3.8 Flash parameters.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-300 flex items-start gap-3">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                <div className="space-y-1">
                  <span className="font-bold block text-purple-200">
                    Google GenAI SDK (Gemini 3.8 Flash) Active
                  </span>
                  <p className="text-[11px] text-purple-300/80 leading-relaxed">
                    FlowPilot executes all prompt synthesis, node decisions, and Copilot reasoning
                    server-side using <code>@google/genai</code>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Default Model Alias
                  </label>
                  <input
                    type="text"
                    value="gemini-3.8-flash"
                    disabled
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Default Sampling Temperature
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={defaultTemp}
                    onChange={(e) => setDefaultTemp(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Workspace & Team Tab */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">Workspace Management</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Parameters for the current active workspace.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{currentWorkspace.name}</span>
                    <span className="text-[11px] text-slate-500">ID: {currentWorkspace.id}</span>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-950 border border-purple-800 text-purple-300">
                    {currentWorkspace.plan}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Slug</span>
                    <span className="font-mono text-slate-300">{currentWorkspace.slug}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Created</span>
                    <span className="text-slate-300">{new Date(currentWorkspace.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">Security & Credentials</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  How secrets and integrations are safeguarded.
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-100 block">1. Server-Side Secret Management</span>
                  <p className="text-slate-400 text-[11px]">
                    API keys are injected via <code>process.env</code> on the server only. The client
                    never imports <code>@google/genai</code> or receives raw secret tokens.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-100 block">2. Ingestion Webhook Signatures</span>
                  <p className="text-slate-400 text-[11px]">
                    Webhook endpoints support optional HMAC secret validation headers before passing
                    payloads to trigger nodes.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-100 block">3. Code Sandboxing</span>
                  <p className="text-slate-400 text-[11px]">
                    User-defined transformation nodes execute strictly within guarded AST parsers,
                    preventing arbitrary shell or filesystem access.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Danger / Data Reset Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-rose-300">Data Management & Reset</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage local storage demo state or clear workspace caches.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 space-y-3">
                <div className="font-bold flex items-center gap-2 text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Restore Initial Baseline Demo Data</span>
                </div>
                <p className="text-[11px] text-rose-300/80 leading-relaxed">
                  Resetting demo data clears all custom created workflows, executions, and
                  modifications, returning your workspace to the initial starter pipelines.
                </p>

                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Reset Workspace to Default
                </button>
              </div>

              {/* Logout Button */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Sign Out of Session</h4>
                  <p className="text-[11px] text-slate-500">Return to the authentication screen.</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Demo Reset?</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This action will reset all workflows, execution histories, and notifications
              stored in your browser adapter. Are you sure you want to continue?
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
