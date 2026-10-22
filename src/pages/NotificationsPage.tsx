import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Check,
  Trash2,
  Sliders,
  ExternalLink,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    selectWorkflowById,
    setCurrentPage,
    showToast,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'unread' | 'errors'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'errors') return n.type === 'error';
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-400">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Notification Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline alerts, execution outcomes, and system dispatch logs.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        {[
          { id: 'all', label: `All Alerts (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'errors', label: 'Failures & Errors' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === tab.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-xl">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">All caught up!</h3>
            <p className="text-xs text-slate-500">No notifications match your current filter.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isError = notif.type === 'error';
            const isSuccess = notif.type === 'success';

            return (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-800/40 ${
                  !notif.read ? 'bg-purple-950/15' : ''
                }`}
              >
                <div className="mt-0.5">
                  {isError ? (
                    <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  ) : isSuccess ? (
                    <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-blue-400">
                      <Info className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-100">{notif.title}</h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(notif.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>

                  {notif.workflowId && (
                    <div className="pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectWorkflowById(notif.workflowId!);
                          setCurrentPage('builder');
                        }}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open related workflow in builder</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
