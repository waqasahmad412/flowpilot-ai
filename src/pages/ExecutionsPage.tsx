import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { WorkflowExecution } from '../types';
import {
  PlayCircle,
  Search,
  Filter,
  Download,
  RotateCw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  X,
  Code2,
  Calendar,
} from 'lucide-react';

export const ExecutionsPage: React.FC = () => {
  const { executions, workflows, selectWorkflowById, setCurrentPage, addExecution, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'running' | 'cancelled'>('all');
  const [selectedWorkflowFilter, setSelectedWorkflowFilter] = useState<string>('all');
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Filtered executions
  const filteredExecutions = useMemo(() => {
    return executions.filter((exec) => {
      const matchesSearch =
        exec.id.toLowerCase().includes(search.toLowerCase()) ||
        exec.workflowName.toLowerCase().includes(search.toLowerCase()) ||
        (exec.error && exec.error.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || exec.status === statusFilter;
      const matchesWorkflow = selectedWorkflowFilter === 'all' || exec.workflowId === selectedWorkflowFilter;

      return matchesSearch && matchesStatus && matchesWorkflow;
    });
  }, [executions, search, statusFilter, selectedWorkflowFilter]);

  const totalPages = Math.ceil(filteredExecutions.length / rowsPerPage) || 1;
  const paginatedExecutions = filteredExecutions.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Export to real CSV
  const handleExportCSV = () => {
    if (filteredExecutions.length === 0) {
      showToast({ type: 'warning', title: 'No Data', message: 'No executions to export.' });
      return;
    }

    const headers = ['Execution ID', 'Workflow Name', 'Status', 'Trigger', 'Started At', 'Duration (ms)', 'Tokens', 'Error'];
    const rows = filteredExecutions.map((e) => [
      e.id,
      `"${e.workflowName.replace(/"/g, '""')}"`,
      e.status,
      e.triggeredBy,
      e.startedAt,
      e.durationMs,
      e.tokensUsed || 0,
      `"${(e.error || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `flowpilot_executions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast({ type: 'success', title: 'Export Successful', message: 'CSV downloaded.' });
  };

  // Retry execution
  const handleRetry = (exec: WorkflowExecution) => {
    const targetWf = workflows.find((w) => w.id === exec.workflowId);
    if (!targetWf) {
      showToast({ type: 'error', title: 'Cannot Retry', message: 'Original workflow no longer exists.' });
      return;
    }

    selectWorkflowById(targetWf.id);
    setCurrentPage('builder');
    showToast({
      type: 'info',
      title: 'Workflow Loaded',
      message: `Opening "${targetWf.name}" to re-execute in builder test runner.`,
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
              <PlayCircle className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Execution Audit Logs</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete historical record of automated runs, timing benchmarks, and node outputs.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export as CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, workflow, or error..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {(['all', 'success', 'failed', 'running', 'cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Workflow Picker */}
          <select
            value={selectedWorkflowFilter}
            onChange={(e) => {
              setSelectedWorkflowFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
          >
            <option value="all">All Workflows</option>
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Executions Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                <th className="py-3.5 pl-6">Execution ID</th>
                <th className="py-3.5">Workflow</th>
                <th className="py-3.5">Status</th>
                <th className="py-3.5">Trigger</th>
                <th className="py-3.5">Duration</th>
                <th className="py-3.5">Tokens</th>
                <th className="py-3.5">Timestamp</th>
                <th className="py-3.5 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedExecutions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No execution records match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedExecutions.map((exec) => {
                  const isSuccess = exec.status === 'success';

                  return (
                    <tr
                      key={exec.id}
                      onClick={() => setSelectedExecution(exec)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 pl-6 font-mono text-purple-400 font-semibold">
                        {exec.id}
                      </td>
                      <td className="py-3.5 font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                        {exec.workflowName}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            isSuccess
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-400" />
                          )}
                          {exec.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono text-[11px] capitalize">
                        {exec.triggeredBy}
                      </td>
                      <td className="py-3.5 text-slate-300 font-mono">
                        {exec.durationMs}ms
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono">
                        {exec.tokensUsed || 0}
                      </td>
                      <td className="py-3.5 text-slate-400 text-[11px]">
                        {new Date(exec.startedAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(exec);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Retry execution in builder"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedExecution(exec);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {(page - 1) * rowsPerPage + 1} to{' '}
            {Math.min(page * rowsPerPage, filteredExecutions.length)} of{' '}
            {filteredExecutions.length} records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono text-slate-200">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Execution Detail Slide-Over Drawer */}
      {selectedExecution && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] bg-slate-950/95 border-l border-slate-800 shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">
                  {selectedExecution.id}
                </span>
                <span className="text-slate-600">·</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    selectedExecution.status === 'success'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {selectedExecution.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-1">
                {selectedExecution.workflowName}
              </h3>
            </div>

            <button
              onClick={() => setSelectedExecution(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Metadata Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Duration</span>
                <span className="font-mono text-slate-200 font-bold text-sm mt-0.5 block">
                  {selectedExecution.durationMs}ms
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Trigger</span>
                <span className="text-slate-200 font-bold text-sm mt-0.5 block capitalize">
                  {selectedExecution.triggeredBy}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Tokens Consumed</span>
                <span className="font-mono text-purple-400 font-bold text-sm mt-0.5 block">
                  {selectedExecution.tokensUsed || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Started At</span>
                <span className="text-slate-300 text-xs mt-1 block">
                  {new Date(selectedExecution.startedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Error Message if present */}
            {selectedExecution.error && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 space-y-1">
                <span className="font-semibold block">Execution Error:</span>
                <p className="font-mono text-[11px] leading-relaxed">{selectedExecution.error}</p>
              </div>
            )}

            {/* Steps Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Node Execution Sequence ({selectedExecution.steps?.length || 0} Steps)
              </h4>

              <div className="space-y-3">
                {selectedExecution.steps?.map((step, idx) => (
                  <div
                    key={step.nodeId}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span className="font-bold text-slate-200">{step.nodeName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          [{step.nodeType}]
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {step.durationMs}ms
                      </span>
                    </div>

                    {step.error && (
                      <div className="p-2 rounded bg-rose-950/50 border border-rose-800 text-rose-300 font-mono text-[10px]">
                        {step.error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Input
                        </span>
                        <pre className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-24">
                          {JSON.stringify(step.input, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Output
                        </span>
                        <pre className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-24">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            <button
              onClick={() => handleRetry(selectedExecution)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry in Workflow Builder</span>
            </button>

            <button
              onClick={() => setSelectedExecution(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
