import React, { useState } from 'react';
import { useApp, NavPage } from '../../context/AppContext';
import {
  LayoutDashboard,
  Workflow,
  Sparkles,
  Layers,
  PlayCircle,
  Puzzle,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  ChevronsUpDown,
  Plus,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const {
    currentPage,
    setCurrentPage,
    unreadCount,
    setIsCopilotOpen,
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    createWorkspace,
    backendStatus,
  } = useApp();

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const navItems: { page: NavPage; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'builder', label: 'Workflow Builder', icon: Workflow },
    { page: 'generator', label: 'AI Generator', icon: Sparkles },
    { page: 'templates', label: 'Templates', icon: Layers },
    { page: 'executions', label: 'Executions', icon: PlayCircle },
    { page: 'integrations', label: 'Integrations', icon: Puzzle },
    { page: 'analytics', label: 'Analytics', icon: BarChart3 },
    { page: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { page: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    createWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName('');
    setIsCreatingWorkspace(false);
    setShowWorkspaceMenu(false);
  };

  return (
    <aside
      className={`relative flex flex-col h-screen border-r border-slate-800/80 bg-slate-950 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-100 text-base">FlowPilot</span>
                <span className="text-[10px] font-semibold tracking-wider text-purple-400 uppercase bg-purple-950/60 border border-purple-800/60 px-1.5 py-0.2 rounded">
                  AI
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">Automation Core</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 py-3 border-b border-slate-800/60 relative">
        <button
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className={`w-full flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-left transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title={currentWorkspace.name}
        >
          <div className="w-6 h-6 rounded-md bg-purple-900/50 border border-purple-700/40 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-purple-300">
              {currentWorkspace.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">{currentWorkspace.name}</div>
                <div className="text-[10px] text-slate-400">{currentWorkspace.plan}</div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </>
          )}
        </button>

        {/* Workspace Dropdown */}
        {showWorkspaceMenu && (
          <div className="absolute top-full left-3 right-3 mt-1.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Workspaces
            </div>
            <div className="max-h-40 overflow-y-auto my-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setCurrentWorkspace(ws);
                    setShowWorkspaceMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                    ws.id === currentWorkspace.id
                      ? 'bg-purple-600/15 text-purple-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  {ws.id === currentWorkspace.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 ml-2 shrink-0"></span>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-800/80 pt-1 mt-1 px-2">
              {!isCreatingWorkspace ? (
                <button
                  onClick={() => setIsCreatingWorkspace(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:text-purple-300 rounded hover:bg-slate-800/60 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              ) : (
                <form onSubmit={handleCreateWorkspaceSubmit} className="p-1 space-y-1.5">
                  <input
                    type="text"
                    placeholder="Workspace name..."
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsCreatingWorkspace(false)}
                      className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-0.5 text-[11px] font-medium rounded bg-purple-600 text-white hover:bg-purple-500"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;

          return (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/25 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />

              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="text-[11px] font-semibold text-rose-300 bg-rose-950/80 border border-rose-800/80 px-1.5 py-0.2 rounded-full">
                  {item.badge}
                </span>
              )}
              {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Copilot & Status Footer */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <button
          onClick={() => setIsCopilotOpen(true)}
          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-purple-900/20 border border-purple-700/30 hover:border-purple-500/50 text-purple-200 transition-all ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Open FlowPilot Copilot"
        >
          <Bot className="w-4 h-4 text-purple-400 shrink-0" />
          {!isCollapsed && (
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-semibold text-purple-200">FlowPilot Copilot</div>
              <div className="text-[10px] text-purple-400/80">AI Assistant</div>
            </div>
          )}
        </button>

        {/* System Engine Health Indicator */}
        {!isCollapsed ? (
          <div className="px-2 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800/50 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus?.geminiConfigured ? 'bg-emerald-400 ring-2 ring-emerald-500/20' : 'bg-amber-400 ring-2 ring-amber-500/20'
                }`}
              />
              <span className="text-slate-400 font-medium">Gemini 3.8 Flash</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {backendStatus?.geminiConfigured ? 'Live SDK' : 'Local Adapter'}
            </span>
          </div>
        ) : (
          <div
            className="flex items-center justify-center p-1"
            title={`Gemini: ${backendStatus?.geminiConfigured ? 'Live SDK' : 'Local Adapter'}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus?.geminiConfigured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
