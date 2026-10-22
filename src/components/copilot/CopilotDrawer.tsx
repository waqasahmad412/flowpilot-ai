import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ChatMessage } from '../../types';
import {
  Bot,
  X,
  Send,
  Trash2,
  Sparkles,
  ArrowRight,
  Code,
  AlertCircle,
  CheckCircle2,
  Workflow,
  HelpCircle,
} from 'lucide-react';

export const CopilotDrawer: React.FC = () => {
  const { isCopilotOpen, setIsCopilotOpen, selectedWorkflow, executions, setCurrentPage, instantiateTemplate } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `### Welcome to FlowPilot Copilot!\nI am your embedded AI automation architect powered by **Gemini 3.8 Flash**.\n\nI can help you:\n- Architect multi-step workflows from scratch\n- Formulate prompts for Gemini AI nodes\n- Write data transformation logic & regex\n- Troubleshoot execution logs and API errors\n\nHow can I help you optimize your automations today?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isCopilotOpen) {
      scrollToBottom();
    }
  }, [messages, isCopilotOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = {
        currentWorkflow: selectedWorkflow ? { name: selectedWorkflow.name, nodeCount: selectedWorkflow.nodes.length, status: selectedWorkflow.status } : null,
        recentFailures: executions.filter((e) => e.status === 'failed').slice(0, 2).map((e) => ({ name: e.workflowName, error: e.error })),
      };

      const res = await api.chatWithCopilot(text, messages, context);

      const aiMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_err_' + Date.now(),
          role: 'assistant',
          content: 'Sorry, I encountered an issue contacting the Gemini service. Please verify server connectivity or try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: 'Chat history cleared. How can I assist with your workflow architecture?',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const suggestedPrompts = [
    'How do I pass webhook data into a Gemini node?',
    'What is the best way to handle branch conditions?',
    'Help me write a JSON transform expression',
    'How do I setup Google Sheets append action?',
  ];

  if (!isCopilotOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-slate-950/95 border-l border-slate-800 shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100">FlowPilot Copilot</span>
              <span className="text-[10px] font-semibold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-1.5 rounded">
                Gemini 3.8 Flash
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Contextual Automation Assistant</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCopilotOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Copilot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workflow Context Badge */}
      {selectedWorkflow && (
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Workflow className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-slate-400 truncate">Inspecting:</span>
            <span className="text-slate-200 font-medium truncate">{selectedWorkflow.name}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
            {selectedWorkflow.nodes.length} nodes
          </span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-purple-600 text-white rounded-br-xs'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800/90 rounded-bl-xs shadow-sm'
                }`}
              >
                {/* Simple Markdown Parser */}
                <div className="space-y-1.5 whitespace-pre-wrap">
                  {m.content.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('### ')) {
                      return (
                        <div key={idx} className="font-bold text-sm text-slate-100 mt-1 mb-1">
                          {paragraph.replace('### ', '')}
                        </div>
                      );
                    }
                    if (paragraph.startsWith('- ')) {
                      const items = paragraph.split('\n- ');
                      return (
                        <ul key={idx} className="list-disc pl-4 space-y-1 my-1">
                          {items.map((it, i) => (
                            <li key={i}>{it.replace(/^- /, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    if (paragraph.startsWith('```')) {
                      const codeClean = paragraph.replace(/```[a-z]*\n?/g, '').trim();
                      return (
                        <pre key={idx} className="p-2.5 my-1.5 bg-slate-950 rounded-lg font-mono text-[11px] text-purple-300 overflow-x-auto border border-slate-800">
                          <code>{codeClean}</code>
                        </pre>
                      );
                    }
                    return <p key={idx}>{paragraph}</p>;
                  })}
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/80 rounded-2xl border border-slate-800 w-fit text-xs text-slate-400 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>Gemini reasoning...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
        <div className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-purple-400" />
          <span>Recommended Questions</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors text-left"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask Copilot about nodes, errors, prompts..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
