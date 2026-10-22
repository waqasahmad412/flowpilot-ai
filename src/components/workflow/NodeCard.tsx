import React from 'react';
import { WorkflowNode, NodeType } from '../../types';
import {
  Play,
  Clock,
  Webhook,
  Sparkles,
  FileText,
  Globe,
  GitBranch,
  FileCode2,
  Table,
  Mail,
  Timer,
  Bell,
  CheckCircle,
  XCircle,
  Copy,
  Trash2,
  Settings2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface NodeCardProps {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: (node: WorkflowNode) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onStartConnect: (sourceNodeId: string, handleId?: string, clientX?: number, clientY?: number) => void;
  onEndConnect: (targetNodeId: string, handleId?: string) => void;
  executionStatus?: 'running' | 'success' | 'failed' | 'skipped';
}

export const NODE_CONFIG_META: Record<
  NodeType,
  { label: string; icon: React.FC<{ className?: string }>; color: string; border: string; bg: string }
> = {
  manual_trigger: {
    label: 'Manual Trigger',
    icon: Play,
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/30',
  },
  schedule_trigger: {
    label: 'Schedule Trigger',
    icon: Clock,
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    bg: 'bg-blue-950/30',
  },
  webhook_trigger: {
    label: 'Webhook Trigger',
    icon: Webhook,
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-950/30',
  },
  ai_gemini: {
    label: 'Gemini AI Model',
    icon: Sparkles,
    color: 'text-purple-400',
    border: 'border-purple-500/50',
    bg: 'bg-purple-950/30',
  },
  text_input: {
    label: 'Text Context',
    icon: FileText,
    color: 'text-slate-300',
    border: 'border-slate-600/40',
    bg: 'bg-slate-900/40',
  },
  http_request: {
    label: 'HTTP Request',
    icon: Globe,
    color: 'text-orange-400',
    border: 'border-orange-500/40',
    bg: 'bg-orange-950/30',
  },
  condition: {
    label: 'Conditional Branch',
    icon: GitBranch,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/30',
  },
  data_transform: {
    label: 'Data Transform',
    icon: FileCode2,
    color: 'text-indigo-400',
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-950/30',
  },
  google_sheets: {
    label: 'Google Sheets',
    icon: Table,
    color: 'text-green-400',
    border: 'border-green-500/40',
    bg: 'bg-green-950/30',
  },
  gmail: {
    label: 'Gmail Dispatch',
    icon: Mail,
    color: 'text-red-400',
    border: 'border-red-500/40',
    bg: 'bg-red-950/30',
  },
  delay: {
    label: 'Delay Timer',
    icon: Timer,
    color: 'text-yellow-400',
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-950/30',
  },
  notification: {
    label: 'Notification',
    icon: Bell,
    color: 'text-pink-400',
    border: 'border-pink-500/40',
    bg: 'bg-pink-950/30',
  },
  output: {
    label: 'Workflow Output',
    icon: CheckCircle,
    color: 'text-teal-400',
    border: 'border-teal-500/40',
    bg: 'bg-teal-950/30',
  },
};

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onStartConnect,
  onEndConnect,
  executionStatus,
}) => {
  const meta = NODE_CONFIG_META[node.type] || {
    label: node.type,
    icon: FileText,
    color: 'text-slate-400',
    border: 'border-slate-700',
    bg: 'bg-slate-900',
  };
  const Icon = meta.icon;

  const isTrigger = ['manual_trigger', 'schedule_trigger', 'webhook_trigger'].includes(node.type);
  const isCondition = node.type === 'condition';

  // Config summary snippet
  let summaryText = '';
  if (node.type === 'ai_gemini') {
    summaryText = node.config?.prompt ? `"${node.config.prompt.slice(0, 32)}..."` : 'Prompt not configured';
  } else if (node.type === 'schedule_trigger') {
    summaryText = node.config?.cron || 'Every 1 hour';
  } else if (node.type === 'webhook_trigger') {
    summaryText = node.config?.path || 'POST /webhooks/inbound';
  } else if (node.type === 'http_request') {
    summaryText = `${node.config?.method || 'GET'} ${node.config?.url ? node.config.url.slice(0, 24) : '...'}`;
  } else if (node.type === 'condition') {
    summaryText = `If ${node.config?.field || 'field'} ${node.config?.operator || 'contains'} ${node.config?.value || ''}`;
  } else if (node.type === 'google_sheets') {
    summaryText = node.config?.action || 'Append Row';
  } else if (node.type === 'gmail') {
    summaryText = node.config?.recipient ? `To: ${node.config.recipient.slice(0, 22)}` : 'Draft / Send';
  } else if (node.type === 'delay') {
    summaryText = `Wait ${node.config?.durationSeconds || 5}s`;
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
      className={`relative w-64 rounded-2xl bg-slate-900/95 border backdrop-blur-md shadow-xl transition-all select-none cursor-pointer group ${
        isSelected
          ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-purple-950/40'
          : `${meta.border} hover:border-slate-600`
      } ${executionStatus === 'running' ? 'node-pulse-active border-purple-400' : ''}`}
    >
      {/* Execution status indicator badge */}
      {executionStatus && (
        <div className="absolute -top-3 -right-2 z-20">
          {executionStatus === 'running' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900 border border-purple-500 text-[10px] text-purple-200 font-semibold shadow">
              <Loader2 className="w-3 h-3 animate-spin text-purple-300" />
              <span>Running</span>
            </div>
          )}
          {executionStatus === 'success' && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-600 text-[10px] text-emerald-300 font-semibold shadow">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>OK</span>
            </div>
          )}
          {executionStatus === 'failed' && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-950 border border-rose-600 text-[10px] text-rose-300 font-semibold shadow">
              <XCircle className="w-3 h-3 text-rose-400" />
              <span>Fail</span>
            </div>
          )}
        </div>
      )}

      {/* Input Handle (Left side) - if not a trigger */}
      {!isTrigger && (
        <div
          title="Input connection"
          onMouseUp={(e) => {
            e.stopPropagation();
            onEndConnect(node.id, 'in');
          }}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border-2 border-slate-600 hover:border-purple-400 flex items-center justify-center transition-colors cursor-crosshair z-10"
        >
          <div className="w-2 h-2 rounded-full bg-slate-400 hover:bg-purple-400" />
        </div>
      )}

      {/* Node Header */}
      <div className={`p-3.5 pb-2.5 rounded-t-2xl flex items-center justify-between ${meta.bg}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-lg bg-slate-950/70 border border-slate-800 ${meta.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block">
              {meta.label}
            </span>
            <div className="text-xs font-bold text-slate-100 truncate">{node.name}</div>
          </div>
        </div>

        {/* Quick Context menu */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(node.id);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Duplicate node"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/50"
            title="Delete node"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Node Body & Details */}
      <div className="p-3 pt-2 text-[11px] text-slate-400 space-y-1">
        {summaryText ? (
          <div className="truncate text-slate-300 font-mono text-[10px] bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
            {summaryText}
          </div>
        ) : (
          <div className="text-slate-500 italic text-[10px]">Click to configure parameters</div>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span>ID: {node.id.slice(0, 10)}</span>
          <span className="text-purple-400 hover:underline flex items-center gap-1">
            <Settings2 className="w-2.5 h-2.5" /> Configure
          </span>
        </div>
      </div>

      {/* Output Handles (Right side) */}
      {!isCondition && (
        <div
          title="Drag to connect"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnect(node.id, 'out', e.clientX, e.clientY);
          }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border-2 border-purple-500 hover:border-purple-300 flex items-center justify-center transition-colors cursor-crosshair z-10 group/handle"
        >
          <div className="w-2 h-2 rounded-full bg-purple-400 group-hover/handle:scale-125 transition-transform" />
        </div>
      )}

      {/* Condition Node has Two Branch Output Handles: True & False */}
      {isCondition && (
        <>
          <div
            title="True Branch"
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartConnect(node.id, 'true', e.clientX, e.clientY);
            }}
            className="absolute -right-3 top-1/3 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border-2 border-emerald-500 hover:border-emerald-300 flex items-center justify-center transition-colors cursor-crosshair z-10"
          >
            <span className="text-[9px] font-bold text-emerald-400">T</span>
          </div>
          <div
            title="False Branch"
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartConnect(node.id, 'false', e.clientX, e.clientY);
            }}
            className="absolute -right-3 top-2/3 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border-2 border-rose-500 hover:border-rose-300 flex items-center justify-center transition-colors cursor-crosshair z-10"
          >
            <span className="text-[9px] font-bold text-rose-400">F</span>
          </div>
        </>
      )}
    </div>
  );
};
