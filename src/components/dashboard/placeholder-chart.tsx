import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

interface PlaceholderChartProps {
  title: string;
  description?: string;
}

export function PlaceholderChart({ title, description }: PlaceholderChartProps) {
  return (
    <Card className="shadow-lg col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-64 flex items-center justify-center bg-muted/30 rounded-b-lg">
        <div className="text-center text-muted-foreground">
          <BarChart className="mx-auto h-16 w-16 mb-2" />
          <p>Chart data would be displayed here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
