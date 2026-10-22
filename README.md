# FlowPilot AI — Enterprise AI Automation Platform

FlowPilot AI is a production-oriented AI automation platform designed for architecting, executing, testing, and monitoring intelligent workflows.

---

## Storage & Authentication Architecture

FlowPilot AI features a configurable **Dual-Backend Storage Architecture**:

1. **Production Backend (Firebase Authentication & Cloud Firestore)**:
   - User-specific multi-tenant data isolation.
   - Zero-trust Attribute-Based Access Control (ABAC) enforced in `firestore.rules`.
   - Google Sign-In and corporate email/password authentication.
   - Persistent workflow definitions, versioned nodes/edges, and execution audit histories.
2. **Local Demo Adapter**:
   - Zero-dependency client-side persistence (`src/services/storage.ts`) backed by LocalStorage.
   - Pre-seeded with 3 production-grade starter workflows, 2 realistic execution traces, integrations, and operational analytics.
   - 1-click demo login (`admin@flowpilot.ai` / `flowpilot123`) for rapid testing without cloud credentials.

---

## Firebase Setup & Deployment Guide

To connect your own Firebase project as the production backend:

### Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. In **Project Settings** > **General**, scroll to **Your apps** and click the **Web** (`</>`) icon to register a web app.
3. Copy the `firebaseConfig` object values.

### Step 2: Enable Firebase Authentication
1. In the Firebase console sidebar, navigate to **Build** > **Authentication**.
2. Click **Get Started** and enable:
   - **Google**: Configure the project support email and save.
   - **Email/Password**: Enable the provider.

### Step 3: Create Cloud Firestore
1. Navigate to **Build** > **Firestore Database**.
2. Click **Create database**, select a region close to your users (e.g., `nam5` or `eur3`), and start in **Production mode**.

### Step 4: Deploy Firestore Security Rules
FlowPilot AI ships with pre-configured, hardened security rules adhering to the Eight Pillars of Zero-Trust ABAC in `firestore.rules`.

Deploy them via the Firebase CLI:
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize or link project
firebase use --add <your-firebase-project-id>

# Deploy security rules
firebase deploy --only firestore:rules
```

### Step 5: Configure Environment Variables
Copy the variables from `.env.example` into your `.env` file (or provide them in your hosting environment):

```bash
# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Cloud Firestore & Firebase Auth
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-firebase-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app-id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
VITE_FIREBASE_DATABASE_ID="(default)"
```

When these environment variables are detected at runtime, FlowPilot automatically boots in **Firebase Mode**. If they are omitted, FlowPilot seamlessly operates in **Demo Mode**.

---

## Features

- **Visual Workflow Builder**: Interactive drag-and-drop node canvas with bezier wire routing, live status highlights, minimap navigator, zoom/pan controls, undo/redo stack, and node inspector.
- **13 Supported Node Types**:
  - *Triggers*: Manual Trigger, Schedule Trigger (Cron/Interval), Webhook Trigger.
  - *AI & Models*: Google Gemini 3.8 Flash, Text Input Context.
  - *Logic*: Conditional Branching (If-Else), Data Transformation (JSON/Regex), Delay Timer.
  - *Integrations*: Google Sheets, Gmail Dispatch, HTTP Request (REST APIs).
  - *Output & Alerts*: Notification Alert (In-App, Slack, Discord), Workflow Output.
- **AI Workflow Generator**: Transforms plain-English natural language descriptions into complete, valid node graphs using server-side Gemini 3.8 Flash (`POST /api/ai/workflow-generate`).
- **FlowPilot Copilot**: Embedded AI assistant providing contextual guidance on node parameters, expression syntax, and troubleshooting execution errors (`POST /api/ai/chat`).
- **Template Library**: 8 categorized starter templates with 1-click instantiation into the workflow builder.
- **Execution Audit Logs**: Comprehensive historical runs with node-level execution traces, input/output inspection, duration metrics, retry capability, and CSV export.
- **Integrations Hub**: Real configuration and test connection modals for Google Workspace, Slack, Discord, Webhooks, and Generic REST APIs with zero-leakage security.
- **Operational Analytics**: Real execution volume trend charts, reliability rates, duration benchmarks, and downloadable CSV summary reports.
- **In-App Notification Center**: Instant failure escalations and completion alerts with direct jumps to workflow builder.
- **Multi-Tenant Workspaces**: Workspace isolation, user role management, dark and light theme switching.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Backend Server**: Express server running on Node.js (`server.ts`) with mounted Vite middlewares.
- **AI Engine**: `@google/genai` TypeScript SDK with `gemini-3.8-flash` running exclusively server-side.
- **Storage Layer**: Dual-mode adapter with Cloud Firestore and local demo fallback (`src/services/storage.ts`).
- **Security**: Strict ABAC `firestore.rules` preventing cross-tenant reads/writes and shadow updates.

---

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run dev server**:
   ```bash
   npm run dev
   ```
   The dev server will boot on `http://localhost:3000` with the Express API and Vite middlewares.

3. **Verify Build**:
   ```bash
   npm run build
   ```

---

## Security & Verification Summary

| Component | Status | Details |
| :--- | :--- | :--- |
| **Dual Storage Adapter** | Verified | Implemented in `src/services/storage.ts` with clean mode switching |
| **Firestore Security Rules** | Verified | `firestore.rules` with 8-pillar ABAC, path hardening, and PII isolation |
| **Blueprint IR Schema** | Verified | `firebase-blueprint.json` defining all collections and entity models |
| **Error Handling** | Verified | Standardized `handleFirestoreError` conforming to `FirestoreErrorInfo` |
| **Authentication Flow** | Verified | Dual Google popup / Email-Password sign-in + 1-click Demo credentials |
| **Server AI Endpoints** | Verified | Live `POST /api/ai/workflow-generate` & `/api/ai/chat` via `@google/genai` |
| **Live Firestore Project** | Requires User Credentials | Requires user's `VITE_FIREBASE_API_KEY` & `VITE_FIREBASE_PROJECT_ID` |
