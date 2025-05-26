// src/app/(app)/page.tsx
// This file exists to satisfy the Next.js router for the root of the (app) group.
// Actual navigation to dashboard or login is handled by higher-level components/redirects.
export default function AppGroupRootPlaceholder() {
  // This is a Server Component. Rendering null is the simplest way to provide a page
  // for this segment without requiring a client reference manifest.
  return null;
}
