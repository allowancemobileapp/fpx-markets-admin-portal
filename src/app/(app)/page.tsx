// src/app/(app)/page.tsx
// This page now redirects to /dashboard, as content has moved there.
import { redirect } from 'next/navigation';

export default function AppRootPage() {
  redirect('/dashboard');
}
