// This file is intentionally left empty or can be deleted.
// The root of the (app) group should redirect or be handled by a more specific route like /dashboard.
// To ensure no conflict, we are making it minimal.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard, as the (app) group's root is not meant to be directly viewed.
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="space-y-4 p-8 rounded-lg">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <p className="text-muted-foreground pt-2">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
