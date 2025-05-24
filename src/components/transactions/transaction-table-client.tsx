// src/components/transactions/transaction-table-client.tsx
'use client';

import * as React from 'react';
import { Eye, Edit, CheckCircle, XCircle, MoreVertical, Search, Filter, MessageSquare } from 'lucide-react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { processTransaction, addTransactionNote } from '@/actions/transactionActions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
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
  
  const [processingTx, setProcessingTx] = React.useState<Transaction | null>(null);
  const [actionType, setActionType] = React.useState<'CONFIRM_DEPOSIT' | 'FAIL_DEPOSIT' | 'PROCESS_WITHDRAWAL' | 'REJECT_WITHDRAWAL' | null>(null);
  const [adminNotes, setAdminNotes] = React.useState('');

  const [addingNoteTx, setAddingNoteTx] = React.useState<Transaction | null>(null);
  const [newNote, setNewNote] = React.useState('');


  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();


  const handleProcessAction = () => {
    if (!processingTx || !actionType) return;

    let newStatus: TransactionStatus;
    switch (actionType) {
      case 'CONFIRM_DEPOSIT': newStatus = 'COMPLETED'; break;
      case 'FAIL_DEPOSIT': newStatus = 'FAILED'; break;
      case 'PROCESS_WITHDRAWAL': newStatus = 'COMPLETED'; break; // Simplified: PENDING -> COMPLETED
      case 'REJECT_WITHDRAWAL': newStatus = 'FAILED'; break;
      default: return;
    }

    startTransition(async () => {
      const result = await processTransaction(processingTx.id, newStatus, adminNotes);
      if (result.success) {
        setTransactions(prevTxs => prevTxs.map(tx => 
          tx.id === processingTx.id ? { ...tx, status: newStatus, notes: `${tx.notes || ''}\nAdmin: ${adminNotes}`, updated_at: new Date().toISOString() } : tx
        ));
        toast({ title: "Success", description: result.message });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
      setProcessingTx(null);
      setActionType(null);
      setAdminNotes('');
    });
  };

  const handleAddNote = () => {
    if (!addingNoteTx || !newNote.trim()) return;
    startTransition(async () => {
      const result = await addTransactionNote(addingNoteTx.id, newNote.trim());
      if (result.success) {
         setTransactions(prevTxs => prevTxs.map(tx => 
          tx.id === addingNoteTx.id ? { ...tx, notes: `${tx.notes || ''}\nAdmin: ${newNote.trim()}`, updated_at: new Date().toISOString() } : tx
        ));
        toast({ title: "Success", description: result.message });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
      setAddingNoteTx(null);
      setNewNote('');
    });
  };


  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.external_transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tx.id.toLowerCase().includes(searchTerm.toLowerCase());
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

  const transactionStatuses: TransactionStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];
  const transactionTypes: TransactionType[] = ['DEPOSIT', 'WITHDRAWAL', 'FEE', 'ADJUSTMENT', 'TRADE_SETTLEMENT'];
  const assetCodes: CurrencyCode[] = ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'];

  const openProcessDialog = (tx: Transaction, type: 'CONFIRM_DEPOSIT' | 'FAIL_DEPOSIT' | 'PROCESS_WITHDRAWAL' | 'REJECT_WITHDRAWAL') => {
    setProcessingTx(tx);
    setActionType(type);
    setAdminNotes(''); // Reset notes
  };

  const openAddNoteDialog = (tx: Transaction) => {
    setAddingNoteTx(tx);
    setNewNote('');
  }

  return (
    <>
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="p-4 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between border-b">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transactions..."
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
              <SelectTrigger className="w-full sm:w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Asset" /></SelectTrigger>
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
                <TableHead>Asset</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ext. ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell>{tx.amount_asset.toFixed(tx.asset_code === 'USD' ? 2 : 8)}</TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell>{tx.external_transaction_id || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /><span className="sr-only">Actions</span></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => alert(`View details for tx: ${tx.id}. Not implemented.`)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAddNoteDialog(tx)}><MessageSquare className="mr-2 h-4 w-4" />Add/Edit Note</DropdownMenuItem>
                        {tx.status === 'PENDING' && tx.transaction_type === 'DEPOSIT' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openProcessDialog(tx, 'CONFIRM_DEPOSIT')}><CheckCircle className="mr-2 h-4 w-4 text-green-500" />Confirm Deposit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openProcessDialog(tx, 'FAIL_DEPOSIT')} className="text-red-600"><XCircle className="mr-2 h-4 w-4" />Fail Deposit</DropdownMenuItem>
                          </>
                        )}
                        {tx.status === 'PENDING' && tx.transaction_type === 'WITHDRAWAL' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openProcessDialog(tx, 'PROCESS_WITHDRAWAL')}><CheckCircle className="mr-2 h-4 w-4 text-green-500" />Process Withdrawal</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openProcessDialog(tx, 'REJECT_WITHDRAWAL')} className="text-red-600"><XCircle className="mr-2 h-4 w-4" />Reject Withdrawal</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} className="text-center h-24">No transactions found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Showing {filteredTransactions.length} of {transactions.length} transactions.</p>
            <div className="flex gap-2"><Button variant="outline" size="sm" disabled>Previous</Button><Button variant="outline" size="sm" disabled>Next</Button></div>
        </div>
      </CardContent>
    </Card>

    {/* Process Transaction Dialog */}
    <AlertDialog open={!!(processingTx && actionType)} onOpenChange={(open) => !open && (setProcessingTx(null), setActionType(null))}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Action: {actionType?.replace('_', ' ').toLowerCase()}</AlertDialogTitle>
                <AlertDialogDescription>
                    You are about to {actionType?.toLowerCase().replace('_', ' ')} for transaction ID: {processingTx?.id}.
                    Amount: {processingTx?.amount_asset} {processingTx?.asset_code}.
                    Please add any relevant notes for this action.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea 
                placeholder="Admin notes (e.g., reason for failure, confirmation details)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)} 
            />
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {setProcessingTx(null); setActionType(null);}}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleProcessAction} disabled={isPending}>
                    {isPending ? 'Processing...' : `Confirm ${actionType?.split('_')[0]}`}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {/* Add Note Dialog */}
     <AlertDialog open={!!addingNoteTx} onOpenChange={(open) => !open && setAddingNoteTx(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Add Note to Transaction</AlertDialogTitle>
                <AlertDialogDescription>
                    Add an administrative note to transaction ID: {addingNoteTx?.id}.
                    Existing notes: {addingNoteTx?.notes || "None"}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea 
                placeholder="Enter new note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)} 
            />
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAddingNoteTx(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAddNote} disabled={isPending || !newNote.trim()}>
                    {isPending ? 'Adding...' : 'Add Note'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
