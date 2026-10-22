import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Sun,
  Moon,
  Bell,
  Plus,
  User,
  LogOut,
  ExternalLink,
  Command,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Workflow as WorkflowIcon,
  Play,
  Database,
  Flame,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    currentWorkspace,
    selectedWorkflow,
    workflows,
    selectWorkflowById,
    createNewWorkflow,
    theme,
    toggleTheme,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    user,
    logout,
    storageMode,
    setStorageMode,
    isFirebaseConfigured,
  } = useApp();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Cmd+K or Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pageNames: Record<string, string> = {
    dashboard: 'Dashboard',
    builder: 'Workflow Builder',
    generator: 'AI Workflow Generator',
    templates: 'Templates Library',
    executions: 'Execution Audit Logs',
    integrations: 'Integrations Hub',
    analytics: 'Performance & Analytics',
    notifications: 'Notifications',
    settings: 'Settings & Security',
  };

  const filteredWorkflows = searchQuery.trim()
    ? workflows.filter(
        (w) =>
          w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : workflows.slice(0, 5);

  const handleCreateNew = () => {
    const newFlow = createNewWorkflow();
    selectWorkflowById(newFlow.id);
    setCurrentPage('builder');
  };

  return (
    <>
      <header className="h-16 px-6 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        {/* Breadcrumb / Section Header */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500 font-medium">{currentWorkspace.name}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-semibold">{pageNames[currentPage] || currentPage}</span>
          {currentPage === 'builder' && selectedWorkflow && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-purple-400 font-medium truncate max-w-[200px]">
                {selectedWorkflow.name}
              </span>
            </>
          )}
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Storage Backend Indicator */}
          <button
            onClick={() => {
              setCurrentPage('settings');
            }}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium transition-colors cursor-pointer ${
              storageMode === 'firebase'
                ? isFirebaseConfigured
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-300 hover:bg-amber-900/50'
                  : 'bg-amber-950/20 border-amber-800/40 text-amber-400/80 hover:bg-amber-900/30'
                : 'bg-purple-950/40 border-purple-800/60 text-purple-300 hover:bg-purple-900/50'
            }`}
            title="Active storage backend. Click to manage in Settings."
          >
            {storageMode === 'firebase' ? (
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Database className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span>{storageMode === 'firebase' ? 'Cloud Firestore' : 'Demo Mode'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                storageMode === 'firebase'
                  ? isFirebaseConfigured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  : 'bg-purple-400'
              }`}
            />
          </button>

          {/* Quick Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search workflows & nodes...</span>
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">
              <Command className="w-3 h-3" />K
            </kbd>
          </button>

          {/* New Automation Quick Action */}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Workflow</span>
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-semibold bg-purple-950 border border-purple-800 text-purple-300 px-1.5 py-0.2 rounded-full">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-800/50 ${
                          !n.read ? 'bg-purple-950/20' : ''
                        }`}
                      >
                        {n.type === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        ) : n.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Bell className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-800 bg-slate-950/60 text-center">
                  <button
                    onClick={() => {
                      setCurrentPage('notifications');
                      setShowNotifications(false);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                  >
                    View notification center &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              title="User profile"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-800">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-2">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="text-xs font-semibold text-slate-100 truncate">{user?.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                  <div className="mt-1 text-[10px] text-purple-400 font-medium">Role: {user?.role || 'Owner'}</div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setCurrentPage('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('builder');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg transition-colors"
                  >
                    <WorkflowIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Workflows</span>
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
              <Search className="w-4 h-4 text-purple-400 shrink-0" />
              <input
                type="text"
                placeholder="Search workflows, triggers, templates, executions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Workflows ({filteredWorkflows.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredWorkflows.map((flow) => (
                  <button
                    key={flow.id}
                    onClick={() => {
                      selectWorkflowById(flow.id);
                      setCurrentPage('builder');
                      setSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-800 flex items-center justify-center shrink-0">
                        <WorkflowIcon className="w-3.5 h-3.5 text-purple-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 truncate">
                          {flow.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {flow.category} · {flow.nodes.length} nodes · {flow.status}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">Open</span>
                  </button>
                ))}
              </div>

              <div className="px-2 pt-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Quick Navigation
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <button
                  onClick={() => {
                    setCurrentPage('generator');
                    setSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/70 text-xs text-slate-300 text-left"
                >
                  <Search className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Workflow Generator</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentPage('templates');
                    setSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/70 text-xs text-slate-300 text-left"
                >
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span>Browse Templates</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentPage('executions');
                    setSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/70 text-xs text-slate-300 text-left"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Executions</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentPage('integrations');
                    setSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/70 text-xs text-slate-300 text-left"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configure Integrations</span>
                </button>
              </div>
            </div>

            <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">ESC</kbd> to exit</span>
              <span>FlowPilot Search v2.4</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
