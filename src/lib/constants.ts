
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, ListFilter, ShieldCheck } from 'lucide-react'; // Added ShieldCheck

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
    href: '/transactions',
    icon: ListFilter,
    description: 'View log of admin balance adjustments.',
  },
  {
    title: 'Security', // New navigation item
    href: '/security',
    icon: ShieldCheck,
    description: 'Manage your Admin PIN.',
  },
];
