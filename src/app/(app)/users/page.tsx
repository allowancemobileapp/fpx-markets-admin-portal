import { Users as UsersIcon } from 'lucide-react';
import { mockUsers } from '@/lib/mock-data';
import { PageHeader } from '@/components/shared/page-header';
import { UserTableClient } from '@/components/users/user-table-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Or 'auto' if data doesn't change frequently

export default async function UsersPage() {
  // In a real app, fetch users from your database/API
  const users = mockUsers;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View and manage all platform users."
        icon={UsersIcon}
        actions={
          <Button asChild>
            <Link href="/users/new">Add New User</Link>
          </Button>
        }
      />
      <UserTableClient initialUsers={users} />
    </div>
  );
}
