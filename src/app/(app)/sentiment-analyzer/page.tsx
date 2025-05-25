// This page is no longer used as the sentiment analyzer feature has been removed.
// It can be deleted.
import { redirect } from 'next/navigation';

export default function SentimentAnalyzerPagePlaceholder() {
  redirect('/dashboard'); // Or to a 404 page
  return null;
}
