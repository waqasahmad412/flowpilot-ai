import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Workflow as WorkflowIcon,
  PlayCircle,
  Sparkles,
  Layers,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Plus,
  Play,
  Copy,
  Calendar,
  Zap,
  BarChart2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    user,
    workflows,
    executions,
    setCurrentPage,
    selectWorkflowById,
    duplicateWorkflow,
    createNewWorkflow,
  } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | 'all'>('7d');

  // Personalized Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Filter executions based on date range
  const filteredExecutions = useMemo(() => {
    const now = Date.now();
    return executions.filter((exec) => {
      const execTime = new Date(exec.startedAt).getTime();
      if (dateFilter === 'today') return now - execTime <= 86400000;
      if (dateFilter === '7d') return now - execTime <= 7 * 86400000;
      if (dateFilter === '30d') return now - execTime <= 30 * 86400000;
      return true;
    });
  }, [executions, dateFilter]);

  // Derived real metrics
  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter((w) => w.status === 'active').length;
  const successfulExecutions = filteredExecutions.filter((e) => e.status === 'success').length;
  const failedExecutions = filteredExecutions.filter((e) => e.status === 'failed').length;

  // Estimated time saved calculation: avg 4.5 minutes per successful automation run
  const estimatedHoursSaved = useMemo(() => {
    const minutes = successfulExecutions * 4.5;
    return (minutes / 60).toFixed(1);
  }, [successfulExecutions]);

  // Daily trend data for SVG Chart
  const trendData = useMemo(() => {
    const days: Record<string, { date: string; success: number; failed: number; total: number }> = {};
    const count = dateFilter === 'today' ? 24 : dateFilter === '7d' ? 7 : 14;

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      if (dateFilter === 'today') {
        d.setHours(d.getHours() - i);
        const label = d.getHours() + ':00';
        days[label] = { date: label, success: 0, failed: 0, total: 0 };
      } else {
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        days[label] = { date: label, success: 0, failed: 0, total: 0 };
      }
    }

    filteredExecutions.forEach((exec) => {
      const d = new Date(exec.startedAt);
      const label =
        dateFilter === 'today'
          ? d.getHours() + ':00'
          : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

      if (days[label]) {
        days[label].total += 1;
        if (exec.status === 'success') days[label].success += 1;
        else if (exec.status === 'failed') days[label].failed += 1;
      }
    });

    return Object.values(days);
  }, [filteredExecutions, dateFilter]);

  const maxDailyVolume = Math.max(1, ...trendData.map((d) => d.total));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            {greeting}, {user?.name || 'Engineer'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            FlowPilot AI automation workspace overview · Active monitoring active
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start md:self-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'all', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                dateFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Workflows */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Workflows</span>
            <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-purple-400">
              <WorkflowIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-100">{totalWorkflows}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">configured in workspace</div>
          </div>
        </div>

        {/* Active Workflows */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Workflows</span>
            <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400">{activeWorkflows}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {totalWorkflows > 0 ? Math.round((activeWorkflows / totalWorkflows) * 100) : 0}% active production rate
            </div>
          </div>
        </div>

        {/* Successful Runs */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Successful Runs</span>
            <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-100">{successfulExecutions}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">completed without error</div>
          </div>
        </div>

        {/* Failed Runs */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Failed Executions</span>
            <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-100">{failedExecutions}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {failedExecutions > 0 ? 'review error stack' : 'zero errors recorded'}
            </div>
          </div>
        </div>

        {/* Estimated Time Saved */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-slate-900/80 border border-purple-800/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-300">
            <span className="text-xs font-semibold">Est. Time Saved</span>
            <div className="p-1.5 rounded-lg bg-purple-950 border border-purple-700/60 text-purple-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-300">{estimatedHoursSaved}h</div>
            <div className="text-[10px] text-purple-400/80 mt-0.5">
              calc: ~4.5m manual work / run
            </div>
          </div>
        </div>
      </div>

      {/* Execution Trend & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Execution Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Workflow Execution Volume</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real executions recorded in current period
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                <span className="text-slate-400">Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span className="text-slate-400">Failed</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-56 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
            {trendData.map((d, i) => {
              const heightPercent = Math.max(8, Math.round((d.total / maxDailyVolume) * 100));
              const successH = d.total > 0 ? (d.success / d.total) * 100 : 100;
              const failH = 100 - successH;

              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[10px] text-slate-200 whitespace-nowrap shadow-lg">
                    <span className="font-semibold">{d.date}</span>: {d.total} runs ({d.success} ok, {d.failed} err)
                  </div>

                  {/* Stacked Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all group-hover:brightness-125"
                  >
                    {d.failed > 0 && (
                      <div
                        style={{ height: `${failH}%` }}
                        className="w-full bg-rose-500/80 transition-all"
                      />
                    )}
                    <div
                      style={{ height: `${successH}%` }}
                      className="w-full bg-gradient-to-t from-purple-700 to-indigo-500 transition-all"
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 mt-2 truncate w-full text-center">
                    {d.date}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated from local execution adapter buffer.</span>
            <button
              onClick={() => setCurrentPage('analytics')}
              className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              Detailed Analytics &rarr;
            </button>
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Automation Launchpad</h3>
            <p className="text-xs text-slate-400 mt-0.5">Quick starting points and generators</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => {
                const newFlow = createNewWorkflow();
                selectWorkflowById(newFlow.id);
                setCurrentPage('builder');
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4" />
                <span>Create Blank Workflow</span>
              </div>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setCurrentPage('generator')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-purple-800/40 text-purple-300 text-xs font-semibold transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Workflow Generator</span>
              </div>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setCurrentPage('templates')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Browse Starter Templates</span>
              </div>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setCurrentPage('executions')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                <span>View Executions History</span>
              </div>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-900/40 text-[11px] text-purple-300 leading-relaxed">
            <span className="font-semibold text-purple-200">Gemini 3.8 Flash Ready:</span> Natural language workflow synthesis and generative AI steps are active.
          </div>
        </div>
      </div>

      {/* Workflows List Table */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Workflows</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active and draft automated pipelines in this workspace
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('builder')}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            Open in Builder &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pl-2">Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Nodes</th>
                <th className="pb-3">Success Rate</th>
                <th className="pb-3">Last Run</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {workflows.map((flow) => (
                <tr key={flow.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3 pl-2">
                    <button
                      onClick={() => {
                        selectWorkflowById(flow.id);
                        setCurrentPage('builder');
                      }}
                      className="font-bold text-slate-200 group-hover:text-purple-300 text-left truncate max-w-xs block cursor-pointer"
                    >
                      {flow.name}
                    </button>
                    <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                      {flow.description}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{flow.category}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        flow.status === 'active'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                          : flow.status === 'paused'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          flow.status === 'active'
                            ? 'bg-emerald-400'
                            : flow.status === 'paused'
                            ? 'bg-amber-400'
                            : 'bg-slate-400'
                        }`}
                      />
                      {flow.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 font-mono">{flow.nodes.length}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${flow.successRate}%` }}
                          className="h-full bg-purple-500 rounded-full"
                        />
                      </div>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {flow.successRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">
                    {flow.lastExecutedAt
                      ? new Date(flow.lastExecutedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </td>
                  <td className="py-3 text-right pr-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          selectWorkflowById(flow.id);
                          setCurrentPage('builder');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => duplicateWorkflow(flow.id)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
