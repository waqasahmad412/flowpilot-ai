/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkflowBuilderPage } from './pages/WorkflowBuilderPage';
import { AIGeneratorPage } from './pages/AIGeneratorPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ExecutionsPage } from './pages/ExecutionsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';

const MainRouter: React.FC = () => {
  const { user, currentPage } = useApp();

  // If unauthenticated, show professional Auth screens
  if (!user) {
    return <AuthPage />;
  }

  // Render AppShell with active page
  return (
    <AppShell>
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'builder' && <WorkflowBuilderPage />}
      {currentPage === 'generator' && <AIGeneratorPage />}
      {currentPage === 'templates' && <TemplatesPage />}
      {currentPage === 'executions' && <ExecutionsPage />}
      {currentPage === 'integrations' && <IntegrationsPage />}
      {currentPage === 'analytics' && <AnalyticsPage />}
      {currentPage === 'notifications' && <NotificationsPage />}
      {currentPage === 'settings' && <SettingsPage />}
    </AppShell>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
