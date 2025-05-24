import { Repeat } from 'lucide-react';
import { mockTransactions } from '@/lib/mock-data';
import { PageHeader } from '@/components/shared/page-header';
import { TransactionTableClient } from '@/components/transactions/transaction-table-client';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const transactions = mockTransactions; // In a real app, fetch from API/DB

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Management"
        description="View and manage all financial transactions."
        icon={Repeat}
      />
      <TransactionTableClient initialTransactions={transactions} />
    </div>
  );
}
