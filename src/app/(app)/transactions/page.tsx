// src/app/(app)/transactions/page.tsx
import { ListFilter } from 'lucide-react';
import { mockTransactions } from '@/lib/mock-data';
import { PageHeader } from '@/components/shared/page-header';
import { TransactionTableClient } from '@/components/transactions/transaction-table-client';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  // In a real app, fetch transactions from your database/API
  const transactions = mockTransactions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Log"
        description="View all admin-initiated balance adjustments."
        icon={ListFilter}
      />
      <TransactionTableClient initialTransactions={transactions} />
    </div>
  );
}
