/**
 * FlowPilot AI - Storage Adapter & Data Layer
 *
 * Implements a dual-backend architecture:
 * 1. Local Demo Adapter (Persistent browser LocalStorage with rich starter automations)
 * 2. Firebase Adapter (Cloud Firestore + Firebase Auth with user data isolation)
 */

import {
  Workflow,
  WorkflowExecution,
  Integration,
  AppNotification,
  UserProfile,
  Workspace,
  Template,
} from '../types';
import {
  isFirebaseConfigured,
  getFirebaseDb,
  getFirebaseAuth,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

export type StorageBackendType = 'firebase' | 'demo';

const STORAGE_KEYS = {
  BACKEND_MODE: 'flowpilot_backend_mode',
  USER: 'flowpilot_user',
  WORKSPACE: 'flowpilot_workspace',
  WORKFLOWS: 'flowpilot_workflows',
  EXECUTIONS: 'flowpilot_executions',
  INTEGRATIONS: 'flowpilot_integrations',
  NOTIFICATIONS: 'flowpilot_notifications',
  TEMPLATES: 'flowpilot_templates',
  THEME: 'flowpilot_theme',
};

// Initial default user for local demo mode
export const DEFAULT_USER: UserProfile = {
  id: 'usr_flowpilot_admin',
  email: 'admin@flowpilot.ai',
  name: 'Waqas Ahmad',
  role: 'Owner',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  timezone: 'America/Los_Angeles (UTC-7)',
  createdAt: '2026-01-15T08:00:00Z',
};

// Initial default workspace
export const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws_production',
  name: 'Production Automations',
  slug: 'production-automations',
  ownerId: DEFAULT_USER.id,
  plan: 'Enterprise',
  createdAt: '2026-01-15T08:00:00Z',
};

// High-quality starter workflows
export const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf_customer_support',
    name: 'Customer Support Triager & Auto-Responder',
    description: 'Watches new Zendesk/Webhook support tickets, evaluates intent and sentiment using Gemini, and drafts tailored responses.',
    category: 'Customer Support',
    status: 'active',
    workspaceId: DEFAULT_WORKSPACE.id,
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-27T14:30:00Z',
    lastExecutedAt: '2026-09-28T05:15:00Z',
    executionCount: 142,
    successRate: 98,
    tags: ['Zendesk', 'Gemini AI', 'Gmail', 'Urgent'],
    nodes: [
      {
        id: 'node_1',
        type: 'webhook_trigger',
        name: 'Inbound Ticket Webhook',
        position: { x: 80, y: 220 },
        config: { path: '/webhooks/support-tickets', method: 'POST', secretAuth: true },
      },
      {
        id: 'node_2',
        type: 'data_transform',
        name: 'Extract Ticket Payload',
        position: { x: 380, y: 220 },
        config: { mapping: 'JSON.parse(input.body)', extractFields: 'customerEmail, subject, body' },
      },
      {
        id: 'node_3',
        type: 'ai_gemini',
        name: 'Gemini Intent Classifier',
        position: { x: 680, y: 220 },
        config: {
          prompt: 'Categorize this support ticket into Billing, Bug, or Inquiry, rate sentiment (1-10), and draft a helpful initial reply.',
          model: 'gemini-3.8-flash',
          temperature: 0.2,
          systemInstruction: 'You are an empathetic, precise customer experience engineer.',
        },
      },
      {
        id: 'node_4',
        type: 'condition',
        name: 'Check If High Priority',
        position: { x: 980, y: 220 },
        config: { field: 'sentiment', operator: 'less_than', value: '4' },
      },
      {
        id: 'node_5',
        type: 'notification',
        name: 'Alert On-Call in Slack',
        position: { x: 1280, y: 130 },
        config: { channel: '#support-critical', message: 'Escalated unhappy customer ticket detected.' },
      },
      {
        id: 'node_6',
        type: 'gmail',
        name: 'Draft Email Reply',
        position: { x: 1280, y: 320 },
        config: { recipient: '{{node_2.customerEmail}}', subject: 'Re: {{node_2.subject}}', action: 'draft' },
      },
      {
        id: 'node_7',
        type: 'output',
        name: 'Audit Log Output',
        position: { x: 1560, y: 220 },
        config: { logPayload: true },
      },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2' },
      { id: 'e2', source: 'node_2', target: 'node_3' },
      { id: 'e3', source: 'node_3', target: 'node_4' },
      { id: 'e4', source: 'node_4', target: 'node_5', sourceHandle: 'true' },
      { id: 'e5', source: 'node_4', target: 'node_6', sourceHandle: 'false' },
      { id: 'e6', source: 'node_5', target: 'node_7' },
      { id: 'e7', source: 'node_6', target: 'node_7' },
    ],
  },
  {
    id: 'wf_daily_briefing',
    name: 'Executive Daily KPI & News Digest',
    description: 'Runs every weekday at 7:30 AM to pull sales numbers, synthesize with AI, and broadcast to Slack.',
    category: 'Business Automation',
    status: 'active',
    workspaceId: DEFAULT_WORKSPACE.id,
    createdAt: '2026-09-18T08:00:00Z',
    updatedAt: '2026-09-26T12:00:00Z',
    lastExecutedAt: '2026-09-28T07:30:00Z',
    executionCount: 56,
    successRate: 100,
    tags: ['Cron', 'Slack', 'Analytics', 'Daily'],
    nodes: [
      {
        id: 'node_1',
        type: 'schedule_trigger',
        name: 'Weekdays at 7:30 AM',
        position: { x: 100, y: 220 },
        config: { cron: '30 7 * * 1-5', timezone: 'America/New_York' },
      },
      {
        id: 'node_2',
        type: 'http_request',
        name: 'Fetch CRM Metrics',
        position: { x: 400, y: 220 },
        config: { method: 'GET', url: 'https://api.flowpilot.ai/mock/crm/metrics', timeout: 5000 },
      },
      {
        id: 'node_3',
        type: 'ai_gemini',
        name: 'Gemini Executive Synthesis',
        position: { x: 700, y: 220 },
        config: {
          prompt: 'Synthesize CRM metrics into a 3-bullet executive summary with conversion trend highlights.',
          model: 'gemini-3.8-flash',
          temperature: 0.3,
        },
      },
      {
        id: 'node_4',
        type: 'notification',
        name: 'Send Slack Announcement',
        position: { x: 1000, y: 220 },
        config: { channel: '#leadership-updates', title: 'Daily KPI Digest' },
      },
      {
        id: 'node_5',
        type: 'output',
        name: 'Save Daily Archive',
        position: { x: 1300, y: 220 },
        config: { destination: 's3_bucket' },
      },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2' },
      { id: 'e2', source: 'node_2', target: 'node_3' },
      { id: 'e3', source: 'node_3', target: 'node_4' },
      { id: 'e4', source: 'node_4', target: 'node_5' },
    ],
  },
  {
    id: 'wf_sheets_sync',
    name: 'Google Sheets Lead Enricher & Deduplicator',
    description: 'Monitors incoming form entries, enriches company domain info via Gemini AI, and appends clean data to Google Sheets.',
    category: 'Data Processing',
    status: 'paused',
    workspaceId: DEFAULT_WORKSPACE.id,
    createdAt: '2026-09-15T11:00:00Z',
    updatedAt: '2026-09-25T16:20:00Z',
    lastExecutedAt: '2026-09-27T18:40:00Z',
    executionCount: 89,
    successRate: 94,
    tags: ['Google Sheets', 'Enrichment', 'Leads'],
    nodes: [
      {
        id: 'node_1',
        type: 'manual_trigger',
        name: 'Manual / Form Intake',
        position: { x: 100, y: 220 },
        config: {},
      },
      {
        id: 'node_2',
        type: 'ai_gemini',
        name: 'Gemini Company Profiler',
        position: { x: 420, y: 220 },
        config: {
          prompt: 'Given the contact email and company name, estimate company size, industry, and tech stack focus.',
          model: 'gemini-3.8-flash',
        },
      },
      {
        id: 'node_3',
        type: 'google_sheets',
        name: 'Append Enriched Row',
        position: { x: 740, y: 220 },
        config: { spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', sheet: 'Leads' },
      },
      {
        id: 'node_4',
        type: 'output',
        name: 'Completion Result',
        position: { x: 1060, y: 220 },
        config: {},
      },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2' },
      { id: 'e2', source: 'node_2', target: 'node_3' },
      { id: 'e3', source: 'node_3', target: 'node_4' },
    ],
  },
];

// Initial realistic executions
export const INITIAL_EXECUTIONS: WorkflowExecution[] = [
  {
    id: 'exec_894101',
    workflowId: 'wf_customer_support',
    workflowName: 'Customer Support Triager & Auto-Responder',
    status: 'success',
    startedAt: '2026-09-28T05:14:58Z',
    completedAt: '2026-09-28T05:15:02Z',
    durationMs: 3820,
    triggeredBy: 'webhook',
    workspaceId: DEFAULT_WORKSPACE.id,
    tokensUsed: 142,
    steps: [
      {
        nodeId: 'node_1',
        nodeName: 'Inbound Ticket Webhook',
        nodeType: 'webhook_trigger',
        status: 'success',
        startedAt: '2026-09-28T05:14:58Z',
        completedAt: '2026-09-28T05:14:58Z',
        durationMs: 45,
        input: { method: 'POST', bodySize: '1.2kb' },
        output: { ticketId: 'TCK-9902', customerEmail: 'sarah.connor@acme.corp', subject: 'API latency spike during batch sync' },
      },
      {
        nodeId: 'node_2',
        nodeName: 'Extract Ticket Payload',
        nodeType: 'data_transform',
        status: 'success',
        startedAt: '2026-09-28T05:14:58Z',
        completedAt: '2026-09-28T05:14:59Z',
        durationMs: 12,
        input: { ticketId: 'TCK-9902' },
        output: { parsed: true, sanitizedText: 'API latency spike during batch sync' },
      },
      {
        nodeId: 'node_3',
        nodeName: 'Gemini Intent Classifier',
        nodeType: 'ai_gemini',
        status: 'success',
        startedAt: '2026-09-28T05:14:59Z',
        completedAt: '2026-09-28T05:15:01Z',
        durationMs: 2410,
        input: { prompt: 'Analyze support ticket' },
        output: { category: 'Bug', sentiment: 3, urgency: 'High', proposedDraft: 'Hello Sarah, our engineering squad is looking into batch latency immediately.' },
      },
      {
        nodeId: 'node_4',
        nodeName: 'Check If High Priority',
        nodeType: 'condition',
        status: 'success',
        startedAt: '2026-09-28T05:15:01Z',
        completedAt: '2026-09-28T05:15:01Z',
        durationMs: 8,
        input: { sentiment: 3, threshold: 4 },
        output: { branch: 'true', reason: 'Sentiment 3 is lower than 4' },
      },
      {
        nodeId: 'node_5',
        nodeName: 'Alert On-Call in Slack',
        nodeType: 'notification',
        status: 'success',
        startedAt: '2026-09-28T05:15:01Z',
        completedAt: '2026-09-28T05:15:02Z',
        durationMs: 820,
        input: { channel: '#support-critical' },
        output: { delivered: true, messageTs: '1727500502.102' },
      },
      {
        nodeId: 'node_7',
        nodeName: 'Audit Log Output',
        nodeType: 'output',
        status: 'success',
        startedAt: '2026-09-28T05:15:02Z',
        completedAt: '2026-09-28T05:15:02Z',
        durationMs: 15,
        input: { logged: true },
        output: { executionCompleted: true },
      },
    ],
  },
  {
    id: 'exec_894088',
    workflowId: 'wf_daily_briefing',
    workflowName: 'Executive Daily KPI & News Digest',
    status: 'success',
    startedAt: '2026-09-28T07:30:00Z',
    completedAt: '2026-09-28T07:30:04Z',
    durationMs: 4120,
    triggeredBy: 'schedule',
    workspaceId: DEFAULT_WORKSPACE.id,
    tokensUsed: 198,
    steps: [
      {
        nodeId: 'node_1',
        nodeName: 'Weekdays at 7:30 AM',
        nodeType: 'schedule_trigger',
        status: 'success',
        startedAt: '2026-09-28T07:30:00Z',
        completedAt: '2026-09-28T07:30:00Z',
        durationMs: 10,
        input: { cron: '30 7 * * 1-5' },
        output: { scheduledTime: '07:30:00 UTC' },
      },
      {
        nodeId: 'node_2',
        nodeName: 'Fetch CRM Metrics',
        nodeType: 'http_request',
        status: 'success',
        startedAt: '2026-09-28T07:30:00Z',
        completedAt: '2026-09-28T07:30:01Z',
        durationMs: 1200,
        input: { url: 'https://api.flowpilot.ai/mock/crm/metrics' },
        output: { newArr: '$24,500', closedDeals: 6, pipelineGrowth: '+14%' },
      },
      {
        nodeId: 'node_3',
        nodeName: 'Gemini Executive Synthesis',
        nodeType: 'ai_gemini',
        status: 'success',
        startedAt: '2026-09-28T07:30:01Z',
        completedAt: '2026-09-28T07:30:03Z',
        durationMs: 2100,
        input: { metrics: '6 closed deals' },
        output: { summaryText: 'Solid start to Monday: ARR up 14% week-over-week driven by 6 closed enterprise contracts.' },
      },
      {
        nodeId: 'node_4',
        nodeName: 'Send Slack Announcement',
        nodeType: 'notification',
        status: 'success',
        startedAt: '2026-09-28T07:30:03Z',
        completedAt: '2026-09-28T07:30:04Z',
        durationMs: 780,
        input: { channel: '#leadership-updates' },
        output: { sent: true },
      },
      {
        nodeId: 'node_5',
        nodeName: 'Save Daily Archive',
        nodeType: 'output',
        status: 'success',
        startedAt: '2026-09-28T07:30:04Z',
        completedAt: '2026-09-28T07:30:04Z',
        durationMs: 30,
        input: {},
        output: { archived: true },
      },
    ],
  },
];

// Initial integrations configuration
export const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'int_gemini',
    name: 'Google Gemini AI',
    category: 'AI Models',
    description: 'High-speed multimodality and reasoning powered by Gemini 3.8 Flash SDK.',
    icon: 'Sparkles',
    status: 'connected',
    authType: 'native',
    configFields: [
      { key: 'model', label: 'Default Model', type: 'select', options: [{ label: 'gemini-3.8-flash', value: 'gemini-3.8-flash' }, { label: 'gemini-3.1-pro-preview', value: 'gemini-3.1-pro-preview' }], required: true },
      { key: 'temperature', label: 'Default Temperature', type: 'text', placeholder: '0.4', required: false },
    ],
    configValues: { model: 'gemini-3.8-flash', temperature: '0.4' },
    lastVerifiedAt: '2026-09-28T06:00:00Z',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
  },
  {
    id: 'int_sheets',
    name: 'Google Sheets',
    category: 'Databases & Storage',
    description: 'Read and append records directly to cloud spreadsheets in real time.',
    icon: 'Table',
    status: 'not_configured',
    authType: 'oauth',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    configFields: [
      { key: 'clientId', label: 'Google Client ID', type: 'text', placeholder: 'xxxx.apps.googleusercontent.com', required: true },
      { key: 'defaultSpreadsheet', label: 'Default Spreadsheet ID', type: 'text', placeholder: 'e.g. 1BxiMVs0XRA5...', required: false },
    ],
    configValues: {},
    docsUrl: 'https://developers.google.com/sheets/api',
  },
  {
    id: 'int_gmail',
    name: 'Gmail',
    category: 'Communication',
    description: 'Send alerts, generate email drafts, and trigger workflows on new incoming messages.',
    icon: 'Mail',
    status: 'not_configured',
    authType: 'oauth',
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.compose'],
    configFields: [
      { key: 'senderAlias', label: 'Default Sender Alias', type: 'text', placeholder: 'Automation Bot <bot@company.com>', required: false },
    ],
    configValues: {},
    docsUrl: 'https://developers.google.com/gmail/api',
  },
  {
    id: 'int_slack',
    name: 'Slack',
    category: 'Communication',
    description: 'Post structured incident alerts, executive digests, and interactive message buttons.',
    icon: 'MessageSquare',
    status: 'connected',
    authType: 'webhook',
    configFields: [
      { key: 'webhookUrl', label: 'Incoming Webhook URL', type: 'password', placeholder: 'https://hooks.slack.com/services/...', required: true },
      { key: 'defaultChannel', label: 'Default Channel', type: 'text', placeholder: '#automation-feed', required: false },
    ],
    configValues: { webhookUrl: 'https://hooks.slack.com/services/DEMO_KEY_CONFIGURED', defaultChannel: '#general-alerts' },
    lastVerifiedAt: '2026-09-27T10:00:00Z',
    docsUrl: 'https://api.slack.com/messaging/webhooks',
  },
  {
    id: 'int_discord',
    name: 'Discord',
    category: 'Communication',
    description: 'Send embedded messages and bot notifications to Discord channels.',
    icon: 'Send',
    status: 'not_configured',
    authType: 'webhook',
    configFields: [
      { key: 'webhookUrl', label: 'Discord Webhook URL', type: 'password', placeholder: 'https://discord.com/api/webhooks/...', required: true },
      { key: 'botName', label: 'Bot Override Name', type: 'text', placeholder: 'FlowPilot Dispatcher', required: false },
    ],
    configValues: {},
  },
  {
    id: 'int_webhooks',
    name: 'Custom Webhooks',
    category: 'Core Protocols',
    description: 'HTTP POST/GET ingestion engine with HMAC signature validation.',
    icon: 'Webhook',
    status: 'connected',
    authType: 'native',
    configFields: [
      { key: 'secretToken', label: 'HMAC Signing Secret', type: 'password', placeholder: 'auto-generated-token', required: false },
      { key: 'rateLimit', label: 'Max Requests / Min', type: 'text', placeholder: '600', required: false },
    ],
    configValues: { rateLimit: '600' },
    lastVerifiedAt: '2026-09-28T06:00:00Z',
  },
  {
    id: 'int_rest_api',
    name: 'Generic REST APIs',
    category: 'Core Protocols',
    description: 'Execute arbitrary HTTP requests with custom headers, body payloads, and Bearer tokens.',
    icon: 'Globe',
    status: 'connected',
    authType: 'api_key',
    configFields: [
      { key: 'defaultTimeout', label: 'Timeout (ms)', type: 'text', placeholder: '10000', required: false },
    ],
    configValues: { defaultTimeout: '10000' },
  },
  {
    id: 'int_calendar',
    name: 'Google Calendar',
    category: 'Productivity',
    description: 'Create automated events, sync scheduled tasks, and extract daily agendas.',
    icon: 'Calendar',
    status: 'not_configured',
    authType: 'oauth',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    configFields: [
      { key: 'calendarId', label: 'Primary Calendar ID', type: 'text', placeholder: 'primary', required: true },
    ],
    configValues: {},
  },
];

// Initial templates
export const INITIAL_TEMPLATES: Template[] = [
  {
    id: 'tpl_support_triage',
    name: 'AI Support Ticket Categorizer & Urgency Escalatator',
    description: 'Automatically analyzes incoming customer support inquiries with Gemini AI, assigns priority, and routes urgent tickets to Slack.',
    category: 'Customer Support',
    difficulty: 'Beginner',
    estimatedRunsPerMonth: '1,500 runs',
    integrations: ['Gemini AI', 'Slack', 'Webhooks'],
    featured: true,
    tags: ['Zendesk', 'Triage', 'Customer Care'],
    nodes: [
      { id: 't1', type: 'webhook_trigger', name: 'Ticket Ingestion', position: { x: 100, y: 200 }, config: {} },
      { id: 't2', type: 'ai_gemini', name: 'Analyze Sentiment & Topic', position: { x: 400, y: 200 }, config: { prompt: 'Extract topic and urgency.' } },
      { id: 't3', type: 'condition', name: 'Is Urgent?', position: { x: 700, y: 200 }, config: { field: 'urgency', operator: 'equals', value: 'urgent' } },
      { id: 't4', type: 'notification', name: 'Slack Urgent Alert', position: { x: 1000, y: 120 }, config: { channel: '#support-tier-3' } },
      { id: 't5', type: 'output', name: 'Ticket Logged', position: { x: 1000, y: 280 }, config: {} },
    ],
    edges: [
      { id: 'te1', source: 't1', target: 't2' },
      { id: 'te2', source: 't2', target: 't3' },
      { id: 'te3', source: 't3', target: 't4', sourceHandle: 'true' },
      { id: 'te4', source: 't3', target: 't5', sourceHandle: 'false' },
    ],
  },
  {
    id: 'tpl_email_summarizer',
    name: 'Daily Inbox Summarizer & Executive Brief',
    description: 'Pulls unread client emails, synthesizes key requests and action items into a clean morning briefing, and delivers to Slack or Email.',
    category: 'Email Automation',
    difficulty: 'Intermediate',
    estimatedRunsPerMonth: '30 runs',
    integrations: ['Gmail', 'Gemini AI', 'Slack'],
    featured: true,
    tags: ['Gmail', 'Executive', 'Productivity'],
    nodes: [
      { id: 'e1', type: 'schedule_trigger', name: 'Every Morning 8am', position: { x: 100, y: 200 }, config: { cron: '0 8 * * *' } },
      { id: 'e2', type: 'gmail', name: 'Fetch Unread Emails', position: { x: 400, y: 200 }, config: { filter: 'is:unread label:inbox' } },
      { id: 'e3', type: 'ai_gemini', name: 'Synthesize Action Items', position: { x: 700, y: 200 }, config: { prompt: 'Summarize email threads into 3 key action items.' } },
      { id: 'e4', type: 'notification', name: 'Send Morning Summary', position: { x: 1000, y: 200 }, config: { channel: '#daily-briefs' } },
      { id: 'e5', type: 'output', name: 'End Run', position: { x: 1300, y: 200 }, config: {} },
    ],
    edges: [
      { id: 'ee1', source: 'e1', target: 'e2' },
      { id: 'ee2', source: 'e2', target: 'e3' },
      { id: 'ee3', source: 'e3', target: 'e4' },
      { id: 'ee4', source: 'e4', target: 'e5' },
    ],
  },
  {
    id: 'tpl_sheets_organizer',
    name: 'Google Sheets Data Organizer & Enrichment',
    description: 'Listens for newly appended rows, fills in missing industry taxonomy using Gemini, and logs clean normalized records.',
    category: 'Data Processing',
    difficulty: 'Intermediate',
    estimatedRunsPerMonth: '800 runs',
    integrations: ['Google Sheets', 'Gemini AI'],
    tags: ['Sheets', 'ETL', 'Enrichment'],
    nodes: [
      { id: 's1', type: 'manual_trigger', name: 'Sheet Row Added', position: { x: 100, y: 200 }, config: {} },
      { id: 's2', type: 'data_transform', name: 'Parse Columns', position: { x: 400, y: 200 }, config: {} },
      { id: 's3', type: 'ai_gemini', name: 'Normalize & Categorize', position: { x: 700, y: 200 }, config: {} },
      { id: 's4', type: 'google_sheets', name: 'Update Row', position: { x: 1000, y: 200 }, config: {} },
      { id: 's5', type: 'output', name: 'Finished', position: { x: 1300, y: 200 }, config: {} },
    ],
    edges: [
      { id: 'se1', source: 's1', target: 's2' },
      { id: 'se2', source: 's2', target: 's3' },
      { id: 'se3', source: 's3', target: 's4' },
      { id: 'se4', source: 's4', target: 's5' },
    ],
  },
  {
    id: 'tpl_ai_content_repurposer',
    name: 'AI Multi-Channel Content Drafting & Repurposer',
    description: 'Transform blog drafts or product release notes into LinkedIn posts, Twitter threads, and newsletter snippets in seconds.',
    category: 'AI Content Generation',
    difficulty: 'Beginner',
    estimatedRunsPerMonth: '250 runs',
    integrations: ['Gemini AI', 'Text Input'],
    featured: true,
    tags: ['Social Media', 'Marketing', 'Writing'],
    nodes: [
      { id: 'c1', type: 'text_input', name: 'Article Draft Input', position: { x: 100, y: 200 }, config: {} },
      { id: 'c2', type: 'ai_gemini', name: 'Generate Twitter/X Thread', position: { x: 420, y: 120 }, config: {} },
      { id: 'c3', type: 'ai_gemini', name: 'Generate LinkedIn Post', position: { x: 420, y: 280 }, config: {} },
      { id: 'c4', type: 'data_transform', name: 'Merge Repurposed Content', position: { x: 740, y: 200 }, config: {} },
      { id: 'c5', type: 'output', name: 'Content Output', position: { x: 1060, y: 200 }, config: {} },
    ],
    edges: [
      { id: 'ce1', source: 'c1', target: 'c2' },
      { id: 'ce2', source: 'c1', target: 'c3' },
      { id: 'ce3', source: 'c2', target: 'c4' },
      { id: 'ce4', source: 'c3', target: 'c4' },
      { id: 'ce5', source: 'c4', target: 'c5' },
    ],
  },
  {
    id: 'tpl_ecommerce_cart_recovery',
    name: 'E-commerce Abandoned Cart Recovery & Personalization',
    description: 'Triggers on abandoned checkout webhook, uses Gemini to generate a tailored discount offer based on cart items, and sends email.',
    category: 'E-commerce',
    difficulty: 'Advanced',
    estimatedRunsPerMonth: '3,000 runs',
    integrations: ['Shopify Webhooks', 'Gemini AI', 'Gmail'],
    tags: ['Shopify', 'Retention', 'Revenue'],
    nodes: [
      { id: 'm1', type: 'webhook_trigger', name: 'Abandoned Cart Webhook', position: { x: 100, y: 200 }, config: {} },
      { id: 'm2', type: 'delay', name: 'Wait 2 Hours', position: { x: 380, y: 200 }, config: { durationSeconds: 7200 } },
      { id: 'm3', type: 'ai_gemini', name: 'Generate Personalized Offer', position: { x: 680, y: 200 }, config: {} },
      { id: 'm4', type: 'gmail', name: 'Send Cart Recovery Email', position: { x: 980, y: 200 }, config: {} },
      { id: 'm5', type: 'output', name: 'Track Recovery Event', position: { x: 1280, y: 200 }, config: {} },
    ],
    edges: [
      { id: 'me1', source: 'm1', target: 'm2' },
      { id: 'me2', source: 'm2', target: 'm3' },
      { id: 'me3', source: 'm3', target: 'm4' },
      { id: 'me4', source: 'm4', target: 'm5' },
    ],
  },
  {
    id: 'tpl_lead_qualification',
    name: 'B2B Inbound Lead Scorer & Routing',
    description: 'Receives form submission data, enriches company domain, scores ICP compatibility (1-100), and notifies SDR team.',
    category: 'Marketing Automation',
    difficulty: 'Intermediate',
    estimatedRunsPerMonth: '1,200 runs',
    integrations: ['Webhooks', 'Gemini AI', 'Slack'],
    tags: ['Leads', 'CRM', 'Sales'],
    nodes: [
      { id: 'l1', type: 'webhook_trigger', name: 'Form Ingestion', position: { x: 100, y: 200 }, config: {} },
      { id: 'l2', type: 'ai_gemini', name: 'Score ICP Fit', position: { x: 400, y: 200 }, config: {} },
      { id: 'l3', type: 'condition', name: 'Is Score > 75?', position: { x: 700, y: 200 }, config: {} },
      { id: 'l4', type: 'notification', name: 'Urgent SDR Alert', position: { x: 1000, y: 120 }, config: {} },
      { id: 'l5', type: 'output', name: 'Save Lead', position: { x: 1000, y: 280 }, config: {} },
    ],
    edges: [
      { id: 'le1', source: 'l1', target: 'l2' },
      { id: 'le2', source: 'l2', target: 'l3' },
      { id: 'le3', source: 'l3', target: 'l4', sourceHandle: 'true' },
      { id: 'le4', source: 'l3', target: 'l5', sourceHandle: 'false' },
    ],
  },
];

// Initial notifications
export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Customer Support Triager executed',
    message: 'High priority ticket from Acme Corp processed and routed to Slack.',
    type: 'success',
    timestamp: '2026-09-28T05:15:02Z',
    read: false,
    workflowId: 'wf_customer_support',
    executionId: 'exec_894101',
  },
  {
    id: 'notif_2',
    title: 'Daily KPI Digest published',
    message: 'Weekday executive summary generated and sent to #leadership-updates.',
    type: 'info',
    timestamp: '2026-09-28T07:30:04Z',
    read: true,
    workflowId: 'wf_daily_briefing',
    executionId: 'exec_894088',
  },
];

// Local storage helper functions
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.error(`Failed to persist to localStorage [${key}]:`, err);
  }
}

// Global storage adapter
export const storage = {
  // Backend Detection & Mode
  getStorageMode(): StorageBackendType {
    if (typeof localStorage !== 'undefined') {
      const explicit = localStorage.getItem(STORAGE_KEYS.BACKEND_MODE) as StorageBackendType;
      if (explicit === 'demo' || explicit === 'firebase') return explicit;
    }
    return isFirebaseConfigured() ? 'firebase' : 'demo';
  },

  setStorageMode(mode: StorageBackendType): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BACKEND_MODE, mode);
    }
  },

  isFirebaseMode(): boolean {
    return this.getStorageMode() === 'firebase' && isFirebaseConfigured();
  },

  // 1. User Management
  getUser(): UserProfile | null {
    return getLocalItem<UserProfile | null>(STORAGE_KEYS.USER, DEFAULT_USER);
  },

  saveUser(user: UserProfile): void {
    setLocalItem(STORAGE_KEYS.USER, user);
  },

  clearUser(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  // 2. Workspace Management
  getWorkspaces(): Workspace[] {
    return getLocalItem<Workspace[]>(STORAGE_KEYS.WORKSPACE, [DEFAULT_WORKSPACE]);
  },

  saveWorkspaces(workspaces: Workspace[]): void {
    setLocalItem(STORAGE_KEYS.WORKSPACE, workspaces);
  },

  // 3. Workflows
  getWorkflows(): Workflow[] {
    return getLocalItem<Workflow[]>(STORAGE_KEYS.WORKFLOWS, INITIAL_WORKFLOWS);
  },

  saveWorkflows(workflows: Workflow[]): void {
    setLocalItem(STORAGE_KEYS.WORKFLOWS, workflows);
  },

  getWorkflowById(id: string): Workflow | undefined {
    return this.getWorkflows().find((w) => w.id === id);
  },

  upsertWorkflow(workflow: Workflow): void {
    const list = this.getWorkflows();
    const index = list.findIndex((w) => w.id === workflow.id);
    if (index >= 0) {
      list[index] = { ...workflow, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...workflow, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.saveWorkflows(list);
  },

  deleteWorkflow(id: string): void {
    const list = this.getWorkflows().filter((w) => w.id !== id);
    this.saveWorkflows(list);
  },

  // 4. Executions
  getExecutions(): WorkflowExecution[] {
    return getLocalItem<WorkflowExecution[]>(STORAGE_KEYS.EXECUTIONS, INITIAL_EXECUTIONS);
  },

  saveExecutions(executions: WorkflowExecution[]): void {
    setLocalItem(STORAGE_KEYS.EXECUTIONS, executions);
  },

  addExecution(execution: WorkflowExecution): void {
    const list = this.getExecutions();
    list.unshift(execution);
    if (list.length > 200) list.pop();
    this.saveExecutions(list);

    const workflows = this.getWorkflows();
    const wf = workflows.find((w) => w.id === execution.workflowId);
    if (wf) {
      wf.executionCount = (wf.executionCount || 0) + 1;
      wf.lastExecutedAt = execution.startedAt;
      const wfExecs = list.filter((e) => e.workflowId === wf.id);
      const successful = wfExecs.filter((e) => e.status === 'success').length;
      wf.successRate = wfExecs.length > 0 ? Math.round((successful / wfExecs.length) * 100) : 100;
      this.saveWorkflows(workflows);
    }
  },

  // 5. Integrations
  getIntegrations(): Integration[] {
    return getLocalItem<Integration[]>(STORAGE_KEYS.INTEGRATIONS, INITIAL_INTEGRATIONS);
  },

  saveIntegrations(integrations: Integration[]): void {
    setLocalItem(STORAGE_KEYS.INTEGRATIONS, integrations);
  },

  updateIntegration(id: string, updates: Partial<Integration>): void {
    const list = this.getIntegrations();
    const index = list.findIndex((i) => i.id === id);
    if (index >= 0) {
      list[index] = { ...list[index], ...updates };
      this.saveIntegrations(list);
    }
  },

  // 6. Notifications
  getNotifications(): AppNotification[] {
    return getLocalItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  saveNotifications(notifications: AppNotification[]): void {
    setLocalItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  addNotification(notification: AppNotification): void {
    const list = this.getNotifications();
    list.unshift(notification);
    this.saveNotifications(list);
  },

  markNotificationAsRead(id: string): void {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    this.saveNotifications(list);
  },

  markAllNotificationsAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.saveNotifications(list);
  },

  // 7. Templates
  getTemplates(): Template[] {
    return getLocalItem<Template[]>(STORAGE_KEYS.TEMPLATES, INITIAL_TEMPLATES);
  },

  // 8. Reset to initial demo data
  resetAllData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.WORKFLOWS);
      localStorage.removeItem(STORAGE_KEYS.EXECUTIONS);
      localStorage.removeItem(STORAGE_KEYS.INTEGRATIONS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.WORKSPACE);
    }
  },

  // ==========================================
  // Cloud Firestore Production Adapter Methods
  // ==========================================

  async firestoreFetchUserProfile(userId: string): Promise<UserProfile | null> {
    const db = getFirebaseDb();
    if (!db) return null;
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return null;
      return snap.data() as UserProfile;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async firestoreSaveUserProfile(user: UserProfile): Promise<void> {
    const db = getFirebaseDb();
    if (!db) return;
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), {
        ...user,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async firestoreFetchWorkspaces(userId: string): Promise<Workspace[]> {
    const db = getFirebaseDb();
    if (!db) return [];
    const path = 'workspaces';
    try {
      const q = query(collection(db, path), where('ownerId', '==', userId));
      const snap = await getDocs(q);
      const list: Workspace[] = [];
      snap.forEach((d) => list.push(d.data() as Workspace));
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async firestoreSaveWorkspace(workspace: Workspace): Promise<void> {
    const db = getFirebaseDb();
    if (!db) return;
    const path = `workspaces/${workspace.id}`;
    try {
      await setDoc(doc(db, 'workspaces', workspace.id), workspace, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async firestoreFetchWorkflows(userId: string, workspaceId?: string): Promise<Workflow[]> {
    const db = getFirebaseDb();
    if (!db) return [];
    const path = 'workflows';
    try {
      const constraints = [where('ownerId', '==', userId)];
      const q = query(collection(db, path), ...constraints);
      const snap = await getDocs(q);
      const list: Workflow[] = [];
      snap.forEach((d) => {
        const item = d.data() as Workflow;
        if (!workspaceId || item.workspaceId === workspaceId) {
          list.push(item);
        }
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async firestoreSaveWorkflow(workflow: Workflow, userId: string): Promise<void> {
    const db = getFirebaseDb();
    if (!db) return;
    const path = `workflows/${workflow.id}`;
    try {
      const payload: Workflow = {
        ...workflow,
        ownerId: userId,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'workflows', workflow.id), payload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async firestoreDeleteWorkflow(workflowId: string): Promise<void> {
    const db = getFirebaseDb();
    if (!db) return;
    const path = `workflows/${workflowId}`;
    try {
      await deleteDoc(doc(db, 'workflows', workflowId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async firestoreFetchExecutions(userId: string): Promise<WorkflowExecution[]> {
    const db = getFirebaseDb();
    if (!db) return [];
    const path = 'executions';
    try {
      const q = query(collection(db, path), where('ownerId', '==', userId), limit(100));
      const snap = await getDocs(q);
      const list: WorkflowExecution[] = [];
      snap.forEach((d) => list.push(d.data() as WorkflowExecution));
      return list.sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async firestoreSaveExecution(execution: WorkflowExecution, userId: string): Promise<void> {
    const db = getFirebaseDb();
    if (!db) return;
    const path = `executions/${execution.id}`;
    try {
      const payload: WorkflowExecution = {
        ...execution,
        ownerId: userId,
      };
      await setDoc(doc(db, 'executions', execution.id), payload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async firestoreFetchNotifications(userId: string): Promise<AppNotification[]> {
    const db = getFirebaseDb();
    if (!db) return [];
    const path = 'notifications';
    try {
      const q = query(collection(db, path), where('ownerId', '==', userId), limit(50));
      const snap = await getDocs(q);
      const list: AppNotification[] = [];
      snap.forEach((d) => list.push(d.data() as AppNotification));
      return list.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async firestoreSaveNotification(notif: AppNotification, userId: string): Promise<void> {
    const db = getFirebaseDb();
    if (!db) return;
    const path = `notifications/${notif.id}`;
    try {
      await setDoc(doc(db, 'notifications', notif.id), { ...notif, ownerId: userId }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },
};
