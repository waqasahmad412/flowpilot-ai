import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Workflow, WorkflowNode, WorkflowEdge, NodeType } from '../../types';
import { NodeCard } from './NodeCard';
import { NodeInspector } from './NodeInspector';
import { NodePaletteModal } from './NodePaletteModal';
import { ExecutionOutputModal } from './ExecutionOutputModal';
import { workflowEngine, ExecutionProgressEvent } from '../../services/workflowEngine';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Play,
  Save,
  RotateCcw,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
  Trash2,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';

interface WorkflowCanvasProps {
  workflow: Workflow;
  onSave: (workflow: Workflow) => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow: initialWorkflow,
  onSave,
}) => {
  const { showToast, theme } = useApp();

  // Working state of current workflow
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow);

  // Sync if prop changes externally
  useEffect(() => {
    setWorkflow(initialWorkflow);
  }, [initialWorkflow.id]);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<Workflow[]>([initialWorkflow]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = (newWorkflow: Workflow) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(newWorkflow);
    // Limit stack
    if (updated.length > 25) updated.shift();
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    setWorkflow(newWorkflow);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setWorkflow(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setWorkflow(next);
    }
  };

  // Canvas Viewport transform: Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Selection & Inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Palette & Output Modal
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [executionModalOpen, setExecutionModalOpen] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<any>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [activeStepStates, setActiveStepStates] = useState<Record<string, 'running' | 'success' | 'failed' | 'skipped'>>({});

  // Connecting Wires State
  const [connecting, setConnecting] = useState<{
    sourceNodeId: string;
    sourceHandle?: string;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Selected Edge for deletion
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Dragging Node on Canvas
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle Pan Start
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  };

  // Global mouse move for pan, drag node, or drawing wire
  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingNodeId) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const newX = Math.round((e.clientX - canvasRect.left - pan.x) / zoom - dragOffset.x);
      const newY = Math.round((e.clientY - canvasRect.top - pan.y) / zoom - dragOffset.y);

      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === draggingNodeId ? { ...n, position: { x: Math.max(20, newX), y: Math.max(20, newY) } } : n
        ),
      }));
    } else if (connecting) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      setConnecting((prev) =>
        prev
          ? {
              ...prev,
              currentX: (e.clientX - canvasRect.left - pan.x) / zoom,
              currentY: (e.clientY - canvasRect.top - pan.y) / zoom,
            }
          : null
      );
    }
  };

  const handleMouseUpCanvas = () => {
    if (isPanning) setIsPanning(false);
    if (draggingNodeId) {
      setDraggingNodeId(null);
      pushHistory(workflow);
    }
    if (connecting) setConnecting(null);
  };

  // Node Movement Start
  const handleStartDragNode = (nodeId: string, clientX: number, clientY: number) => {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseCanvasX = (clientX - canvasRect.left - pan.x) / zoom;
    const mouseCanvasY = (clientY - canvasRect.top - pan.y) / zoom;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: mouseCanvasX - node.position.x,
      y: mouseCanvasY - node.position.y,
    });
  };

  // Connection Wire Start
  const handleStartConnect = (
    sourceNodeId: string,
    sourceHandle = 'out',
    clientX = 0,
    clientY = 0
  ) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const currX = canvasRect ? (clientX - canvasRect.left - pan.x) / zoom : 0;
    const currY = canvasRect ? (clientY - canvasRect.top - pan.y) / zoom : 0;

    setConnecting({
      sourceNodeId,
      sourceHandle,
      currentX: currX,
      currentY: currY,
    });
  };

  // Connection Wire End
  const handleEndConnect = (targetNodeId: string, targetHandle = 'in') => {
    if (!connecting) return;

    if (connecting.sourceNodeId === targetNodeId) {
      showToast({ type: 'warning', title: 'Invalid Connection', message: 'Cannot connect a node to itself.' });
      setConnecting(null);
      return;
    }

    // Check if edge already exists
    const exists = workflow.edges.some(
      (e) => e.source === connecting.sourceNodeId && e.target === targetNodeId
    );

    if (exists) {
      showToast({ type: 'info', title: 'Already Connected', message: 'These nodes are already linked.' });
      setConnecting(null);
      return;
    }

    const newEdge: WorkflowEdge = {
      id: `e_${connecting.sourceNodeId}_${targetNodeId}_${Date.now().toString(36)}`,
      source: connecting.sourceNodeId,
      target: targetNodeId,
      sourceHandle: connecting.sourceHandle,
      targetHandle,
    };

    const updatedWorkflow: Workflow = {
      ...workflow,
      edges: [...workflow.edges, newEdge],
    };

    pushHistory(updatedWorkflow);
    setConnecting(null);
    showToast({ type: 'success', title: 'Connected', message: 'Nodes linked successfully.' });
  };

  // Delete Edge
  const handleDeleteEdge = (edgeId: string) => {
    const updated: Workflow = {
      ...workflow,
      edges: workflow.edges.filter((e) => e.id !== edgeId),
    };
    pushHistory(updated);
    setSelectedEdgeId(null);
    showToast({ type: 'info', title: 'Connection Removed', message: 'Link disconnected.' });
  };

  // Add Node from Palette
  const handleAddNode = (type: NodeType, name: string) => {
    // Determine placement around canvas center
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const centerX = canvasRect ? (canvasRect.width / 2 - pan.x) / zoom : 400;
    const centerY = canvasRect ? (canvasRect.height / 2 - pan.y) / zoom : 300;

    const newNode: WorkflowNode = {
      id: `node_${Date.now().toString(36)}`,
      type,
      name,
      position: { x: Math.round(centerX - 130), y: Math.round(centerY - 50) },
      config: type === 'ai_gemini' ? { prompt: 'Analyze input data with Gemini', model: 'gemini-3.8-flash' } : {},
    };

    const updated: Workflow = {
      ...workflow,
      nodes: [...workflow.nodes, newNode],
    };

    pushHistory(updated);
    setSelectedNodeId(newNode.id);
  };

  // Update Node config
  const handleUpdateNode = (updatedNode: WorkflowNode) => {
    const updated: Workflow = {
      ...workflow,
      nodes: workflow.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)),
    };
    setWorkflow(updated);
  };

  // Duplicate Node
  const handleDuplicateNode = (nodeId: string) => {
    const source = workflow.nodes.find((n) => n.id === nodeId);
    if (!source) return;

    const clonedNode: WorkflowNode = {
      ...source,
      id: `node_${Date.now().toString(36)}`,
      name: `${source.name} (Copy)`,
      position: { x: source.position.x + 40, y: source.position.y + 40 },
    };

    const updated: Workflow = {
      ...workflow,
      nodes: [...workflow.nodes, clonedNode],
    };

    pushHistory(updated);
    setSelectedNodeId(clonedNode.id);
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    const updated: Workflow = {
      ...workflow,
      nodes: workflow.nodes.filter((n) => n.id !== nodeId),
      edges: workflow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    };
    pushHistory(updated);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Fit View
  const handleFitView = () => {
    if (workflow.nodes.length === 0) {
      setPan({ x: 40, y: 40 });
      setZoom(1);
      return;
    }

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    workflow.nodes.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      maxX = Math.max(maxX, n.position.x + 260);
      minY = Math.min(minY, n.position.y);
      maxY = Math.max(maxY, n.position.y + 140);
    });

    const canvasWidth = canvasRef.current?.clientWidth || 1000;
    const canvasHeight = canvasRef.current?.clientHeight || 600;

    const requiredW = maxX - minX + 100;
    const requiredH = maxY - minY + 100;

    const scale = Math.min(1.2, Math.max(0.4, Math.min(canvasWidth / requiredW, canvasHeight / requiredH)));
    setZoom(scale);
    setPan({
      x: (canvasWidth - (maxX + minX) * scale) / 2,
      y: (canvasHeight - (maxY + minY) * scale) / 2,
    });
  };

  // Run Test Execution
  const handleTestRun = async () => {
    const validation = workflowEngine.validateWorkflow(workflow);
    if (!validation.valid) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: validation.errors[0] || 'Please fix workflow configuration errors before testing.',
      });
      return;
    }

    setIsTestRunning(true);
    setActiveStepStates({});
    showToast({ type: 'info', title: 'Test Initiated', message: 'Executing workflow nodes step-by-step...' });

    try {
      const executionResult = await workflowEngine.executeWorkflow(
        workflow,
        {
          testEventId: 'test_' + Date.now(),
          initiatedBy: 'Workflow Builder Test Runner',
          mockPayload: { customer: 'Sarah Connor', topic: 'API Rate Limits' },
        },
        (progressEvent: ExecutionProgressEvent) => {
          setActiveStepStates((prev) => ({
            ...prev,
            [progressEvent.nodeId]: progressEvent.status,
          }));
        }
      );

      setCurrentExecution(executionResult);
      setExecutionModalOpen(true);

      if (executionResult.status === 'success') {
        showToast({
          type: 'success',
          title: 'Test Completed',
          message: `All ${executionResult.steps.length} steps succeeded in ${executionResult.durationMs}ms.`,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Test Failed',
          message: executionResult.error || 'Execution encountered an error.',
        });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Execution Exception', message: err.message });
    } finally {
      setIsTestRunning(false);
    }
  };

  // Node coordinate lookup for rendering bezier connection curves
  const getNodeHandleCoord = (
    nodeId: string,
    handleType: 'in' | 'out' | 'true' | 'false'
  ) => {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const nodeWidth = 256;
    const nodeHeight = 110;

    if (handleType === 'in') {
      return { x: node.position.x, y: node.position.y + nodeHeight / 2 };
    }
    if (handleType === 'true') {
      return { x: node.position.x + nodeWidth, y: node.position.y + nodeHeight * 0.35 };
    }
    if (handleType === 'false') {
      return { x: node.position.x + nodeWidth, y: node.position.y + nodeHeight * 0.68 };
    }
    return { x: node.position.x + nodeWidth, y: node.position.y + nodeHeight / 2 };
  };

  const selectedNode = workflow.nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="relative flex-1 h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-950 select-none">
      {/* Canvas Area */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        className={`relative flex-1 h-full overflow-hidden cursor-grab active:cursor-grabbing ${
          theme === 'dark' ? 'canvas-grid-dark' : 'canvas-grid-light'
        }`}
      >
        {/* Transformable Canvas Content */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* SVG Connection Edges */}
          <svg className="absolute overflow-visible w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>

            {workflow.edges.map((edge) => {
              const srcCoord = getNodeHandleCoord(
                edge.source,
                (edge.sourceHandle as any) || 'out'
              );
              const tgtCoord = getNodeHandleCoord(
                edge.target,
                (edge.targetHandle as any) || 'in'
              );

              const dx = Math.max(50, Math.abs(tgtCoord.x - srcCoord.x) * 0.5);
              const pathD = `M ${srcCoord.x} ${srcCoord.y} C ${srcCoord.x + dx} ${srcCoord.y}, ${tgtCoord.x - dx} ${tgtCoord.y}, ${tgtCoord.x} ${tgtCoord.y}`;
              const isSelectedEdge = selectedEdgeId === edge.id;

              return (
                <g key={edge.id} className="pointer-events-auto group/edge cursor-pointer">
                  {/* Invisible thicker stroke for easy clicking */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                    }}
                  />
                  {/* Visible Edge */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isSelectedEdge
                        ? '#ec4899'
                        : edge.sourceHandle === 'false'
                        ? '#f43f5e'
                        : edge.sourceHandle === 'true'
                        ? '#10b981'
                        : 'url(#edgeGradient)'
                    }
                    strokeWidth={isSelectedEdge ? 3.5 : 2.5}
                    strokeDasharray={isSelectedEdge ? '5 5' : undefined}
                    className="transition-all hover:stroke-purple-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                    }}
                  />
                  {/* Midpoint Delete Button if selected */}
                  {isSelectedEdge && (
                    <g
                      transform={`translate(${(srcCoord.x + tgtCoord.x) / 2}, ${(srcCoord.y + tgtCoord.y) / 2})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEdge(edge.id);
                      }}
                      className="cursor-pointer"
                    >
                      <circle r={11} fill="#e11d48" className="shadow-lg hover:fill-rose-700" />
                      <text
                        textAnchor="middle"
                        dy=".3em"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        ×
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Currently Dragging Connection Wire */}
            {connecting && (
              <path
                d={`M ${getNodeHandleCoord(connecting.sourceNodeId, (connecting.sourceHandle as any) || 'out').x} ${
                  getNodeHandleCoord(connecting.sourceNodeId, (connecting.sourceHandle as any) || 'out').y
                } C ${
                  getNodeHandleCoord(connecting.sourceNodeId, (connecting.sourceHandle as any) || 'out').x + 50
                } ${
                  getNodeHandleCoord(connecting.sourceNodeId, (connecting.sourceHandle as any) || 'out').y
                }, ${connecting.currentX - 50} ${connecting.currentY}, ${connecting.currentX} ${
                  connecting.currentY
                }`}
                fill="none"
                stroke="#c084fc"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Node Cards on Canvas */}
          {workflow.nodes.map((node) => (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: node.position.x,
                top: node.position.y,
              }}
              onMouseDown={(e) => {
                // Ignore if clicked on input/button/handle
                if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'INPUT') return;
                handleStartDragNode(node.id, e.clientX, e.clientY);
              }}
              className="pointer-events-auto"
            >
              <NodeCard
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={(n) => {
                  setSelectedNodeId(n.id);
                  setSelectedEdgeId(null);
                }}
                onDelete={handleDeleteNode}
                onDuplicate={handleDuplicateNode}
                onStartConnect={handleStartConnect}
                onEndConnect={handleEndConnect}
                executionStatus={activeStepStates[node.id]}
              />
            </div>
          ))}
        </div>

        {/* Top Floating Controls Bar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1.5 rounded-2xl shadow-xl">
          {/* Status Switcher */}
          <div className="relative">
            <select
              value={workflow.status}
              onChange={(e) => {
                const updated: Workflow = {
                  ...workflow,
                  status: e.target.value as any,
                };
                setWorkflow(updated);
                pushHistory(updated);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none capitalize"
            >
              <option value="draft">Draft</option>
              <option value="active">Active (Production)</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {/* Add Step Button */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Node</span>
          </button>

          {/* Test Run Button */}
          <button
            onClick={handleTestRun}
            disabled={isTestRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isTestRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{isTestRunning ? 'Executing...' : 'Test Run'}</span>
          </button>

          {/* Save Workflow Button */}
          <button
            onClick={() => onSave(workflow)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save</span>
          </button>
        </div>

        {/* Floating Zoom & Canvas Navigator Toolbar */}
        <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1.5 rounded-2xl shadow-xl">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => setZoom((prev) => Math.max(0.3, prev - 0.1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((prev) => Math.min(2.0, prev + 0.1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitView}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Minimap in Bottom Right */}
        <div className="hidden md:block absolute bottom-5 right-5 z-10 w-36 h-24 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1.5 overflow-hidden shadow-lg pointer-events-none">
          <div className="relative w-full h-full bg-slate-950/60 rounded">
            {workflow.nodes.map((n) => (
              <div
                key={n.id}
                style={{
                  left: `${Math.min(90, Math.max(5, (n.position.x / 1400) * 100))}%`,
                  top: `${Math.min(85, Math.max(5, (n.position.y / 800) * 100))}%`,
                }}
                className={`absolute w-3 h-2 rounded-xs ${
                  selectedNodeId === n.id ? 'bg-purple-400 ring-1 ring-white' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <NodeInspector
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={handleUpdateNode}
          onDelete={handleDeleteNode}
          onDuplicate={handleDuplicateNode}
        />
      )}

      {/* Palette Modal */}
      <NodePaletteModal
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAddNode={handleAddNode}
      />

      {/* Execution Output Modal */}
      <ExecutionOutputModal
        execution={currentExecution}
        isOpen={executionModalOpen}
        onClose={() => setExecutionModalOpen(false)}
        onRerun={handleTestRun}
        isRunning={isTestRunning}
      />
    </div>
  );
};
