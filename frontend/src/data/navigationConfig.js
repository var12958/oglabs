import { LayoutDashboard, Briefcase, ShieldAlert, RefreshCw, Brain } from 'lucide-react';

export const navigationConfig = [
  {
    title: 'Dashboard',
    route: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Portfolio',
    route: '/portfolio',
    icon: Briefcase,
  },
  {
    title: 'Security Center',
    route: '/security',
    icon: ShieldAlert,
  },
  {
    title: 'Smart Swap',
    route: '/swap',
    icon: RefreshCw,
  },
  {
    title: 'Intelligence (0G)',
    route: '/intelligence',
    icon: Brain,
  },
];
