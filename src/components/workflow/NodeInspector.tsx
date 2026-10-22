import React, { useState } from 'react';
import { WorkflowNode } from '../../types';
import { NODE_CONFIG_META } from './NodeCard';
import { api } from '../../services/api';
import {
  X,
  Play,
  Trash2,
  Copy,
  Sparkles,
  Check,
  AlertCircle,
  Code,
  Info,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface NodeInspectorProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdate: (updatedNode: WorkflowNode) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
}) => {
  if (!node) return null;

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const meta = NODE_CONFIG_META[node.type] || {
    label: node.type,
    color: 'text-slate-400',
    border: 'border-slate-700',
    bg: 'bg-slate-900',
  };

  const updateConfig = (key: string, value: any) => {
    onUpdate({
      ...node,
      config: {
        ...node.config,
        [key]: value,
      },
    });
  };

  const handleTestNode = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      if (node.type === 'ai_gemini') {
        const res = await api.runAINode(
          node.config?.prompt || 'Test evaluation',
          { sampleContext: 'Test execution event at ' + new Date().toISOString() },
          node.config?.systemInstruction
        );
        setTestResult({
          status: 'success',
          output: res.output,
          model: res.model,
          tokens: res.tokensUsed,
        });
      } else if (node.type === 'http_request') {
        const res = await api.executeHttp({
          url: node.config?.url || 'https://httpbin.org/get',
          method: node.config?.method || 'GET',
          headers: node.config?.headers,
          body: node.config?.body,
        });
        setTestResult(res);
      } else {
        // Generic node simulation
        await new Promise((r) => setTimeout(r, 400));
        setTestResult({
          status: 'success',
          message: `Node "${node.name}" test completed successfully.`,
          simulatedPayload: { timestamp: Date.now(), config: node.config },
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        error: err.message || 'Execution error during node test',
      });
    } finally {
      setTesting(false);
    }
  };

  const insertVariable = (varName: string) => {
    if (node.type === 'ai_gemini') {
      const currentPrompt = node.config?.prompt || '';
      updateConfig('prompt', currentPrompt + ` {{${varName}}} `);
    }
  };

  const webhookUrl = `${window.location.origin}/api/webhooks/${node.config?.path?.replace(/^\//, '') || node.id}`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="w-80 sm:w-96 border-l border-slate-800 bg-slate-950/95 backdrop-blur-xl h-full flex flex-col z-30 select-none shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400 font-mono truncate">{node.id}</span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Node Name</label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => onUpdate({ ...node, name: e.target.value })}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Dynamic configuration according to node.type */}
        {node.type === 'ai_gemini' && (
          <div className="space-y-3.5 pt-2 border-t border-slate-800/80">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Prompt Template</label>
                <span className="text-[10px] text-purple-400 font-mono">gemini-3.8-flash</span>
              </div>
              <textarea
                rows={4}
                value={node.config?.prompt || ''}
                onChange={(e) => updateConfig('prompt', e.target.value)}
                placeholder="e.g. Summarize the following customer payload: {{trigger.body}} and extract 3 key action points."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none font-mono"
              />
            </div>

            {/* Variable insertion chips */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Insert Flow Variables:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['trigger.payload', 'customer.email', 'sentiment_score', 'previous_step.output'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-purple-900/60 text-purple-300 border border-slate-700 font-mono transition-colors"
                  >
                    + {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                System Instruction (Guardrails)
              </label>
              <input
                type="text"
                value={node.config?.systemInstruction || ''}
                onChange={(e) => updateConfig('systemInstruction', e.target.value)}
                placeholder="e.g. You are a strict JSON data extractor. Output valid JSON only."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Temperature</span>
                <span className="font-mono text-purple-400">{node.config?.temperature ?? 0.4}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={node.config?.temperature ?? 0.4}
                onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Deterministic (0.0)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>
          </div>
        )}

        {node.type === 'schedule_trigger' && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Interval Preset</label>
              <select
                value={node.config?.preset || 'hourly'}
                onChange={(e) => {
                  const preset = e.target.value;
                  let cron = '0 * * * *';
                  if (preset === '15min') cron = '*/15 * * * *';
                  if (preset === 'daily9am') cron = '0 9 * * *';
                  if (preset === 'weekdays') cron = '30 8 * * 1-5';
                  updateConfig('preset', preset);
                  updateConfig('cron', cron);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="15min">Every 15 Minutes</option>
                <option value="hourly">Every Hour (0 * * * *)</option>
                <option value="daily9am">Daily at 9:00 AM</option>
                <option value="weekdays">Weekdays at 8:30 AM</option>
                <option value="custom">Custom Cron Expression</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cron Expression</label>
              <input
                type="text"
                value={node.config?.cron || '0 * * * *'}
                onChange={(e) => updateConfig('cron', e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}

        {node.type === 'webhook_trigger' && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Webhook Endpoint URL</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono truncate"
                />
                <button
                  type="button"
                  onClick={copyWebhook}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shrink-0 flex items-center gap-1"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Accepted Method</label>
              <select
                value={node.config?.method || 'POST'}
                onChange={(e) => updateConfig('method', e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="POST">POST (Standard JSON webhook)</option>
                <option value="GET">GET (Query param payload)</option>
              </select>
            </div>
          </div>
        )}

        {node.type === 'http_request' && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex gap-2">
              <div className="w-24">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Method</label>
                <select
                  value={node.config?.method || 'GET'}
                  onChange={(e) => updateConfig('method', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Endpoint URL</label>
                <input
                  type="text"
                  value={node.config?.url || ''}
                  onChange={(e) => updateConfig('url', e.target.value)}
                  placeholder="https://api.example.com/v1/resource"
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {node.config?.method !== 'GET' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">JSON Request Body</label>
                <textarea
                  rows={3}
                  value={typeof node.config?.body === 'string' ? node.config.body : JSON.stringify(node.config?.body || {}, null, 2)}
                  onChange={(e) => updateConfig('body', e.target.value)}
                  placeholder={`{\n  "data": "{{previous.output}}"\n}`}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>
        )}

        {node.type === 'condition' && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Field to Inspect</label>
              <input
                type="text"
                value={node.config?.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                placeholder="e.g. sentiment or urgency"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Comparison Operator</label>
              <select
                value={node.config?.operator || 'contains'}
                onChange={(e) => updateConfig('operator', e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="contains">Contains substring</option>
                <option value="equals">Equals exactly (===)</option>
                <option value="greater_than">Greater than (&gt;)</option>
                <option value="less_than">Less than (&lt;)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Value</label>
              <input
                type="text"
                value={node.config?.value || ''}
                onChange={(e) => updateConfig('value', e.target.value)}
                placeholder="e.g. High or true"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300">
              <span className="font-semibold">Note:</span> Output port (T) executes when condition passes; port (F) executes otherwise.
            </div>
          </div>
        )}

        {node.type === 'google_sheets' && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Spreadsheet ID</label>
              <input
                type="text"
                value={node.config?.spreadsheetId || ''}
                onChange={(e) => updateConfig('spreadsheetId', e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Action</label>
              <select
                value={node.config?.action || 'append_row'}
                onChange={(e) => updateConfig('action', e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="append_row">Append Row (Record addition)</option>
                <option value="read_rows">Read Rows (Batch pull)</option>
                <option value="update_cell">Update Cell</option>
              </select>
            </div>
          </div>
        )}

        {node.type === 'gmail' && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient</label>
              <input
                type="text"
                value={node.config?.recipient || ''}
                onChange={(e) => updateConfig('recipient', e.target.value)}
                placeholder="client@example.com or {{lead.email}}"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                value={node.config?.subject || ''}
                onChange={(e) => updateConfig('subject', e.target.value)}
                placeholder="Re: Your inquiry"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Action Mode</label>
              <select
                value={node.config?.action || 'draft'}
                onChange={(e) => updateConfig('action', e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="draft">Save as Draft (Safe review)</option>
                <option value="send">Send Email Immediately</option>
              </select>
            </div>
          </div>
        )}

        {node.type === 'delay' && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Delay Duration (Seconds)</label>
              <input
                type="number"
                min="1"
                max="86400"
                value={node.config?.durationSeconds || 5}
                onChange={(e) => updateConfig('durationSeconds', parseInt(e.target.value, 10))}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}

        {node.type === 'notification' && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Channel / Type</label>
              <select
                value={node.config?.channel || 'in_app'}
                onChange={(e) => updateConfig('channel', e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="in_app">In-App Notification Center</option>
                <option value="slack">Slack Channel Hook</option>
                <option value="discord">Discord Channel Webhook</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alert Message</label>
              <textarea
                rows={2}
                value={node.config?.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Execution completed for {{trigger.id}}"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}

        {/* Test Node Action & Output */}
        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={handleTestNode}
            disabled={testing}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Play className="w-3.5 h-3.5 text-purple-400" />}
            <span>{testing ? 'Testing Node...' : 'Test This Step'}</span>
          </button>

          {testResult && (
            <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className={testResult.status === 'error' ? 'text-rose-400' : 'text-emerald-400'}>
                  {testResult.status === 'error' ? 'Test Failed' : 'Test Output Success'}
                </span>
                {testResult.tokens && (
                  <span className="text-slate-500 font-mono text-[10px]">{testResult.tokens} tokens</span>
                )}
              </div>
              <pre className="mt-1 p-2 rounded bg-slate-950 text-slate-300 font-mono text-[10px] overflow-x-auto max-h-36">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
        <button
          onClick={() => onDuplicate(node.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Duplicate</span>
        </button>

        <button
          onClick={() => onDelete(node.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs transition-colors border border-rose-800/60"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
