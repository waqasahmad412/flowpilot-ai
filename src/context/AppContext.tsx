/**
 * FlowPilot AI - Global Application State Context
 * Unified state management supporting both Firebase Production Backend and Local Demo Mode
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Workflow,
  WorkflowExecution,
  Integration,
  AppNotification,
  UserProfile,
  Workspace,
  Template,
  StorageBackendType,
} from '../types';
import { storage, INITIAL_WORKFLOWS, INITIAL_EXECUTIONS, DEFAULT_WORKSPACE } from '../services/storage';
import {
  isFirebaseConfigured,
  testFirestoreConnection,
  firebaseSignInWithGoogle,
  firebaseSignInWithEmail,
  firebaseRegisterWithEmail,
  firebaseSignOut,
  subscribeToFirebaseAuthState,
} from '../services/firebase';
import { api, HealthResponse } from '../services/api';

export type NavPage =
  | 'dashboard'
  | 'builder'
  | 'generator'
  | 'templates'
  | 'executions'
  | 'integrations'
  | 'analytics'
  | 'notifications'
  | 'settings';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface AppContextType {
  // Navigation
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;

  // Backend / Storage Mode
  storageMode: StorageBackendType;
  setStorageMode: (mode: StorageBackendType) => void;
  isFirebaseConfigured: boolean;

  // Auth & Profile
  user: UserProfile | null;
  login: (email: string, name?: string) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (profile: Partial<UserProfile>) => void;

  // Workspaces
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  setCurrentWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string) => void;

  // Workflows
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  selectWorkflowById: (id: string) => void;
  saveWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => Workflow;
  createNewWorkflow: (name?: string, category?: string) => Workflow;
  setWorkflowStatus: (id: string, status: Workflow['status']) => void;

  // Executions
  executions: WorkflowExecution[];
  addExecution: (exec: WorkflowExecution) => void;

  // Integrations
  integrations: Integration[];
  updateIntegration: (id: string, updates: Partial<Integration>) => void;

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void;

  // Templates
  templates: Template[];
  instantiateTemplate: (templateId: string) => Workflow | null;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Copilot Assistant
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;

  // Toast System
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Server & Health Status
  backendStatus: HealthResponse | null;
  refreshHealth: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');

  // Storage Backend Mode: 'firebase' | 'demo'
  const [storageMode, setStorageModeState] = useState<StorageBackendType>(() => storage.getStorageMode());
  const firebaseAvailable = isFirebaseConfigured();

  // Auth State
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (storage.getStorageMode() === 'demo') {
      return storage.getUser();
    }
    return null;
  });

  // Workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => storage.getWorkspaces());
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(
    () => workspaces[0] || DEFAULT_WORKSPACE
  );

  // Workflows
  const [workflows, setWorkflows] = useState<Workflow[]>(() => storage.getWorkflows());
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(() => workflows[0] || null);

  // Executions
  const [executions, setExecutions] = useState<WorkflowExecution[]>(() => storage.getExecutions());

  // Integrations
  const [integrations, setIntegrations] = useState<Integration[]>(() => storage.getIntegrations());

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => storage.getNotifications());

  // Templates
  const [templates] = useState<Template[]>(() => storage.getTemplates());

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('flowpilot_theme') : null;
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // Copilot Drawer
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Backend Health
  const [backendStatus, setBackendStatus] = useState<HealthResponse | null>(null);

  // Sync Theme to HTML class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowpilot_theme', theme);
    }
  }, [theme]);

  // Initial Health & Firestore Connection Check
  const refreshHealth = async () => {
    const status = await api.checkHealth();
    setBackendStatus(status);
  };

  useEffect(() => {
    refreshHealth();
    if (firebaseAvailable) {
      testFirestoreConnection();
    }
  }, [firebaseAvailable]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      dismissToast(id);
    }, toast.duration || 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Switch storage mode cleanly
  const setStorageMode = (mode: StorageBackendType) => {
    storage.setStorageMode(mode);
    setStorageModeState(mode);
    if (mode === 'demo') {
      const demoUser = storage.getUser();
      setUser(demoUser);
      const demoWorkspaces = storage.getWorkspaces();
      setWorkspaces(demoWorkspaces);
      setCurrentWorkspace(demoWorkspaces[0] || DEFAULT_WORKSPACE);
      const demoFlows = storage.getWorkflows();
      setWorkflows(demoFlows);
      setSelectedWorkflow(demoFlows[0] || null);
      setExecutions(storage.getExecutions());
      setNotifications(storage.getNotifications());
      showToast({
        type: 'info',
        title: 'Switched to Demo Mode',
        message: 'Active backend: Persistent Local Demo Storage.',
      });
    } else {
      setUser(null);
      showToast({
        type: 'info',
        title: 'Switched to Firebase Backend',
        message: firebaseAvailable
          ? 'Active backend: Cloud Firestore & Firebase Auth.'
          : 'Firebase config missing. Configure .env variables to connect.',
      });
    }
  };

  // Sync state from Firestore for an authenticated user
  const syncFromFirestore = useCallback(async (fbUid: string, email: string, displayName?: string | null) => {
    try {
      // 1. Fetch user profile
      let profile = await storage.firestoreFetchUserProfile(fbUid);
      if (!profile) {
        profile = {
          id: fbUid,
          email,
          name: displayName || email.split('@')[0],
          role: 'Owner',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          createdAt: new Date().toISOString(),
        };
        await storage.firestoreSaveUserProfile(profile);
      }
      setUser(profile);
      storage.saveUser(profile);

      // 2. Fetch or seed workspaces
      let userWorkspaces = await storage.firestoreFetchWorkspaces(fbUid);
      if (userWorkspaces.length === 0) {
        const initialWs: Workspace = {
          id: 'ws_' + fbUid.substring(0, 8),
          name: `${profile.name}'s Workspace`,
          slug: 'workspace-' + fbUid.substring(0, 8),
          ownerId: fbUid,
          plan: 'Enterprise',
          createdAt: new Date().toISOString(),
        };
        await storage.firestoreSaveWorkspace(initialWs);
        userWorkspaces = [initialWs];
      }
      setWorkspaces(userWorkspaces);
      setCurrentWorkspace(userWorkspaces[0]);
      storage.saveWorkspaces(userWorkspaces);

      // 3. Fetch or seed workflows
      let userWorkflows = await storage.firestoreFetchWorkflows(fbUid, userWorkspaces[0].id);
      if (userWorkflows.length === 0) {
        const seededFlows: Workflow[] = INITIAL_WORKFLOWS.map((wf, idx) => ({
          ...wf,
          id: `wf_${fbUid.substring(0, 6)}_${idx + 1}`,
          ownerId: fbUid,
          workspaceId: userWorkspaces[0].id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        for (const flow of seededFlows) {
          await storage.firestoreSaveWorkflow(flow, fbUid);
        }
        userWorkflows = seededFlows;
      }
      setWorkflows(userWorkflows);
      setSelectedWorkflow(userWorkflows[0] || null);
      storage.saveWorkflows(userWorkflows);

      // 4. Fetch executions
      const userExecs = await storage.firestoreFetchExecutions(fbUid);
      setExecutions(userExecs.length > 0 ? userExecs : INITIAL_EXECUTIONS);
      storage.saveExecutions(userExecs.length > 0 ? userExecs : INITIAL_EXECUTIONS);

      // 5. Fetch notifications
      const userNotifs = await storage.firestoreFetchNotifications(fbUid);
      if (userNotifs.length > 0) {
        setNotifications(userNotifs);
        storage.saveNotifications(userNotifs);
      }
    } catch (err) {
      console.error('Failed to sync data from Firestore:', err);
    }
  }, []);

  // Subscribe to Firebase Auth changes when in Firebase mode
  useEffect(() => {
    if (storageMode !== 'firebase' || !firebaseAvailable) return;

    const unsubscribe = subscribeToFirebaseAuthState((fbUser) => {
      if (fbUser && fbUser.email) {
        syncFromFirestore(fbUser.uid, fbUser.email, fbUser.displayName);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [storageMode, firebaseAvailable, syncFromFirestore]);

  // Auth functions
  const login = (email: string, name?: string) => {
    const loggedUser: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 8),
      email,
      name: name || email.split('@')[0],
      role: 'Owner',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      createdAt: new Date().toISOString(),
    };
    setUser(loggedUser);
    storage.saveUser(loggedUser);
    showToast({
      type: 'success',
      title: 'Welcome to FlowPilot AI!',
      message: `Signed in as ${loggedUser.email} (Demo Mode)`,
    });
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (storageMode === 'firebase' && firebaseAvailable) {
      const fbUser = await firebaseSignInWithEmail(email, pass);
      await syncFromFirestore(fbUser.uid, fbUser.email || email, fbUser.displayName);
      showToast({
        type: 'success',
        title: 'Signed in with Firebase',
        message: `Authenticated as ${fbUser.email}`,
      });
    } else {
      login(email);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    if (storageMode === 'firebase' && firebaseAvailable) {
      const fbUser = await firebaseRegisterWithEmail(email, pass);
      await syncFromFirestore(fbUser.uid, fbUser.email || email, name || fbUser.displayName);
      showToast({
        type: 'success',
        title: 'Account Created',
        message: `Welcome to FlowPilot AI, ${fbUser.email}!`,
      });
    } else {
      login(email, name);
    }
  };

  const loginWithGoogle = async () => {
    if (!firebaseAvailable) {
      showToast({
        type: 'warning',
        title: 'Firebase Not Configured',
        message: 'Please set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID to enable Google sign-in.',
      });
      return;
    }
    const fbUser = await firebaseSignInWithGoogle();
    await syncFromFirestore(fbUser.uid, fbUser.email || '', fbUser.displayName);
    showToast({
      type: 'success',
      title: 'Google Sign-in Successful',
      message: `Welcome back, ${fbUser.displayName || fbUser.email}!`,
    });
  };

  const logout = async () => {
    if (storageMode === 'firebase' && firebaseAvailable) {
      await firebaseSignOut();
    }
    setUser(null);
    storage.clearUser();
    showToast({
      type: 'info',
      title: 'Signed out',
      message: 'You have returned to the login screen.',
    });
  };

  const updateUser = (profile: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...profile };
    setUser(updated);
    storage.saveUser(updated);
    if (storageMode === 'firebase' && firebaseAvailable) {
      storage.firestoreSaveUserProfile(updated).catch(console.error);
    }
    showToast({ type: 'success', title: 'Profile Updated', message: 'Your settings have been saved.' });
  };

  // Workspace functions
  const createWorkspace = (name: string) => {
    const newWs: Workspace = {
      id: 'ws_' + Math.random().toString(36).substring(2, 8),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      ownerId: user?.id || 'usr_admin',
      plan: 'Pro Trial',
      createdAt: new Date().toISOString(),
    };
    const updated = [...workspaces, newWs];
    setWorkspaces(updated);
    storage.saveWorkspaces(updated);
    setCurrentWorkspace(newWs);

    if (storageMode === 'firebase' && firebaseAvailable && user) {
      storage.firestoreSaveWorkspace(newWs).catch(console.error);
    }

    showToast({ type: 'success', title: 'Workspace Created', message: `Switched to "${name}"` });
  };

  // Workflow functions
  const selectWorkflowById = (id: string) => {
    const found = workflows.find((w) => w.id === id);
    if (found) {
      setSelectedWorkflow(found);
    }
  };

  const saveWorkflow = (workflow: Workflow) => {
    const enriched: Workflow = {
      ...workflow,
      ownerId: user?.id || workflow.ownerId || 'usr_flowpilot_admin',
      workspaceId: workflow.workspaceId || currentWorkspace.id,
      updatedAt: new Date().toISOString(),
    };

    storage.upsertWorkflow(enriched);
    const updated = storage.getWorkflows();
    setWorkflows(updated);
    setSelectedWorkflow(enriched);

    if (storageMode === 'firebase' && firebaseAvailable && user) {
      storage.firestoreSaveWorkflow(enriched, user.id).catch(console.error);
    }

    showToast({ type: 'success', title: 'Workflow Saved', message: `"${workflow.name}" changes saved.` });
  };

  const deleteWorkflow = (id: string) => {
    const target = workflows.find((w) => w.id === id);
    storage.deleteWorkflow(id);
    const updated = storage.getWorkflows();
    setWorkflows(updated);
    if (selectedWorkflow?.id === id) {
      setSelectedWorkflow(updated[0] || null);
    }

    if (storageMode === 'firebase' && firebaseAvailable && user) {
      storage.firestoreDeleteWorkflow(id).catch(console.error);
    }

    showToast({ type: 'info', title: 'Workflow Deleted', message: target ? `"${target.name}" removed.` : 'Workflow removed.' });
  };

  const duplicateWorkflow = (id: string): Workflow => {
    const source = workflows.find((w) => w.id === id);
    if (!source) throw new Error('Workflow not found');

    const idMap = new Map<string, string>();
    const clonedNodes = source.nodes.map((n) => {
      const newId = 'node_' + Math.random().toString(36).substring(2, 8);
      idMap.set(n.id, newId);
      return { ...n, id: newId };
    });

    const clonedEdges = source.edges.map((e) => ({
      ...e,
      id: 'edge_' + Math.random().toString(36).substring(2, 8),
      source: idMap.get(e.source) || e.source,
      target: idMap.get(e.target) || e.target,
    }));

    const cloned: Workflow = {
      ...source,
      id: 'wf_' + Math.random().toString(36).substring(2, 8),
      name: `${source.name} (Copy)`,
      status: 'draft',
      executionCount: 0,
      successRate: 100,
      ownerId: user?.id,
      workspaceId: currentWorkspace.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: clonedNodes,
      edges: clonedEdges,
    };

    saveWorkflow(cloned);
    return cloned;
  };

  const createNewWorkflow = (name = 'New Automation Pipeline', category = 'Custom'): Workflow => {
    const newFlow: Workflow = {
      id: 'wf_' + Math.random().toString(36).substring(2, 8),
      name,
      description: 'Custom intelligent automation workflow.',
      category,
      status: 'draft',
      workspaceId: currentWorkspace.id,
      ownerId: user?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successRate: 100,
      tags: ['New', 'Draft'],
      nodes: [
        {
          id: 'node_init_1',
          type: 'manual_trigger',
          name: 'Manual Trigger',
          position: { x: 100, y: 220 },
          config: {},
        },
        {
          id: 'node_init_2',
          type: 'ai_gemini',
          name: 'Gemini AI Processor',
          position: { x: 420, y: 220 },
          config: {
            prompt: 'Analyze input data and produce action recommendations.',
            model: 'gemini-3.8-flash',
            temperature: 0.4,
          },
        },
        {
          id: 'node_init_3',
          type: 'output',
          name: 'Execution Output',
          position: { x: 740, y: 220 },
          config: {},
        },
      ],
      edges: [
        { id: 'edge_1_2', source: 'node_init_1', target: 'node_init_2' },
        { id: 'edge_2_3', source: 'node_init_2', target: 'node_init_3' },
      ],
    };

    saveWorkflow(newFlow);
    setSelectedWorkflow(newFlow);
    return newFlow;
  };

  const setWorkflowStatus = (id: string, status: Workflow['status']) => {
    const flow = workflows.find((w) => w.id === id);
    if (!flow) return;
    const updated: Workflow = { ...flow, status, updatedAt: new Date().toISOString() };
    saveWorkflow(updated);
  };

  // Execution functions
  const addExecution = (exec: WorkflowExecution) => {
    const enriched: WorkflowExecution = {
      ...exec,
      ownerId: user?.id,
      workspaceId: currentWorkspace.id,
    };

    storage.addExecution(enriched);
    setExecutions(storage.getExecutions());
    setWorkflows(storage.getWorkflows());

    if (storageMode === 'firebase' && firebaseAvailable && user) {
      storage.firestoreSaveExecution(enriched, user.id).catch(console.error);
    }
  };

  // Integrations
  const updateIntegration = (id: string, updates: Partial<Integration>) => {
    storage.updateIntegration(id, updates);
    setIntegrations(storage.getIntegrations());
    showToast({ type: 'success', title: 'Integration Updated', message: 'Settings saved successfully.' });
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    storage.markNotificationAsRead(id);
    setNotifications(storage.getNotifications());
  };

  const markAllNotificationsAsRead = () => {
    storage.markAllNotificationsAsRead();
    setNotifications(storage.getNotifications());
    showToast({ type: 'info', title: 'All Read', message: 'All notifications marked as read.' });
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const full: AppNotification = {
      ...notif,
      id: 'notif_' + Math.random().toString(36).substring(2, 8),
      timestamp: new Date().toISOString(),
    };
    storage.addNotification(full);
    setNotifications(storage.getNotifications());

    if (storageMode === 'firebase' && firebaseAvailable && user) {
      storage.firestoreSaveNotification(full, user.id).catch(console.error);
    }
  };

  // Templates
  const instantiateTemplate = (templateId: string): Workflow | null => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return null;

    const newFlow: Workflow = {
      id: 'wf_' + Math.random().toString(36).substring(2, 8),
      name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      status: 'draft',
      workspaceId: currentWorkspace.id,
      ownerId: user?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successRate: 100,
      tags: [...tpl.tags, 'Template'],
      nodes: JSON.parse(JSON.stringify(tpl.nodes)),
      edges: JSON.parse(JSON.stringify(tpl.edges)),
    };

    saveWorkflow(newFlow);
    setSelectedWorkflow(newFlow);
    setCurrentPage('builder');
    showToast({
      type: 'success',
      title: 'Template Instantiated',
      message: `"${tpl.name}" loaded into Workflow Builder.`,
    });
    return newFlow;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        storageMode,
        setStorageMode,
        isFirebaseConfigured: firebaseAvailable,
        user,
        login,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        updateUser,
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        createWorkspace,
        workflows,
        selectedWorkflow,
        selectWorkflowById,
        saveWorkflow,
        deleteWorkflow,
        duplicateWorkflow,
        createNewWorkflow,
        setWorkflowStatus,
        executions,
        addExecution,
        integrations,
        updateIntegration,
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        templates,
        instantiateTemplate,
        theme,
        toggleTheme,
        isCopilotOpen,
        setIsCopilotOpen,
        toasts,
        showToast,
        dismissToast,
        backendStatus,
        refreshHealth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
