'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserCircle, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';

export function AppHeader() {
  const pathname = usePathname();
  const currentPage = NAV_ITEMS.find(item => item.href === pathname || (pathname.startsWith(item.href) && item.href !== '/'));
  const pageTitle = currentPage ? currentPage.title : "Admin Portal";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Link href="/" className="flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-primary">
            <path d="M12 2L1 9l4 1.5V15h2V10.5L12 6l5 4.5V15h2v-4.5L23 9l-3.5-2.6L12 2zm0 10.5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <span className="text-lg font-semibold hidden sm:inline-block">FPX Markets Admin</span>
        </Link>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <h1 className="text-lg font-semibold text-muted-foreground hidden md:block">{pageTitle}</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserCircle className="h-6 w-6" />
          <span className="sr-only">User Profile</span>
        </Button>
      </div>
    </header>
  );
}
