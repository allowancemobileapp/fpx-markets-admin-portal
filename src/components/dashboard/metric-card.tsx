import type { Metric } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  metric: Metric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const Icon = metric.icon;
  
  const renderChange = () => {
    if (!metric.change) return null;
    const isPositive = metric.change.startsWith('+');
    const isNegative = metric.change.startsWith('-');
    
    return (
      <p className={`text-xs ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'} flex items-center`}>
        {isPositive && <TrendingUp className="mr-1 h-4 w-4" />}
        {isNegative && <TrendingDown className="mr-1 h-4 w-4" />}
        {!isPositive && !isNegative && <Minus className="mr-1 h-4 w-4" />}
        {metric.change} vs last period
      </p>
    );
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.title}
        </CardTitle>
        {Icon && <Icon className="h-5 w-5 text-accent" />}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{metric.value}</div>
        {metric.change && <CardDescription className="mt-1">{renderChange()}</CardDescription>}
      </CardContent>
    </Card>
  );
}
