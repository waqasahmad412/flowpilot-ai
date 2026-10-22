import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Template } from '../types';
import { NODE_CONFIG_META } from '../components/workflow/NodeCard';
import {
  Layers,
  Search,
  ArrowRight,
  Eye,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  X,
  Puzzle,
} from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const { templates, instantiateTemplate, setCurrentPage } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'Email Automation', label: 'Email Automation' },
    { id: 'Business Automation', label: 'Business Automation' },
    { id: 'Customer Support', label: 'Customer Support' },
    { id: 'Marketing Automation', label: 'Marketing Automation' },
    { id: 'Data Processing', label: 'Data Processing' },
    { id: 'AI Content Generation', label: 'AI Content Generation' },
    { id: 'E-commerce', label: 'E-commerce' },
    { id: 'Productivity', label: 'Productivity' },
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-800 text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Workflow Templates Library</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Pre-built production-grade automations across 8 categories. Preview node diagrams and
          instantiate ready-to-run pipelines directly into your workspace.
        </p>
      </div>

      {/* Search & Categories */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates by keyword, integrations, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all p-6 flex flex-col justify-between hover:shadow-xl group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                  {tpl.category}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {tpl.nodes.length} steps
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              {/* Integrations Badges */}
              <div className="pt-2 flex flex-wrap gap-1.5">
                {tpl.integrations.map((it, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-medium"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => setPreviewTemplate(tpl)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Preview</span>
              </button>

              <button
                onClick={() => instantiateTemplate(tpl.id)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <span>Use Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  Template Preview · {previewTemplate.category}
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                  {previewTemplate.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <p className="text-xs text-slate-300 leading-relaxed">
                {previewTemplate.description}
              </p>

              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Workflow Execution Sequence ({previewTemplate.nodes.length} Steps)
                </h4>

                <div className="space-y-2.5">
                  {previewTemplate.nodes.map((node, i) => {
                    const meta = NODE_CONFIG_META[node.type];
                    const Icon = meta?.icon || Zap;

                    return (
                      <div
                        key={node.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500 w-5">
                            {String(i + 1).padStart(2, '0')}.
                          </span>
                          <div className={`p-1.5 rounded-lg bg-slate-900 ${meta?.color || 'text-purple-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-200">{node.name}</span>
                            <span className="text-[10px] text-slate-500 ml-2 font-mono">
                              [{meta?.label || node.type}]
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
                          Configured
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                <Puzzle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">Integrations Required:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    This template utilizes {previewTemplate.integrations.join(', ')}. If any
                    third-party service is not configured yet, it runs safely in local demo mode.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Close Preview
              </button>

              <button
                onClick={() => {
                  instantiateTemplate(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-purple-600/25"
              >
                <span>Use This Template</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
