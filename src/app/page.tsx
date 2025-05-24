// This page will now redirect to the /dashboard or the first page of the (app) group.
// For Next.js App router, direct navigation to (app)/page.tsx is handled by the router.
// If you want a specific redirect, you can use the redirect function from next/navigation.
// For simplicity, we will make this file a client component that redirects.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // For a loading appearance

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // The (app) group's page.tsx will be `/` effectively if it's the only root page.
    // Or if you have a specific dashboard path like /dashboard
    // router.replace('/dashboard'); // if your dashboard is at /dashboard
    // If your (app)/page.tsx serves as the dashboard at `/`, this redirect might not be strictly necessary,
    // but it's good practice if you might have other root-level pages later (e.g., landing page).
    // For now, assuming (app)/page.tsx is the intended root.
    // No explicit redirect needed if (app)/page.tsx is the dashboard and serves /.
    // Let's make it redirect to / if not already there to ensure it lands on the (app) group's root.
    if (window.location.pathname !== '/') {
        router.replace('/');
    }
  }, [router]);

  // Optional: Show a loading skeleton or message while redirecting
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="space-y-4 p-8 rounded-lg">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
