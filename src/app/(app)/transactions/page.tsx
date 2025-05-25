// src/app/(app)/transactions/page.tsx
import { ListFilter } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { TransactionTableClient } from '@/components/transactions/transaction-table-client';
import { getTransactionsLog } from '@/actions/walletActions'; // Import from walletActions

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const transactions = await getTransactionsLog(); // Fetch transactions from DB

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
