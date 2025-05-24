
'use client';

import type { User, Wallet, Transaction, KycStatus } from '@/lib/types';
import { mockTradingPlans } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateUserKycStatus, updateUserTradingPlan } from '@/actions/userActions';
import { setWalletBalance } from '@/actions/walletActions'; // New action
import { useState, useTransition, useEffect } from 'react';
import { CheckCircle, XCircle, Edit3, DollarSign } from 'lucide-react';
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

interface UserProfileTabsProps {
  user: User;
  wallets: Wallet[];
  transactions: Transaction[];
}

export function UserProfileTabs({ user: initialUser, wallets: initialWallets, transactions }: UserProfileTabsProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [user, setUser] = useState<User>(initialUser);
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);

  const [kycStatus, setKycStatus] = useState<KycStatus>(user.kyc_status);
  const [kycNotes, setKycNotes] = useState('');
  const [selectedTradingPlanId, setSelectedTradingPlanId] = useState<number>(user.trading_plan_id);

  const [isAdjustBalanceDialogOpen, setIsAdjustBalanceDialogOpen] = useState(false);
  const [selectedWalletForAdjustment, setSelectedWalletForAdjustment] = useState<Wallet | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [balanceAdjustmentNotes, setBalanceAdjustmentNotes] = useState('');
  
  const kycStatuses: KycStatus[] = ['VERIFIED', 'PENDING_REVIEW', 'REJECTED', 'NOT_SUBMITTED'];

  useEffect(() => {
    setUser(initialUser);
    setWallets(initialWallets);
    setKycStatus(initialUser.kyc_status);
    setSelectedTradingPlanId(initialUser.trading_plan_id);
  }, [initialUser, initialWallets]);

  const handleKycUpdate = () => {
    startTransition(async () => {
      const result = await updateUserKycStatus(user.id, kycStatus, kycNotes);
      if (result.success) {
        setUser(prev => ({ ...prev, kyc_status: kycStatus, updated_at: new Date().toISOString() }));
        toast({ title: "Success", description: result.message });
        setKycNotes('');
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleTradingPlanUpdate = () => {
    startTransition(async () => {
      const result = await updateUserTradingPlan(user.id, selectedTradingPlanId);
      if (result.success) {
        setUser(prev => ({ ...prev, trading_plan_id: selectedTradingPlanId, updated_at: new Date().toISOString() }));
        toast({ title: "Success", description: result.message });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const openAdjustBalanceDialog = (wallet: Wallet) => {
    setSelectedWalletForAdjustment(wallet);
    setNewBalanceInput(wallet.balance.toString());
    setBalanceAdjustmentNotes('');
    setIsAdjustBalanceDialogOpen(true);
  };

  const handleBalanceAdjustment = () => {
    if (!selectedWalletForAdjustment || newBalanceInput === '') return;
    const newBalance = parseFloat(newBalanceInput);
    if (isNaN(newBalance) || newBalance < 0) {
      toast({ title: "Error", description: "Invalid balance amount.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await setWalletBalance({
        walletId: selectedWalletForAdjustment.id,
        newBalance: newBalance,
        adminNotes: balanceAdjustmentNotes || "Admin balance adjustment.",
        // adminId will be set by default in action if not provided
      });

      if (result.success && result.wallet) {
        setWallets(prevWallets => 
          prevWallets.map(w => w.id === result.wallet!.id ? result.wallet! : w)
        );
        toast({ title: "Success", description: result.message });
        setIsAdjustBalanceDialogOpen(false);
        setSelectedWalletForAdjustment(null);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };


  return (
    <>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="actions">Admin Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>User Overview</CardTitle>
              <CardDescription>Key details about the user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Firebase UID:</strong> <span className="text-sm text-muted-foreground">{user.firebase_auth_uid}</span></div>
                <div><strong>KYC Status:</strong> <span className={`font-semibold ${
                  user.kyc_status === 'VERIFIED' ? 'text-green-600' : 
                  user.kyc_status === 'PENDING_REVIEW' ? 'text-yellow-600' :
                  user.kyc_status === 'REJECTED' ? 'text-red-600' : 'text-gray-600'
                }`}>{user.kyc_status.replace('_', ' ')}</span></div>
                <div><strong>Email Verified:</strong> {user.is_email_verified ? <CheckCircle className="inline h-5 w-5 text-green-500" /> : <XCircle className="inline h-5 w-5 text-red-500" />}</div>
                <div><strong>Profile Completed:</strong> {user.profile_completed_at ? new Date(user.profile_completed_at).toLocaleDateString() : 'No'}</div>
                <div><strong>PIN Setup Completed:</strong> {user.pin_setup_completed_at ? new Date(user.pin_setup_completed_at).toLocaleDateString() : 'No'}</div>
                <div><strong>Current Trading Plan:</strong> {mockTradingPlans.find(p => p.id === user.trading_plan_id)?.name || 'N/A'}</div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">More sections like Trades, Copy Trading Subscriptions, Price Alerts, User Preferences would be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle>User Wallets</CardTitle>
              <CardDescription>Manage user wallet balances. All direct adjustments are logged.</CardDescription>
            </CardHeader>
            <CardContent>
              {wallets.length > 0 ? (
                <ul className="space-y-3">
                  {wallets.map(wallet => (
                    <li key={wallet.id} className="p-4 border rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-semibold">{wallet.currency} Wallet</p>
                          <p><strong>Current Balance:</strong> {wallet.balance.toFixed(wallet.currency === 'USD' ? 2 : 8)} {wallet.currency}</p>
                          <p className="text-sm text-muted-foreground">Pending Deposit: {wallet.pending_deposit_balance.toFixed(wallet.currency === 'USD' ? 2 : 8)}</p>
                          <p className="text-sm text-muted-foreground">Pending Withdrawal: {wallet.pending_withdrawal_balance.toFixed(wallet.currency === 'USD' ? 2 : 8)}</p>
                          <p className="text-xs text-muted-foreground mt-1">ID: {wallet.id}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openAdjustBalanceDialog(wallet)}>
                          <DollarSign className="mr-2 h-4 w-4" /> Adjust Balance
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p>No wallets found for this user.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>User Transactions</CardTitle>
              <CardDescription>Recent financial activity for this user. Adjustments are logged as transactions.</CardDescription>
            </CardHeader>
            <CardContent>
               {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                      <thead>
                          <tr>
                              <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                              <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                              <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Asset</th>
                              <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                              <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                              <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          {transactions.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(tx => ( // Sort by newest first
                              <tr key={tx.id}>
                                  <td className="py-3 px-3 whitespace-nowrap text-sm text-foreground">{new Date(tx.created_at).toLocaleString()}</td>
                                  <td className="py-3 px-3 whitespace-nowrap text-sm text-foreground">{tx.transaction_type}</td>
                                  <td className="py-3 px-3 whitespace-nowrap text-sm text-foreground">{tx.asset_code}</td>
                                  <td className={`py-3 px-3 whitespace-nowrap text-sm ${tx.amount_asset >= 0 ? 'text-green-600' : 'text-red-600'}`}>{tx.amount_asset.toFixed(tx.asset_code === 'USD' ? 2 : 8)}</td>
                                  <td className="py-3 px-3 whitespace-nowrap text-sm text-foreground">{tx.status}</td>
                                  <td className="py-3 px-3 text-sm text-muted-foreground max-w-xs truncate" title={tx.notes || undefined}>{tx.notes || 'N/A'}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                </div>
              ) : <p>No transactions found for this user.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
              <CardHeader>
                  <CardTitle>User Settings & Preferences</CardTitle>
                  <CardDescription>Display user-configurable settings (read-only for admin or with specific edit permissions).</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">User preferences data (theme, language, notification settings, default leverage, default order type) would be displayed here. Editing these would require specific admin privileges and careful consideration.</p>
              </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="actions">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update KYC Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="kycStatus">KYC Status</Label>
                   <Select value={kycStatus} onValueChange={(value) => setKycStatus(value as KycStatus)}>
                      <SelectTrigger id="kycStatus">
                          <SelectValue placeholder="Select KYC status" />
                      </SelectTrigger>
                      <SelectContent>
                          {kycStatuses.map(status => (
                              <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kycNotes">Admin Notes (Optional)</Label>
                  <Textarea id="kycNotes" value={kycNotes} onChange={(e) => setKycNotes(e.target.value)} placeholder="Reason for status change, internal notes..." />
                </div>
                <Button onClick={handleKycUpdate} disabled={isPending || kycStatus === user.kyc_status}>
                  {isPending ? 'Updating...' : 'Update KYC Status'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Trading Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tradingPlan">Trading Plan</Label>
                  <Select value={selectedTradingPlanId.toString()} onValueChange={(value) => setSelectedTradingPlanId(Number(value))}>
                      <SelectTrigger id="tradingPlan">
                          <SelectValue placeholder="Select new trading plan" />
                      </SelectTrigger>
                      <SelectContent>
                          {mockTradingPlans.map(plan => (
                              <SelectItem key={plan.id} value={plan.id.toString()}>{plan.name} (Min: ${plan.minimum_deposit_usd})</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleTradingPlanUpdate} disabled={isPending || selectedTradingPlanId === user.trading_plan_id}>
                  {isPending ? 'Updating...' : 'Change Trading Plan'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Adjust Balance Dialog */}
      <AlertDialog open={isAdjustBalanceDialogOpen} onOpenChange={setIsAdjustBalanceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adjust Wallet Balance for {selectedWalletForAdjustment?.currency}</AlertDialogTitle>
            <AlertDialogDescription>
              Current Balance: {selectedWalletForAdjustment?.balance.toFixed(selectedWalletForAdjustment?.currency === 'USD' ? 2 : 8)} {selectedWalletForAdjustment?.currency}.
              Enter the new total balance for this wallet. An adjustment transaction will be logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="newBalance">New Balance</Label>
              <Input
                id="newBalance"
                type="number"
                value={newBalanceInput}
                onChange={(e) => setNewBalanceInput(e.target.value)}
                placeholder={`Enter new ${selectedWalletForAdjustment?.currency} balance`}
              />
            </div>
            <div>
              <Label htmlFor="balanceAdjustmentNotes">Admin Notes (Reason)</Label>
              <Textarea
                id="balanceAdjustmentNotes"
                value={balanceAdjustmentNotes}
                onChange={(e) => setBalanceAdjustmentNotes(e.target.value)}
                placeholder="Reason for balance adjustment (e.g., manual deposit confirmation, correction, bonus)"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsAdjustBalanceDialogOpen(false); setSelectedWalletForAdjustment(null);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBalanceAdjustment} disabled={isPending || !balanceAdjustmentNotes.trim() || newBalanceInput === '' || parseFloat(newBalanceInput) < 0}>
              {isPending ? 'Adjusting...' : 'Set New Balance'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
