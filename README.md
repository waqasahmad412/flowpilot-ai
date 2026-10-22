# FINAL MASTER PROMPT — FLOWPILOT AI
## Enterprise AI Automation & Workflow Orchestration Platform

Act as a senior full-stack software architect, enterprise UI/UX designer, AI engineer, DevOps engineer, and application security specialist.

Build and finalize **FlowPilot AI**, a production-oriented AI automation platform that allows users to visually design, execute, monitor, test, and manage intelligent workflows.

Do not create a basic prototype, static dashboard, or UI-only demonstration. Build a complete, maintainable, functional full-stack application using the existing project files and architecture.

## 1. CRITICAL PROJECT RULES

Before changing any code:

1. Inspect the entire existing project structure, `package.json`, source files, API routes, storage services, authentication, Firestore rules, and environment configuration.
2. Reuse and improve the existing implementation rather than replacing working code unnecessarily.
3. Identify missing features, broken imports, TypeScript errors, security vulnerabilities, nonfunctional buttons, mock APIs, and deployment issues.
4. Preserve working features and existing user data wherever possible.
5. Implement missing functionality end-to-end, including frontend, backend, persistence, validation, error handling, and testing.
6. Never claim that a feature is verified, production-ready, deployed, or connected unless it has actually been tested.
7. Do not leave TODOs, placeholder pages, fake success messages, or buttons that do nothing in core workflows.
8. If an external service requires credentials, provide a complete configuration interface, validation, and a clear setup message instead of pretending the integration is connected.
9. Create or update files directly in the existing project. Do not merely provide code snippets or instructions.

## 2. REQUIRED TECHNOLOGY STACK

Frontend:
- React 19
- TypeScript with strict type checking
- Vite
- Tailwind CSS v4
- Lucide React icons
- Accessible, responsive UI components
- React Flow or an equivalent maintained graph editor for the workflow canvas

Backend:
- Node.js
- Express
- TypeScript
- Zod or equivalent request and configuration validation
- Secure server-side API routes
- Structured logging and centralized error handling

AI:
- Google Gen AI TypeScript SDK
- Gemini model configured through environment variables
- Server-side AI workflow generation
- Server-side AI copilot and workflow troubleshooting

Persistence:
- Firebase Authentication
- Cloud Firestore
- LocalStorage-based demo adapter
- A consistent storage interface for both modes

Testing:
- Vitest
- React Testing Library where appropriate
- API integration tests
- Workflow execution and authorization tests
- Production build and TypeScript verification

Preserve the existing stack if a compatible implementation already exists. Avoid unnecessary migrations or dependency replacements.

## 3. PROFESSIONAL USER INTERFACE

Create a polished enterprise SaaS interface inspired by modern automation and developer tools.

Design requirements:
- Professional typography and consistent spacing
- Clean navigation and reusable components
- Responsive desktop, tablet, and mobile layouts
- Dark and light themes with persistent preferences
- Accessible keyboard navigation and visible focus states
- Loading skeletons, empty states, error states, and success feedback
- Search, sorting, filtering, pagination, and confirmation dialogs where appropriate
- Consistent design tokens and a centralized theme configuration

Main navigation:
1. Overview
2. Workflows
3. Workflow Builder
4. Templates
5. Executions
6. Integrations
7. Analytics
8. Notifications
9. Workspace Settings
10. User Profile

Show administrative navigation only to authorized administrators. Regular users must never receive administrative privileges merely because an element is hidden or a client-side role is changed.

## 4. AUTHENTICATION AND STORAGE

Implement a configurable dual-backend architecture.

### Firebase production mode
- Google Sign-In
- Email/password registration and login
- Logout and persistent authentication sessions
- Password reset
- Authenticated API requests
- User-specific workspaces
- Tenant-isolated workflows, executions, integrations, and notifications
- Cloud Firestore persistence
- Secure authorization checks on every protected operation

### Local demo mode
- No Firebase credentials required
- Persistent demo data using LocalStorage
- Clearly label demo data as local and non-production
- Provide a working demo login using:
  `admin@flowpilot.ai`
  `flowpilot123`
- Seed three starter workflows, two realistic execution histories, sample integrations, and sample analytics
- Include a regular-user demo account or a clear role-switching test fixture that cannot grant production privileges
- Make it possible to reset demo data

Demo credentials must work only in demo mode. Do not create a hardcoded production administrator or accept client-supplied roles as proof of authorization.

### Configuration

Support these environment variables where required:

GEMINI_API_KEY
GEMINI_MODEL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_FIREBASE_DATABASE_ID
SESSION_SECRET
PORT
APP_ORIGIN

Create a complete `.env.example`.

Keep Gemini credentials, session secrets, and other privileged secrets on the server. Never expose private server secrets through Vite-prefixed environment variables.

Validate configuration at startup and report actionable errors without exposing secret values.

Select Firebase mode only when the required Firebase configuration is valid. Otherwise, use demo mode when explicitly permitted by the application's environment and configuration. Production must never silently fall back to LocalStorage after a Firebase error.

## 5. WORKFLOW BUILDER

Implement a functional drag-and-drop workflow editor.

Required capabilities:
- Add, connect, move, edit, duplicate, and delete nodes
- Validate connections and graph structure
- Zoom, pan, fit-to-screen, and minimap
- Node configuration inspector
- Undo and redo
- Save, rename, duplicate, and version workflows
- Unsaved-change indicators
- Validate workflow before execution
- Display execution state on individual nodes
- Display node input, output, duration, and errors
- Export and import validated workflow definitions
- Save workflow drafts and published versions separately

Implement these node types:

1. Manual Trigger
2. Schedule Trigger
3. Webhook Trigger
4. Gemini AI
5. Text Input / Context
6. Conditional Branch
7. JSON / Regex Transformation
8. Delay
9. Google Sheets
10. Gmail Dispatch
11. HTTP Request
12. Notification / Slack / Discord
13. Workflow Output

Every node must have a typed configuration schema, validation, execution handler, defined input/output contract, and meaningful error reporting.

Do not represent an unimplemented node as functional. Mark unavailable features clearly until their execution handler and integration have been implemented.

## 6. REAL WORKFLOW EXECUTION ENGINE

Build a backend execution engine that:
- Validates workflow definitions before running
- Builds a directed execution graph
- Detects cycles and unsupported graph structures
- Executes nodes in valid dependency order
- Evaluates conditional branches correctly
- Passes structured data between connected nodes
- Tracks execution status and node-level outputs
- Supports timeouts, bounded retries, and configurable retry delays
- Records start time, end time, duration, and failure details
- Supports cancellation where practical
- Persists execution history and audit events
- Enforces per-workspace concurrency and resource limits
- Prevents unbounded loops and excessive resource consumption

Use a safe expression evaluator. Never execute arbitrary user-supplied JavaScript using `eval` or `new Function`.

Implement schedules through a reliable server-side scheduler or job queue. Webhook triggers must use securely generated or authenticated endpoints with request validation and replay protection where appropriate.

Do not rely on an open browser tab to run production schedules.

If long-running or distributed executions require a queue, provide a suitable architecture and a local development implementation. Clearly document any external infrastructure required for production.

## 7. AI WORKFLOW GENERATOR

Implement:

`POST /api/ai/workflow-generate`

Accept a natural-language workflow description and return a validated workflow definition.

Requirements:
- Call the configured Gemini model from the server
- Use structured output or strict schema validation
- Validate node types, connections, parameters, and graph structure
- Reject invalid model output and attempt a bounded repair when appropriate
- Never automatically execute generated workflows without user approval
- Display a preview before saving
- Allow the user to edit the generated graph
- Handle rate limits, timeouts, invalid responses, and provider errors

The generated workflow must be compatible with the same execution engine used by manually created workflows.

## 8. FLOWPILOT COPILOT

Implement:

`POST /api/ai/chat`

Provide a contextual assistant that can explain:
- Workflow nodes and configuration
- Expression syntax
- Validation failures
- Execution logs
- API and integration errors
- Workflow optimization suggestions

Use only authorized context from the current workspace. Apply data minimization and avoid sending unnecessary sensitive values to the AI provider.

Require server-side authentication, input validation, rate limiting, and safe error handling.

The copilot must not bypass authorization, change user roles, execute arbitrary code, or run destructive operations without appropriate confirmation.

## 9. TEMPLATE LIBRARY

Provide eight categorized workflow templates:

1. Lead Capture and Qualification
2. AI Email Classification
3. Scheduled Report Generation
4. Webhook-to-REST API Automation
5. Customer Support Triage
6. Google Sheets Data Synchronization
7. Failure Alerts and Notifications
8. AI Content Processing

Templates must create valid editable workflow definitions. Clearly identify templates that require external credentials or additional infrastructure.

## 10. INTEGRATIONS HUB

Build integration configuration and testing for:
- Google Workspace
- Gmail
- Google Sheets
- Slack
- Discord
- Webhooks
- Generic REST APIs

Requirements:
- Secure credential entry
- Server-side secret storage in an appropriate production secret store
- Masked credentials in the UI
- OAuth where supported and appropriate
- Connection status and meaningful test results
- Least-privilege scopes
- Credential rotation and revocation
- Safe request and response logging
- No credential leakage into browser logs, workflow exports, analytics, or error messages

Never claim a connection test succeeded unless a real request was completed successfully.

Do not store production OAuth refresh tokens or API secrets in LocalStorage or ordinary client-readable Firestore documents.

For integrations that are not configured, provide setup instructions and a clear disconnected state.

## 11. EXECUTIONS AND AUDIT LOGS

Create an execution history page with:
- Execution ID
- Workflow name and version
- Initiating user or trigger
- Start time and duration
- Success, failure, running, or cancelled status
- Node-level execution details
- Input/output inspection with sensitive data redacted
- Error stack details restricted to authorized users
- Retry failed executions safely
- Downloadable CSV export
- Date, workflow, status, and user filters

Retries must use the original workflow version and a clearly defined input snapshot. Prevent accidental duplicate external side effects where idempotency is supported.

Maintain append-only audit events for sensitive administrative and authorization changes.

## 12. ANALYTICS AND NOTIFICATIONS

Analytics:
- Execution volume over time
- Success and failure rates
- Average and percentile duration where sufficient data exists
- Workflow activity ranking
- Integration health
- Time-range filters
- Downloadable CSV reports

Calculate analytics from real persisted execution data. Label seeded demo metrics as demo data and display appropriate empty states when production data is unavailable.

Notifications:
- Workflow success and failure
- Integration problems
- Retry exhaustion
- Administrative and security events where appropriate
- Read/unread state
- Links to the relevant workflow or execution

Do not simulate real-time delivery or successful alerts when no notification provider is connected.

## 13. MULTI-TENANT WORKSPACES AND RBAC

Implement:
- Workspace creation and membership
- Role assignment and management
- Workspace-scoped workflows, executions, and integrations
- Invitation and membership lifecycle where supported
- Server-enforced authorization
- Tenant ownership validation on every resource operation

Define at least these roles:
- Owner
- Administrator
- Editor
- Viewer

Use deny-by-default authorization. Check the authenticated identity, workspace membership, resource ownership, and requested operation on the server.

Firestore rules must enforce tenant boundaries. Client-side filtering alone is not security.

Never allow a user to promote themselves, modify another workspace's data, or gain administrative privileges by editing browser state or API payloads.

## 14. FIRESTORE DATA MODEL AND SECURITY

Create or improve a documented Firestore schema for:
- users
- workspaces
- workspace memberships
- workflows
- workflow versions
- executions
- execution events
- integrations metadata
- notifications
- audit logs

Use explicit ownership and workspace identifiers, validation, timestamps, and versioning.

Implement and test Firestore security rules that:
- Deny unauthorized cross-tenant access
- Enforce permitted reads and writes
- Prevent unauthorized role changes
- Protect sensitive fields
- Restrict updates to approved fields
- Reject invalid document structures where feasible

Remember that Firebase Admin SDK operations bypass Firestore security rules. Enforce authorization independently in backend code.

Do not claim zero-trust compliance merely because rules exist. Test the actual security boundaries and document limitations.

## 15. API SECURITY AND RELIABILITY

Implement:
- Authentication middleware
- Role and workspace authorization middleware
- Request validation
- Rate limiting
- Secure HTTP headers
- CORS restricted to configured origins
- Request size limits
- Timeouts
- Centralized error handling
- Structured logs with sensitive fields redacted
- Protection against SSRF in HTTP Request nodes
- Blocking of cloud metadata endpoints, localhost, private IP ranges, and unauthorized destinations where applicable
- Redirect revalidation for outbound HTTP requests
- Webhook signature validation where supported
- Safe file and CSV handling
- Dependency and configuration checks

Never expose internal stack traces or secrets to ordinary users.

Do not permit arbitrary outbound requests to internal services or cloud credentials endpoints.

## 16. PROFESSIONAL ADMIN PANEL

Create a separate, secure administration experience for authorized administrators.

Admin capabilities:
- Workspace and membership management
- User role management
- System and integration health
- Execution monitoring
- Audit log review
- Usage and resource limit management
- Configuration status
- Safe operational controls

Regular users must not see admin navigation or admin-only data. More importantly, backend endpoints must enforce the same permissions even when directly called.

Use confirmation dialogs for destructive operations and record relevant audit events.

## 17. DEPLOYMENT AND DOCUMENTATION

Prepare the project for deployment using a suitable Node.js hosting platform that supports the Express backend.

Provide:
- Production build configuration
- Correct frontend static asset serving
- API routing
- Health-check endpoint
- Environment variable documentation
- Firebase setup instructions
- Firestore rules deployment instructions
- Local development instructions
- Production deployment instructions
- Secure secret configuration
- Database initialization and migration strategy where applicable
- Troubleshooting guide
- Backup and recovery recommendations
- `.gitignore` that excludes `.env`, secrets, build artifacts, and unnecessary files
- `.env.example`
- Complete professional `README.md`

Make sure the chosen deployment configuration actually supports the app's server-side API routes. Do not assume that a static hosting service can execute Express or persistent background jobs.

Document that production scheduling, queue workers, OAuth configuration, and secret management may require additional services depending on the selected hosting platform.

Never commit real credentials or API keys.

## 18. AUTOMATED TESTING AND FINAL VERIFICATION

Write and execute tests for:
- Authentication and session handling
- Workspace isolation
- Role-based authorization
- Firestore rules where the Firebase Emulator is available
- Workflow validation
- Conditional execution
- Retry handling
- Execution logging
- AI response validation
- API validation and rate limiting
- Integration error handling
- CSV export
- Frontend critical flows

Run:
1. Dependency installation or verification
2. TypeScript checks
3. Automated tests
4. Production build
5. API smoke tests where possible

Fix all errors that can be reproduced in the available environment.

If external credentials or infrastructure are unavailable, report exactly which checks could not be completed. Do not fabricate test results.

## 19. REQUIRED FINAL PROJECT STRUCTURE

Preserve the existing structure where sensible, and create missing modules following a clean architecture similar to:

flowpilot-ai/
├── src/
│   ├── components/
│   ├── pages/
│   ├── features/
│   │   ├── workflows/
│   │   ├── executions/
│   │   ├── integrations/
│   │   ├── analytics/
│   │   └── administration/
│   ├── services/
│   │   ├── storage.ts
│   │   ├── firebase.ts
│   │   └── api.ts
│   ├── hooks/
│   ├── types/
│   └── utils/
├── server/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── workflow-engine/
│   ├── integrations/
│   ├── security/
│   └── utils/
├── tests/
├── firestore.rules
├── firebase.json
├── firebase-blueprint.json
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md

Adapt this structure to the existing `server.ts` and project layout instead of creating duplicate servers or unnecessary files.

## 20. DEFINITION OF DONE

The project is complete only when:
- The application starts locally using documented commands.
- The production build succeeds.
- Authentication works in the supported mode.
- Demo mode works without cloud credentials.
- Firebase mode uses real configured Firebase services.
- Users cannot access unauthorized workspaces or administrative functions.
- Workflow creation, saving, validation, and execution work end-to-end for implemented node types.
- Execution history and analytics reflect actual stored data.
- AI endpoints validate their inputs and outputs.
- Integrations accurately report whether they are connected.
- Critical tests pass, or remaining blockers are documented precisely.
- Deployment instructions match the actual application architecture.

## FINAL INSTRUCTION

Start by inspecting the existing repository. Then implement, test, and refine the application directly in the project files.

Prioritize working functionality, security, maintainability, and professional presentation over adding superficial features.

Do not stop after producing a plan or updating the README. Continue implementing until the available environment's build, tests, and core workflows have been verified.

At completion, provide a concise report containing:
1. Files created or modified
2. Features completed
3. Tests actually executed and their results
4. Remaining issues and required external credentials
5. Exact local run commands
6. Exact deployment steps
7. Security limitations that still need attention

The final product must be an honest, functional, professionally engineered FlowPilot AI application—not merely a convincing-looking dashboard.
