
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
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.replace('/login');
      } else if (!isAdmin) {
        // Logged in but not an admin, redirect to login with an error or a specific "access denied" page
        console.warn("Access denied: User is not an admin. Redirecting to login.");
        // Potentially sign them out here or show an access denied message before redirecting
        // auth.signOut(); // Optionally sign out
        router.replace('/login?error=access_denied');
      }
      // If user is logged in and is admin, they can stay.
    }
  }, [user, isAdmin, loading, router, pathname]);

  // While loading auth state, or if conditions for redirect are met but redirect hasn't happened yet
  if (loading || !user || !isAdmin) {
    // Avoid rendering the layout if we're about to redirect or still verifying
    // Show a loading skeleton or similar placeholder
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

  // Only render the main app layout if the user is an authenticated admin
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
