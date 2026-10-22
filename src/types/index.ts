/**
 * FlowPilot AI - Core TypeScript Definitions
 */

export type NodeType =
  | 'manual_trigger'
  | 'schedule_trigger'
  | 'webhook_trigger'
  | 'ai_gemini'
  | 'text_input'
  | 'http_request'
  | 'condition'
  | 'data_transform'
  | 'google_sheets'
  | 'gmail'
  | 'delay'
  | 'notification'
  | 'output';

export type NodeCategory = 'trigger' | 'ai' | 'action' | 'logic' | 'integration' | 'output';

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error';

export type ExecutionStatus = 'success' | 'failed' | 'running' | 'cancelled';

export interface NodePosition {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  position: NodePosition;
  config: Record<string, any>;
  customLabel?: string;
  category?: NodeCategory;
  inputs?: string[];
  outputs?: string[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // e.g. 'out' or 'true' or 'false'
  targetHandle?: string; // e.g. 'in'
  label?: string;
}

export type StorageBackendType = 'firebase' | 'demo';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  workspaceId: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
  successRate: number; // 0 to 100
  tags: string[];
}

export interface NodeExecutionResult {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  status: 'success' | 'failed' | 'skipped' | 'running';
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  input: any;
  output: any;
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  triggeredBy: 'manual' | 'schedule' | 'webhook' | 'api' | 'test';
  steps: NodeExecutionResult[];
  error?: string;
  tokensUsed?: number;
  workspaceId: string;
  ownerId?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedRunsPerMonth: string;
  integrations: string[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  tags: string[];
  featured?: boolean;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  status: 'connected' | 'not_configured' | 'pending_auth' | 'error';
  authType: 'oauth' | 'api_key' | 'webhook' | 'native';
  scopes?: string[];
  configFields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'select' | 'textarea';
    placeholder?: string;
    options?: { label: string; value: string }[];
    required: boolean;
  }[];
  configValues: Record<string, string>;
  lastVerifiedAt?: string;
  docsUrl?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  workflowId?: string;
  executionId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'Owner' | 'Admin' | 'Member';
  avatar?: string;
  timezone: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: 'Pro Trial' | 'Enterprise';
  createdAt: string;
}

export interface AnalyticsSummary {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  activeWorkflows: number;
  totalWorkflows: number;
  estimatedHoursSaved: number;
  avgDurationMs: number;
  dailyStats: {
    date: string;
    success: number;
    failed: number;
    total: number;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedWorkflow?: Partial<Workflow>;
}
