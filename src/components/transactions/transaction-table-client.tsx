
// src/components/transactions/transaction-table-client.tsx
'use client';

import * as React from 'react';
import { Eye, Search, Filter, MessageSquare, Briefcase } from 'lucide-react';
import type { Transaction, TransactionStatus, TransactionType, CurrencyCode } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { FormattedDateCell } from '@/components/shared/formatted-date-cell';
import { getTransactionsLog } from '@/actions/walletActions'; // Import the server action

import Link from 'next/link';

interface TransactionTableClientProps {
  initialTransactions: Transaction[];
}

export function TransactionTableClient({ initialTransactions }: TransactionTableClientProps) {
  const [transactions, setTransactions] = React.useState<Transaction[]>(initialTransactions);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<TransactionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = React.useState<TransactionType | 'all'>('all');
  const [assetFilter, setAssetFilter] = React.useState<CurrencyCode | 'all'>('all');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setTransactions(initialTransactions);
  },[initialTransactions]);

  const fetchFilteredTransactions = async () => {
    setIsLoading(true);
    try {
      const fetchedTransactions = await getTransactionsLog({
        searchTerm: searchTerm || undefined,
        statusFilter: statusFilter === 'all' ? undefined : statusFilter,
        typeFilter: typeFilter === 'all' ? undefined : typeFilter,
        assetFilter: assetFilter === 'all' ? undefined : assetFilter,
        // Add limit/offset if implementing pagination
      });
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      // Optionally, show a toast message here
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch on initial load or when filters change
  // Debounce search term or use a search button to avoid too many requests
  React.useEffect(() => {
    const handler = setTimeout(() => {
        // Only fetch if a filter has actually been applied or search term exists
        if (searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || assetFilter !== 'all') {
           // fetchFilteredTransactions(); // Keep this if you want live filtering from DB
        } else if (!searchTerm && statusFilter === 'all' && typeFilter === 'all' && assetFilter === 'all') {
            // Reset to initial if all filters are cleared (client-side)
            // setTransactions(initialTransactions); // Or re-fetch all
        }
    }, 500); // Debounce for 500ms

    return () => {
        clearTimeout(handler);
    };
  }, [searchTerm, statusFilter, typeFilter, assetFilter]);


  const clientSideFilteredTransactions = React.useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = !searchTerm || // if no search term, all match this part
                            tx.external_transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchesType = typeFilter === 'all' || tx.transaction_type === typeFilter;
      const matchesAsset = assetFilter === 'all' || tx.asset_code === assetFilter;
      return matchesSearch && matchesStatus && matchesType && matchesAsset;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions, searchTerm, statusFilter, typeFilter, assetFilter]);


  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'COMPLETED': return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'PENDING': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Pending</Badge>;
      case 'PROCESSING': return <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>;
      case 'FAILED':
      case 'CANCELLED': return <Badge variant="destructive">{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const transactionStatuses: TransactionStatus[] = ['COMPLETED', 'PENDING', 'PROCESSING', 'FAILED', 'CANCELLED'];
  const transactionTypes: TransactionType[] = ['ADJUSTMENT', 'DEPOSIT', 'WITHDRAWAL', 'FEE', 'TRADE_SETTLEMENT'];
  const assetCodes: CurrencyCode[] = ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'];


  return (
    <>
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="p-4 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between border-b">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tx ID, user, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TransactionStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {transactionStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionType | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                 {transactionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assetFilter} onValueChange={(value) => setAssetFilter(value as CurrencyCode | 'all')}>
              <SelectTrigger className="w-full sm:w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Original Asset" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                 {assetCodes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Removed Search Button as search is now on type
            <Button onClick={fetchFilteredTransactions} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
            */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Original Asset</TableHead>
                <TableHead>Original Amount</TableHead>
                <TableHead>Adjustment Value (USDT)</TableHead>
                <TableHead>Final Balance (USDT)</TableHead>
                <TableHead>Trading Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center h-24">Loading transactions...</TableCell></TableRow>
              ) : clientSideFilteredTransactions.length > 0 ? clientSideFilteredTransactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/50">
                  <TableCell><FormattedDateCell dateString={tx.created_at} /></TableCell>
                  <TableCell>
                    <Link href={`/users/${tx.user_id}`} className="font-medium text-primary hover:underline">
                      {tx.username || tx.user_email || tx.user_id.substring(0,8)}
                    </Link>
                  </TableCell>
                  <TableCell>{tx.transaction_type}</TableCell>
                  <TableCell>{tx.asset_code}</TableCell>
                  <TableCell>{tx.amount_asset.toFixed(tx.asset_code === 'USD' || tx.asset_code === 'USDT' ? 2 : (tx.asset_code === 'BTC' ? 8 : 6))}</TableCell>
                  <TableCell>{tx.amount_usd_equivalent.toFixed(2)}</TableCell>
                  <TableCell>{tx.balance_after_transaction !== undefined ? tx.balance_after_transaction.toFixed(2) : 'N/A'}</TableCell>
                  <TableCell className="flex items-center">
                    {tx.trading_plan_name || 'N/A'}
                    {tx.trading_plan_name && <Briefcase className="ml-1 h-3 w-3 text-muted-foreground" />}
                  </TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell className="max-w-xs truncate" title={tx.notes || undefined}>{tx.notes || 'N/A'}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={10} className="text-center h-24">No transactions found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Showing {clientSideFilteredTransactions.length} of {transactions.length} transactions.</p>
            {/* Pagination can be implemented later */}
            <div className="flex gap-2"><Button variant="outline" size="sm" disabled>Previous</Button><Button variant="outline" size="sm" disabled>Next</Button></div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
