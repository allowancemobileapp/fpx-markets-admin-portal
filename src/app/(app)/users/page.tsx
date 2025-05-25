// src/app/(app)/users/page.tsx
'use client'; // <--- Add this directive

import { Users as UsersIcon, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { UserTableClient } from '@/components/users/user-table-client';
import { Button } from '@/components/ui/button';
import { getAllUsers, getAllTradingPlans } from '@/actions/userActions';
import { AddUserForm } from '@/components/users/add-user-form';
import { useState, useEffect, useTransition, Suspense } from 'react'; // For dialog state and data fetching
import type { User, TradingPlan } from '@/lib/types';

// export const dynamic = 'force-dynamic'; // Not needed for client components in this way

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tradingPlans, setTradingPlans] = useState<TradingPlan[]>([]);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = () => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const [usersData, tradingPlansData] = await Promise.all([
          getAllUsers(),
          getAllTradingPlans(),
        ]);
        setUsers(usersData);
        setTradingPlans(tradingPlansData);
      } catch (error) {
        console.error("Failed to fetch users or trading plans:", error);
        // Handle error appropriately, e.g., show a toast message
      } finally {
        setIsLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUserCreated = () => {
    // Re-fetch users after one is created
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          description="View and manage all platform users."
          icon={UsersIcon}
          actions={
            <Button disabled>
              <UserPlus className="mr-2 h-4 w-4" /> Add New User
            </Button>
          }
        />
        <p>Loading users...</p> {/* Replace with Skeleton if desired */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View and manage all platform users."
        icon={UsersIcon}
        actions={
          <>
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Add New User
            </Button>
            <AddUserForm
              tradingPlans={tradingPlans}
              open={isAddUserDialogOpen}
              onOpenChange={setIsAddUserDialogOpen}
              onFormSubmit={handleUserCreated} 
            />
          </>
        }
      />
      <UserTableClient initialUsers={users} tradingPlans={tradingPlans} />
    </div>
  );
}
