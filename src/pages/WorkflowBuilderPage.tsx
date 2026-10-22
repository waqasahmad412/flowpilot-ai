import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WorkflowCanvas } from '../components/workflow/WorkflowCanvas';
import { workflowEngine } from '../services/workflowEngine';
import {
  ChevronsUpDown,
  Plus,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sparkles,
} from 'lucide-react';

export const WorkflowBuilderPage: React.FC = () => {
  const {
    workflows,
    selectedWorkflow,
    selectWorkflowById,
    saveWorkflow,
    createNewWorkflow,
    setCurrentPage,
    showToast,
  } = useApp();

  const [showFlowMenu, setShowFlowMenu] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // If no workflow is selected, pick the first or create one
  const currentWorkflow =
    selectedWorkflow || workflows[0] || createNewWorkflow('My First Pipeline');

  const validation = workflowEngine.validateWorkflow(currentWorkflow);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentWorkflow, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentWorkflow.name.replace(/\s+/g, '_')}_workflow.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast({ type: 'success', title: 'Export Complete', message: 'Workflow JSON downloaded.' });
  };

  const handleValidateClick = () => {
    setShowValidation(true);
    if (validation.valid) {
      showToast({ type: 'success', title: 'Workflow Valid', message: 'All connections and configurations verified.' });
    } else {
      showToast({ type: 'error', title: 'Validation Warning', message: validation.errors[0] || 'Errors detected.' });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950">
      {/* Builder Header Toolbar */}
      <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          {/* Workflow Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFlowMenu(!showFlowMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-xs font-bold text-slate-100 max-w-[180px] sm:max-w-xs truncate">
                {currentWorkflow.name}
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
            </button>

            {showFlowMenu && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-2">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Switch Workflow
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 my-1">
                  {workflows.map((flow) => (
                    <button
                      key={flow.id}
                      onClick={() => {
                        selectWorkflowById(flow.id);
                        setShowFlowMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-colors ${
                        flow.id === currentWorkflow.id
                          ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate">{flow.name}</div>
                        <div className="text-[10px] text-slate-500">{flow.category} · {flow.nodes.length} steps</div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono ml-2 uppercase">
                        {flow.status}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => {
                      const newFlow = createNewWorkflow();
                      selectWorkflowById(newFlow.id);
                      setShowFlowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-purple-300 hover:bg-purple-950/40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Workflow</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Validation Check Button */}
          <button
            onClick={handleValidateClick}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              validation.valid
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 border-amber-800/40 text-amber-300 hover:bg-amber-900/40'
            }`}
          >
            {validation.valid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{validation.valid ? 'Validated' : `${validation.errors.length + validation.warnings.length} Warnings`}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage('generator')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-purple-800/50 text-purple-300 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Generator</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            title="Export Workflow JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Validation Banner if errors exist */}
      {showValidation && !validation.valid && (
        <div className="px-6 py-2 bg-amber-950/40 border-b border-amber-900/60 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{validation.errors[0] || validation.warnings[0]}</span>
          </div>
          <button
            onClick={() => setShowValidation(false)}
            className="text-[11px] underline text-amber-400 hover:text-amber-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Visual Canvas */}
      <WorkflowCanvas workflow={currentWorkflow} onSave={saveWorkflow} />
    </div>
  );
};
