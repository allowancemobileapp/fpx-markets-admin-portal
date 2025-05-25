
// src/app/(app)/users/page.tsx
import { Users as UsersIcon, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { UserTableClient } from '@/components/users/user-table-client';
import { Button } from '@/components/ui/button';
// import Link from 'next/link'; // No longer needed for Add User button if using dialog
import { getAllUsers, getAllTradingPlans } from '@/actions/userActions';
import { AddUserForm } from '@/components/users/add-user-form'; // Import the new form
import { useState, Suspense } from 'react'; // For dialog state

export const dynamic = 'force-dynamic';

// Client component to handle dialog state for AddUserForm
function AddUserDialogWrapper({ tradingPlans }: { tradingPlans: any[] }) {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsAddUserDialogOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" /> Add New User
      </Button>
      <AddUserForm
        tradingPlans={tradingPlans}
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onFormSubmit={() => {
          // Optionally, trigger a re-fetch or rely on revalidatePath from server action
          console.log("User created, table should revalidate.");
        }}
      />
    </>
  );
}


export default async function UsersPage() {
  const users = await getAllUsers();
  const tradingPlans = await getAllTradingPlans();

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View and manage all platform users."
        icon={UsersIcon}
        actions={
          <Suspense fallback={<Button disabled>Loading...</Button>}> {/* Suspense for client component */}
            <AddUserDialogWrapper tradingPlans={tradingPlans} />
          </Suspense>
        }
      />
      <UserTableClient initialUsers={users} tradingPlans={tradingPlans} />
    </div>
  );
}
