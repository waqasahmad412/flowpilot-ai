import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, WorkflowGenerateResponse } from '../services/api';
import { Workflow, WorkflowNode, WorkflowEdge } from '../types';
import { NODE_CONFIG_META } from '../components/workflow/NodeCard';
import {
  Sparkles,
  Send,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Workflow as WorkflowIcon,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const AIGeneratorPage: React.FC = () => {
  const { saveWorkflow, selectWorkflowById, setCurrentPage, showToast, currentWorkspace, backendStatus } = useApp();

  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('Customer Support');
  const [loading, setLoading] = useState(false);
  const [generationResult, setGenerationResult] = useState<WorkflowGenerateResponse | null>(null);

  const samplePrompts = [
    {
      title: 'Support Ticket Triage',
      category: 'Customer Support',
      prompt: 'Every time a new webhook support ticket arrives, analyze urgency with Gemini, route urgent ones to Slack, and draft a response in Gmail.',
    },
    {
      title: 'Daily KPI Synthesis',
      category: 'Business Automation',
      prompt: 'Every weekday morning at 8:00 AM, fetch sales performance from our HTTP API, synthesize top insights with Gemini, and post to Slack.',
    },
    {
      title: 'Google Sheets Lead Enricher',
      category: 'Data Processing',
      prompt: 'When a new lead form submits, enrich company industry and tech stack using Gemini AI and append the enriched row into Google Sheets.',
    },
    {
      title: 'Abandoned Cart Recovery',
      category: 'E-commerce',
      prompt: 'On webhook checkout abandoned, wait 2 hours, generate a custom personalized discount email with Gemini, and draft email.',
    },
  ];

  const handleGenerate = async (textToRun?: string, categoryToSet?: string) => {
    const text = textToRun || prompt;
    const cat = categoryToSet || category;

    if (!text.trim() || loading) return;

    setLoading(true);
    setGenerationResult(null);

    try {
      const res = await api.generateWorkflow(text, cat);
      setGenerationResult(res);
      showToast({
        type: 'success',
        title: 'Workflow Proposal Synthesized',
        message: `Generated "${res.workflow.name}" with ${res.workflow.nodes.length} steps.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Generation Failed',
        message: err.message || 'Unable to generate workflow proposal.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndOpen = () => {
    if (!generationResult?.workflow) return;

    const proposal = generationResult.workflow;
    const newWorkflow: Workflow = {
      id: 'wf_' + Math.random().toString(36).substring(2, 8),
      name: proposal.name,
      description: proposal.description,
      category: proposal.category || category,
      status: 'draft', // Generated flows start as Draft until verified and activated by user
      workspaceId: currentWorkspace.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successRate: 100,
      tags: ['AI Generated', category],
      nodes: proposal.nodes.map((n, i) => ({
        id: n.id || `node_${i + 1}`,
        type: n.type,
        name: n.name,
        position: n.position || { x: 100 + i * 280, y: 220 },
        config: n.config || {},
      })),
      edges: proposal.edges || [],
    };

    saveWorkflow(newWorkflow);
    selectWorkflowById(newWorkflow.id);
    setCurrentPage('builder');
    showToast({
      type: 'success',
      title: 'Workflow Saved to Workspace',
      message: `"${newWorkflow.name}" loaded into the Builder.`,
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">AI Workflow Generator</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Describe the automation you wish to construct in plain English. FlowPilot utilizes Google
          Gemini 3.8 Flash to synthesize complete node architectures with triggers, branches, and integrations.
        </p>
      </div>

      {/* Generator Input Section */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          className="space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200">Describe Your Automation Goal</label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Category:</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="Customer Support">Customer Support</option>
                  <option value="Business Automation">Business Automation</option>
                  <option value="Email Automation">Email Automation</option>
                  <option value="Data Processing">Data Processing</option>
                  <option value="Marketing Automation">Marketing Automation</option>
                  <option value="AI Content Generation">AI Content Generation</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Productivity">Productivity</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Every weekday at 9:00 AM, fetch unread emails matching 'invoice', extract vendor totals using Gemini AI, append to Google Sheets, and alert the finance team in Slack."
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 resize-none leading-relaxed shadow-inner"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Engine: {backendStatus?.geminiConfigured ? 'Gemini 3.8 Flash (Live Server)' : 'FlowPilot Synthesizer'}</span>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Workflow</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggested Prompts Grid */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick Start Inspiration
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(s.prompt);
                  setCategory(s.category);
                  handleGenerate(s.prompt, s.category);
                }}
                className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 text-left transition-colors group cursor-pointer"
              >
                <div className="text-xs font-semibold text-purple-300 group-hover:text-purple-200">
                  {s.title}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {s.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Proposal Review Section */}
      {generationResult && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-purple-800/40 shadow-2xl space-y-6 animate-in slide-in-from-bottom duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Proposed Architecture
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400 font-mono">
                  {generationResult.source}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-1">
                {generationResult.workflow.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {generationResult.workflow.description}
              </p>
            </div>

            <button
              onClick={handleApproveAndOpen}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/25 transition-all cursor-pointer"
            >
              <span>Approve & Open in Builder</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Node Flow Visual Walkthrough */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Step Pipeline Sequence ({generationResult.workflow.nodes?.length || 0} Nodes)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {generationResult.workflow.nodes?.map((node: any, i: number) => {
                const meta = NODE_CONFIG_META[node.type as keyof typeof NODE_CONFIG_META] || {
                  label: node.type,
                  color: 'text-slate-400',
                  border: 'border-slate-800',
                  bg: 'bg-slate-900',
                };

                return (
                  <div
                    key={node.id || i}
                    className={`p-4 rounded-2xl bg-slate-950/80 border ${meta.border} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">
                        Step {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-200 truncate">{node.name}</div>

                    {node.config && Object.keys(node.config).length > 0 && (
                      <pre className="p-2 rounded bg-slate-900 text-slate-300 font-mono text-[10px] overflow-x-auto max-h-20">
                        {JSON.stringify(node.config, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification & Status Note */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200">Compliance & Activation Verification:</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Workflows created by the AI Generator are initially stored in <strong>Draft</strong> status.
                You can review node parameters, run step tests, and activate the workflow when ready.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
