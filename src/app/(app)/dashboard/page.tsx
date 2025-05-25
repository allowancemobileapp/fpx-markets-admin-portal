import { MetricCard } from '@/components/dashboard/metric-card';
import { PlaceholderChart } from '@/components/dashboard/placeholder-chart';
import type { Metric } from '@/lib/types';
import { Users, UserPlus } from 'lucide-react';
import { query } from '@/lib/db';

async function getDashboardMetrics() {
  try {
    const totalUsersRes = await query('SELECT COUNT(*) FROM users');
    const newUsersRes = await query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 HOURS'");
    
    return {
      totalUsers: totalUsersRes.rows[0].count || '0',
      newUsersToday: newUsersRes.rows[0].count || '0',
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return {
      totalUsers: 'N/A',
      newUsersToday: 'N/A',
    };
  }
}


export default async function DashboardPage() {
  const dbMetrics = await getDashboardMetrics();

  const metrics: Metric[] = [
    { title: 'Total Platform Users', value: dbMetrics.totalUsers, icon: Users },
    { title: 'New Users (24h)', value: dbMetrics.newUsersToday, icon: UserPlus },
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
        <PlaceholderChart title="Platform Activity Overview" description="General platform activity metrics." />
        <PlaceholderChart title="User Engagement" description="Daily active users or similar." />
      </div>
    </div>
  );
}
