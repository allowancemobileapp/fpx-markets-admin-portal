// This page is no longer used as instrument management has been removed.
// It can be deleted.
import { redirect } from 'next/navigation';

export default function InstrumentsPagePlaceholder() {
  redirect('/dashboard'); // Or to a 404 page
  return null;
}
