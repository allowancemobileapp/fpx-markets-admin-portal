
// src/components/transactions/transaction-table-client.tsx
'use client';

import * as React from 'react';
import { Eye, Search, Filter, MessageSquare } from 'lucide-react'; // Removed Edit, CheckCircle, XCircle, MoreVertical
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuSeparator, // Not needed if only view/note
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
// import { processTransaction, addTransactionNote } from '@/actions/transactionActions'; // processTransaction removed
// For now, let's assume addTransactionNote might still be useful for adjustments, or remove it.
// For simplicity, let's remove addTransactionNote as notes are part of the adjustment itself.
import { useToast } from '@/hooks/use-toast';
/*
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
*/
import Link from 'next/link';

interface TransactionTableClientProps {
  initialTransactions: Transaction[];
}

export function TransactionTableClient({ initialTransactions }: TransactionTableClientProps) {
  const [transactions, setTransactions] = React.useState<Transaction[]>(initialTransactions);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<TransactionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = React.useState<TransactionType | 'all'>('all'); // Should primarily be 'ADJUSTMENT'
  const [assetFilter, setAssetFilter] = React.useState<CurrencyCode | 'all'>('all');
  
  // const { toast } = useToast();
  // const [isPending, startTransition] = React.useTransition();

  // States for dialogs (processingTx, actionType, adminNotes, addingNoteTx, newNote) are removed
  // as processing actions are removed.

  // handleProcessAction and handleAddNote removed.

  React.useEffect(() => {
    setTransactions(initialTransactions);
  },[initialTransactions]);


  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.external_transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchesType = typeFilter === 'all' || tx.transaction_type === typeFilter;
      const matchesAsset = assetFilter === 'all' || tx.asset_code === assetFilter;
      return matchesSearch && matchesStatus && matchesType && matchesAsset;
    });
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

  const transactionStatuses: TransactionStatus[] = ['COMPLETED', 'PENDING', 'PROCESSING', 'FAILED', 'CANCELLED']; // COMPLETED is main one for adjustments
  const transactionTypes: TransactionType[] = ['ADJUSTMENT', 'DEPOSIT', 'WITHDRAWAL', 'FEE', 'TRADE_SETTLEMENT']; // ADJUSTMENT is primary
  const assetCodes: CurrencyCode[] = ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'];

  // openProcessDialog and openAddNoteDialog removed.

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
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                {/* <TableHead className="text-right">Actions</TableHead> Actions column can be removed if only viewing */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/50">
                  <TableCell>{format(new Date(tx.created_at), 'PPpp')}</TableCell>
                  <TableCell>
                    <Link href={`/users/${tx.user_id}`} className="font-medium text-primary hover:underline">
                      {tx.username || tx.user_email || tx.user_id.substring(0,8)}
                    </Link>
                  </TableCell>
                  <TableCell>{tx.transaction_type}</TableCell>
                  <TableCell>{tx.asset_code}</TableCell>
                  <TableCell>{tx.amount_asset.toFixed(tx.asset_code === 'USD' || tx.asset_code === 'USDT' ? 2 : 8)}</TableCell>
                  <TableCell>{tx.amount_usd_equivalent.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell className="max-w-xs truncate" title={tx.notes || undefined}>{tx.notes || 'N/A'}</TableCell>
                  {/* Action dropdown removed for simplicity, can be added back for "View Details" or "Add Note" if needed */}
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} className="text-center h-24">No transactions found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Showing {filteredTransactions.length} of {transactions.length} transactions.</p>
            {/* Pagination can be implemented later */}
            <div className="flex gap-2"><Button variant="outline" size="sm" disabled>Previous</Button><Button variant="outline" size="sm" disabled>Next</Button></div>
        </div>
      </CardContent>
    </Card>
    {/* Dialogs for processing/adding notes are removed */}
    </>
  );
}
