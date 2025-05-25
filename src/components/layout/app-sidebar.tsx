
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

export function AppSidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth(); // Get signOut function and user from context

  const handleLogout = async () => {
    await signOut();
    // Router will redirect to /login via AuthContext or AppLayout effect
  };

  if (!user) { // Optionally, don't render sidebar if no user (though AppLayout should handle redirect)
    return null;
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-primary">
             <path d="M12 2L1 9l4 1.5V15h2V10.5L12 6l5 4.5V15h2v-4.5L23 9l-3.5-2.6L12 2zm0 10.5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
           </svg>
          <span className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            FPX Markets
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarMenu>
          {NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                tooltip={{
                  children: item.title,
                  className: 'bg-primary text-primary-foreground',
                }}
                className={cn(
                  "justify-start",
                  (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) &&
                  "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
                )}
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenuButton
          tooltip={{ children: 'Logout', className: 'bg-destructive text-destructive-foreground' }}
          className="justify-start hover:bg-destructive/20 hover:text-destructive"
          onClick={handleLogout} // Use the new handleLogout function
        >
          <LogOut className="h-5 w-5" />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
