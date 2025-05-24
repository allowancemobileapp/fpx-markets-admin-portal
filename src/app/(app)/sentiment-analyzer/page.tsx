'use client';

import { useState, useTransition } from 'react';
import { Atom } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { summarizeUserSentiment, SummarizeUserSentimentInput, SummarizeUserSentimentOutput } from '@/ai/flows/summarize-user-sentiment';
import { Skeleton } from '@/components/ui/skeleton';

export default function SentimentAnalyzerPage() {
  const [complaintsText, setComplaintsText] = useState('');
  const [summary, setSummary] = useState<SummarizeUserSentimentOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    setError(null);
    setSummary(null);

    const complaintsArray = complaintsText.split('\n').map(c => c.trim()).filter(c => c.length > 0);
    if (complaintsArray.length === 0) {
      setError("Please enter at least one complaint.");
      return;
    }

    const input: SummarizeUserSentimentInput = {
      complaints: complaintsArray,
    };

    startTransition(async () => {
      try {
        const result = await summarizeUserSentiment(input);
        setSummary(result);
      } catch (e: any) {
        console.error("Sentiment analysis error:", e);
        setError(e.message || "An unexpected error occurred during sentiment analysis.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Sentiment Analyzer"
        description="Summarize key points from user complaints using AI."
        icon={Atom}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Analyze Complaints</CardTitle>
          <CardDescription>
            Enter user complaints, each on a new line. The AI will summarize the key issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter user complaints here, one per line...\n- The app is too slow.\n- I can't find the withdraw button.\n- Login fails frequently."
            value={complaintsText}
            onChange={(e) => setComplaintsText(e.target.value)}
            rows={10}
            className="text-sm"
            disabled={isPending}
          />
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isPending || !complaintsText.trim()}>
            {isPending ? 'Analyzing...' : 'Analyze Sentiment'}
          </Button>
        </CardFooter>
      </Card>

      {isPending && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}

      {summary && !isPending && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sentiment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{summary.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
