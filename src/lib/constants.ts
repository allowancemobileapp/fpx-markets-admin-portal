import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users } from 'lucide-react'; // Removed Repeat, Settings, Atom

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
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview of platform metrics.',
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    description: 'Manage platform users.',
  },
  // Removed Transactions, Instruments, Sentiment Analyzer
];
