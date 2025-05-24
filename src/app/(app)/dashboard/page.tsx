import { MetricCard } from '@/components/dashboard/metric-card';
import { PlaceholderChart } from '@/components/dashboard/placeholder-chart';
import type { Metric } from '@/lib/types';
import { Users, UserPlus, Clock, Activity, Briefcase } from 'lucide-react'; // Removed ShieldAlert

export default function DashboardPage() {
  const metrics: Metric[] = [
    { title: 'Total Platform Users', value: '1,234', icon: Users, change: '+2.5%' },
    { title: 'New Users (24h)', value: '12', icon: UserPlus, change: '+5' },
    // { title: 'Pending KYC Verifications', value: '5', icon: ShieldAlert }, // Removed KYC Metric
    { title: 'Pending Transactions', value: '8', icon: Clock, change: '-1' }, // This might relate to deposits/withdrawals needing admin action or just general pending states.
    { title: 'Active Trades', value: '567', icon: Activity }, // Kept, but might be less relevant if focus is only balance.
    { title: 'Active Strategy Providers', value: '23', icon: Briefcase, change: '+1' }, // Kept, but might be less relevant.
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PlaceholderChart title="User Growth Over Time" description="Shows new user registrations monthly." />
        <PlaceholderChart title="Transaction Volume" description="Daily transaction volume in USD." />
        <PlaceholderChart title="Trading Activity" description="Number of trades opened per day." />
      </div>
    </div>
  );
}
