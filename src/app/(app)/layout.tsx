
'use client';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth(); // isAdmin will be true if user is logged in
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.replace('/login');
      } 
      // The 'else if (!isAdmin)' check is removed because if 'user' exists, 
      // 'isAdmin' (for the context of this portal) is true.
      // If there was a more granular admin role check, it would go here.
    }
  }, [user, isAdmin, loading, router, pathname]);

  if (loading || !user) { // Simplified condition: show skeleton if loading or no user (implies redirecting)
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 p-8 rounded-lg">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <p className="text-muted-foreground pt-4">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
