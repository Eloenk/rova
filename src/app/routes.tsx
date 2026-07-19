import { createBrowserRouter } from 'react-router';
import LandingPage from './components/LandingPage';
import AppShell from './components/AppShell';
import DashboardView from './components/DashboardView';
import AgentView from './components/AgentView';
import BuilderView from './components/BuilderView';
import HistoryView from './components/HistoryView';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardView />,
      },
      {
        path: 'agent',
        element: <AgentView />,
      },
      {
        path: 'builder',
        element: <BuilderView />,
      },
      {
        path: 'history',
        element: <HistoryView />,
      },
    ],
  },
]);
