import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { workflows, executions, showToast } = useApp();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Filter executions by date
  const filteredExecutions = useMemo(() => {
    const now = Date.now();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const threshold = now - days * 86400000;
    return executions.filter((e) => new Date(e.startedAt).getTime() >= threshold);
  }, [executions, dateRange]);

  const totalRuns = filteredExecutions.length;
  const successfulRuns = filteredExecutions.filter((e) => e.status === 'success').length;
  const failedRuns = filteredExecutions.filter((e) => e.status === 'failed').length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;

  // Average Duration
  const avgDurationMs = useMemo(() => {
    if (totalRuns === 0) return 0;
    const sum = filteredExecutions.reduce((acc, curr) => acc + curr.durationMs, 0);
    return Math.round(sum / totalRuns);
  }, [filteredExecutions, totalRuns]);

  // Total Tokens
  const totalTokens = useMemo(() => {
    return filteredExecutions.reduce((acc, curr) => acc + (curr.tokensUsed || 0), 0);
  }, [filteredExecutions]);

  // Estimated Time Saved: 4.5 mins / success run
  const estimatedHoursSaved = ((successfulRuns * 4.5) / 60).toFixed(1);

  // Workflow volume ranking
  const topWorkflows = useMemo(() => {
    const counts: Record<string, { name: string; count: number; success: number }> = {};
    filteredExecutions.forEach((e) => {
      if (!counts[e.workflowId]) {
        counts[e.workflowId] = { name: e.workflowName, count: 0, success: 0 };
      }
      counts[e.workflowId].count += 1;
      if (e.status === 'success') counts[e.workflowId].success += 1;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredExecutions]);

  // Daily Trend aggregation
  const dailyData = useMemo(() => {
    const count = dateRange === '7d' ? 7 : dateRange === '30d' ? 14 : 20;
    const daysMap: Record<string, { label: string; success: number; failed: number; total: number }> = {};

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      daysMap[label] = { label, success: 0, failed: 0, total: 0 };
    }

    filteredExecutions.forEach((e) => {
      const label = new Date(e.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (daysMap[label]) {
        daysMap[label].total += 1;
        if (e.status === 'success') daysMap[label].success += 1;
        else if (e.status === 'failed') daysMap[label].failed += 1;
      }
    });

    return Object.values(daysMap);
  }, [filteredExecutions, dateRange]);

  const maxVolume = Math.max(1, ...dailyData.map((d) => d.total));

  // CSV report export
  const downloadReport = () => {
    const reportData = [
      ['Metric', 'Value'],
      ['Date Range', dateRange],
      ['Total Executions', totalRuns],
      ['Successful Executions', successfulRuns],
      ['Failed Executions', failedRuns],
      ['Success Rate', `${successRate}%`],
      ['Average Duration (ms)', avgDurationMs],
      ['Estimated Hours Saved', estimatedHoursSaved],
      ['Tokens Consumed', totalTokens],
      [],
      ['Top Workflows by Volume'],
      ['Workflow Name', 'Total Runs', 'Success Count'],
      ...topWorkflows.map((w) => [`"${w.name}"`, w.count, w.success]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + reportData.map((r) => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `flowpilot_analytics_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast({ type: 'success', title: 'Report Downloaded', message: 'Analytics summary CSV saved.' });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Performance & Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real telemetry, throughput trends, and latency performance from active executions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  dateRange === r ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={downloadReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Total Run Volume</span>
          <div className="text-2xl font-bold text-slate-100 mt-2">{totalRuns}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {successfulRuns} successful · {failedRuns} errors
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Reliability Rate</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{successRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            based on {totalRuns} total executions
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Avg Execution Latency</span>
          <div className="text-2xl font-bold text-slate-100 mt-2">{avgDurationMs}ms</div>
          <div className="text-[11px] text-slate-400 mt-1">per end-to-end workflow</div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-slate-900/80 border border-purple-800/40">
          <span className="text-xs font-semibold text-purple-300">Estimated Manual Hours Saved</span>
          <div className="text-2xl font-bold text-purple-300 mt-2">{estimatedHoursSaved}h</div>
          <div className="text-[10px] text-purple-400/80 mt-1">
            *est. ~4.5 mins manual labour saved/run
          </div>
        </div>
      </div>

      {/* Execution Volume Trend & Success Rate Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Execution Volume Over Time</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily successful and failed workflow runs
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Window: {dateRange.toUpperCase()}</span>
          </div>

          <div className="h-64 w-full flex items-end gap-2 pt-8 pb-2 px-2 border-b border-slate-800">
            {dailyData.map((d, i) => {
              const heightPercent = Math.max(6, Math.round((d.total / maxVolume) * 100));
              const successH = d.total > 0 ? (d.success / d.total) * 100 : 100;
              const failH = 100 - successH;

              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[10px] text-slate-200 whitespace-nowrap shadow-lg">
                    {d.label}: {d.total} runs
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col justify-end"
                  >
                    {d.failed > 0 && <div style={{ height: `${failH}%` }} className="w-full bg-rose-500" />}
                    <div style={{ height: `${successH}%` }} className="w-full bg-gradient-to-t from-purple-700 to-indigo-500" />
                  </div>

                  <span className="text-[10px] text-slate-500 mt-2 truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Data synchronized with active execution log buffer.</span>
            <span>Total period runs: {totalRuns}</span>
          </div>
        </div>

        {/* Most Frequently Executed Workflows */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Top Workflows by Volume</h3>
            <p className="text-xs text-slate-400 mt-0.5">Most active pipelines in selected period</p>
          </div>

          <div className="space-y-3">
            {topWorkflows.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                No workflow runs recorded in this window.
              </div>
            ) : (
              topWorkflows.map((w, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 truncate max-w-[180px]">{w.name}</span>
                    <span className="font-mono text-purple-400 font-semibold">{w.count} runs</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Success rate</span>
                    <span className="text-emerald-400 font-mono">
                      {Math.round((w.success / w.count) * 100)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-900/40 text-[11px] text-purple-300">
            Total AI Tokens Consumed: <strong className="text-purple-200 font-mono">{totalTokens}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
