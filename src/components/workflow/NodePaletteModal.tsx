import React, { useState } from 'react';
import { NodeType, NodeCategory } from '../../types';
import { NODE_CONFIG_META } from './NodeCard';
import { X, Search } from 'lucide-react';

interface NodePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: NodeType, name: string) => void;
}

interface NodeDefinition {
  type: NodeType;
  name: string;
  category: NodeCategory;
  description: string;
}

const ALL_NODES: NodeDefinition[] = [
  // Triggers
  {
    type: 'manual_trigger',
    name: 'Manual Trigger',
    category: 'trigger',
    description: 'Execute workflow on demand via button click or API call.',
  },
  {
    type: 'schedule_trigger',
    name: 'Schedule Trigger',
    category: 'trigger',
    description: 'Run automation periodically on a fixed interval or cron timer.',
  },
  {
    type: 'webhook_trigger',
    name: 'Webhook Trigger',
    category: 'trigger',
    description: 'Trigger workflow upon receiving an inbound HTTP POST request.',
  },

  // AI & Reasoning
  {
    type: 'ai_gemini',
    name: 'Gemini AI Model',
    category: 'ai',
    description: 'Reasoning, text extraction, synthesis, and classification with Gemini 3.8 Flash.',
  },
  {
    type: 'text_input',
    name: 'Text Context',
    category: 'ai',
    description: 'Static text variables, prompt instructions, and contextual data injection.',
  },

  // Logic & Transformations
  {
    type: 'condition',
    name: 'Conditional / If-Else',
    category: 'logic',
    description: 'Branch the execution flow based on value comparison, regex, or status.',
  },
  {
    type: 'data_transform',
    name: 'Data Transformation',
    category: 'logic',
    description: 'JSON object extraction, regex parsing, mapping, and formatting.',
  },
  {
    type: 'delay',
    name: 'Delay Timer',
    category: 'logic',
    description: 'Pause execution for a designated duration before proceeding to the next step.',
  },

  // Integrations & Actions
  {
    type: 'http_request',
    name: 'HTTP Request',
    category: 'action',
    description: 'Send custom GET, POST, PUT, or DELETE request to any third-party REST API.',
  },
  {
    type: 'google_sheets',
    name: 'Google Sheets',
    category: 'integration',
    description: 'Append rows, query spreadsheet ranges, or update cells in real time.',
  },
  {
    type: 'gmail',
    name: 'Gmail Dispatch',
    category: 'integration',
    description: 'Draft or send emails with dynamic templates and file attachments.',
  },
  {
    type: 'notification',
    name: 'Notification Alert',
    category: 'action',
    description: 'Send in-app notifications or broadcast messages to Slack and Discord channels.',
  },

  // Output
  {
    type: 'output',
    name: 'Workflow Output',
    category: 'output',
    description: 'Collect terminal results, format API responses, or store execution state.',
  },
];

export const NodePaletteModal: React.FC<NodePaletteModalProps> = ({
  isOpen,
  onClose,
  onAddNode,
}) => {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Nodes' },
    { id: 'trigger', label: 'Triggers' },
    { id: 'ai', label: 'AI & Models' },
    { id: 'logic', label: 'Logic & Flow' },
    { id: 'action', label: 'Actions' },
    { id: 'integration', label: 'Integrations' },
    { id: 'output', label: 'Outputs' },
  ];

  const filteredNodes = ALL_NODES.filter((n) => {
    const matchesSearch =
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100">Add Workflow Step</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a trigger, AI capability, logic control, or integration node.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search node types (e.g. Gemini, Webhook, Sheet, Condition)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Node Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredNodes.map((n) => {
            const meta = NODE_CONFIG_META[n.type];
            const Icon = meta.icon;

            return (
              <button
                key={n.type}
                onClick={() => {
                  onAddNode(n.type, n.name);
                  onClose();
                }}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border ${meta.border} text-left transition-all hover:scale-[1.01] hover:shadow-lg group cursor-pointer`}
              >
                <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${meta.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                    {n.name}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {n.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-500 flex items-center justify-between">
          <span>Click any node to place it onto the active canvas.</span>
          <span className="font-mono text-[10px]">13 Core Node Types</span>
        </div>
      </div>
    </div>
  );
};
