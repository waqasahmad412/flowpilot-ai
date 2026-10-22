import React, { useState } from 'react';
import { WorkflowExecution } from '../../types';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  RotateCw,
  ChevronDown,
  ChevronRight,
  Code2,
} from 'lucide-react';

interface ExecutionOutputModalProps {
  execution: WorkflowExecution | null;
  isOpen: boolean;
  onClose: () => void;
  onRerun: () => void;
  isRunning?: boolean;
}

export const ExecutionOutputModal: React.FC<ExecutionOutputModalProps> = ({
  execution,
  isOpen,
  onClose,
  onRerun,
  isRunning,
}) => {
  if (!isOpen || !execution) return null;

  const [expandedStep, setExpandedStep] = useState<string | null>(
    execution.steps?.[0]?.nodeId || null
  );

  const toggleStep = (id: string) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  const isSuccess = execution.status === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Banner */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isSuccess
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {isSuccess ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  {isSuccess ? 'Workflow Test Succeeded' : 'Workflow Test Failed'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-slate-300">
                  {execution.id}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {execution.durationMs}ms duration
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  {execution.tokensUsed || 0} tokens
                </span>
                <span>·</span>
                <span>{execution.steps?.length || 0} steps executed</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRerun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Re-run'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Callout if Failed */}
        {execution.error && (
          <div className="p-4 bg-rose-950/20 border-b border-rose-900/40 text-xs text-rose-300">
            <span className="font-semibold block mb-0.5">Failure Details:</span>
            <p className="font-mono text-[11px] text-rose-200">{execution.error}</p>
          </div>
        )}

        {/* Step Breakdown */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Step-by-Step Execution Trace
          </h4>

          <div className="space-y-2">
            {execution.steps.map((step, idx) => {
              const isExpanded = expandedStep === step.nodeId;
              const stepSuccess = step.status === 'success';

              return (
                <div
                  key={step.nodeId}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden"
                >
                  <button
                    onClick={() => toggleStep(step.nodeId)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/40 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-slate-500 w-5">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      {stepSuccess ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {step.nodeName}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">
                          [{step.nodeType}]
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {step.durationMs}ms
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-xs space-y-3">
                      {step.error && (
                        <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 font-mono text-[11px]">
                          {step.error}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Code2 className="w-3 h-3 text-purple-400" /> Inputs
                          </div>
                          <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-40">
                            {JSON.stringify(step.input, null, 2)}
                          </pre>
                        </div>

                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Code2 className="w-3 h-3 text-emerald-400" /> Outputs
                          </div>
                          <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-40">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Execution audit log permanently recorded in history.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
