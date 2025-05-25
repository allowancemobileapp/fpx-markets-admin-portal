import { Users as UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { UserTableClient } from '@/components/users/user-table-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAllUsers, getAllTradingPlans } from '@/actions/userActions';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await getAllUsers();
  const tradingPlans = await getAllTradingPlans(); // Fetch trading plans

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View and manage all platform users."
        icon={UsersIcon}
        // Add New User button can be re-enabled if functionality is added
        // actions={ 
        //   <Button asChild>
        //     <Link href="/users/new">Add New User</Link>
        //   </Button>
        // }
      />
      <UserTableClient initialUsers={users} tradingPlans={tradingPlans} />
    </div>
  );
}
