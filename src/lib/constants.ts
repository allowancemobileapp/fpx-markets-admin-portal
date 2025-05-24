import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Repeat, Settings, ShieldCheck, Atom, BarChartBig } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  description?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Overview of platform metrics.',
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    description: 'Manage platform users.',
  },
  {
    title: 'Transactions',
    href: '/transactions',
    icon: Repeat,
    description: 'Manage financial transactions.',
  },
  {
    title: 'Instruments',
    href: '/instruments',
    icon: Settings, // Using Settings as a generic icon for market settings/instruments
    description: 'Manage tradable instruments.',
  },
  {
    title: 'Sentiment Analyzer',
    href: '/sentiment-analyzer',
    icon: Atom,
    description: 'Analyze user sentiment from complaints.',
  },
  // Placeholder for other sections from the proposal
  // {
  //   title: 'Trading Plans',
  //   href: '/trading-plans',
  //   icon: BarChartBig, 
  //   description: 'Manage trading plans.',
  // },
  // {
  //   title: 'Strategy Providers',
  //   href: '/strategy-providers',
  //   icon: Users, // Could be a different icon
  //   description: 'Manage strategy providers.',
  // },
  // {
  //   title: 'Admin Management',
  //   href: '/admin/users',
  //   icon: ShieldCheck,
  //   description: 'Manage admin users (Super Admin).',
  // },
];
