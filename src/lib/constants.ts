import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, ListFilter } from 'lucide-react';

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
    description: 'Manage platform users and their balances.',
  },
  {
    title: 'Transaction Log',
    href: '/transactions', // This page now shows admin adjustments
    icon: ListFilter,
    description: 'View log of admin balance adjustments.',
  },
];
