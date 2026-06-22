import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Security from './pages/Security';
import SmartSwap from './pages/SmartSwap';
import Intelligence from './pages/Intelligence';
import AnimatedBackground from './components/AnimatedBackground';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'portfolio',
        element: <Portfolio />,
      },
      {
        path: 'security',
        element: <Security />,
      },
      {
        path: 'swap',
        element: <SmartSwap />,
      },
      {
        path: 'intelligence',
        element: <Intelligence />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return (
    <>
      <AnimatedBackground />
      <RouterProvider router={router} />
    </>
  );
}
