
'use client';

import type { User, Wallet } from '@/lib/types'; // Transaction removed
import { mockTradingPlans } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateUserTradingPlan, toggleUserActiveStatus } from '@/actions/userActions';
import { setWalletBalance } from '@/actions/walletActions';
import { useState, useTransition, useEffect } from 'react';
import { CheckCircle, XCircle, UserX, UserCheck, Edit3 } from 'lucide-react'; // DollarSign changed to Edit3
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

interface UserProfileTabsProps {
  user: User;
  wallets: Wallet[];
  // transactions prop removed
}

export function UserProfileTabs({ user: initialUser, wallets: initialWallets }: UserProfileTabsProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [user, setUser] = useState<User>(initialUser);
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);

  const [selectedTradingPlanId, setSelectedTradingPlanId] = useState<number>(user.trading_plan_id);

  const [isAdjustBalanceDialogOpen, setIsAdjustBalanceDialogOpen] = useState(false);
  const [selectedWalletForAdjustment, setSelectedWalletForAdjustment] = useState<Wallet | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [balanceAdjustmentNotes, setBalanceAdjustmentNotes] = useState('');
  
  useEffect(() => {
    setUser(initialUser);
    setWallets(initialWallets);
    setSelectedTradingPlanId(initialUser.trading_plan_id);
  }, [initialUser, initialWallets]);


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

  const handleToggleActiveStatus = () => {
    startTransition(async () => {
      const result = await toggleUserActiveStatus(user.id, !user.is_active);
      if (result.success) {
        setUser(prev => ({ ...prev, is_active: !prev.is_active, updated_at: new Date().toISOString() }));
        toast({ title: "Success", description: result.message });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const openEditBalanceDialog = (wallet: Wallet) => {
    setSelectedWalletForAdjustment(wallet);
    setNewBalanceInput(wallet.balance.toString()); // Pre-fill with current balance
    setBalanceAdjustmentNotes('');
    setIsAdjustBalanceDialogOpen(true);
  };

  const handleBalanceAdjustment = () => {
    if (!selectedWalletForAdjustment || newBalanceInput === '') return;
    const newBalance = parseFloat(newBalanceInput);
    if (isNaN(newBalance) || newBalance < 0) {
      toast({ title: "Error", description: "Invalid balance amount. Must be a non-negative number.", variant: "destructive" });
      return;
    }
    if (!balanceAdjustmentNotes.trim()) {
      toast({ title: "Error", description: "Admin notes are required for balance adjustment.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await setWalletBalance({
        walletId: selectedWalletForAdjustment.id,
        newBalance: newBalance,
        adminNotes: balanceAdjustmentNotes, // adminNotes is now required
      });

      if (result.success && result.wallet) {
        setWallets(prevWallets => 
          prevWallets.map(w => w.id === result.wallet!.id ? result.wallet! : w)
        );
        toast({ title: "Success", description: result.message });
        setIsAdjustBalanceDialogOpen(false);
        setSelectedWalletForAdjustment(null);
        setNewBalanceInput('');
        setBalanceAdjustmentNotes('');
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };


  return (
    <>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4"> {/* Adjusted to 3 cols */}
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          {/* Transactions TabTrigger removed */}
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
                <div><strong>Email Verified:</strong> {user.is_email_verified ? <CheckCircle className="inline h-5 w-5 text-green-500" /> : <XCircle className="inline h-5 w-5 text-red-500" />}</div>
                <div><strong>Profile Completed:</strong> {user.profile_completed_at ? new Date(user.profile_completed_at).toLocaleDateString() : 'No'}</div>
                <div><strong>PIN Setup Completed:</strong> {user.pin_setup_completed_at ? new Date(user.pin_setup_completed_at).toLocaleDateString() : 'No'}</div>
                <div><strong>Current Trading Plan:</strong> {mockTradingPlans.find(p => p.id === user.trading_plan_id)?.name || 'N/A'}</div>
                <div><strong>Account Status:</strong> <span className={`font-semibold ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>{user.is_active ? 'Active' : 'Blocked/Inactive'}</span></div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Further user details like registration IP, last login, etc., could be added here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle>User Wallets</CardTitle>
              <CardDescription>Manage user wallet balances. Direct adjustments are logged as 'ADJUSTMENT' transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              {wallets.length > 0 ? (
                <ul className="space-y-4">
                  {wallets.map(wallet => (
                    <li key={wallet.id} className="p-4 border rounded-lg shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="flex-grow">
                          <p className="text-lg font-semibold">{wallet.currency} Wallet</p>
                          <p>
                            <strong>Current Balance: {wallet.balance.toFixed(wallet.currency === 'USD' ? 2 : 8)} {wallet.currency}</strong>
                          </p>
                          <p className="text-sm text-muted-foreground">Pending Deposit: {wallet.pending_deposit_balance.toFixed(wallet.currency === 'USD' ? 2 : 8)}</p>
                          <p className="text-sm text-muted-foreground">Pending Withdrawal: {wallet.pending_withdrawal_balance.toFixed(wallet.currency === 'USD' ? 2 : 8)}</p>
                          <p className="text-xs text-muted-foreground mt-1">ID: {wallet.id}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openEditBalanceDialog(wallet)} className="w-full sm:w-auto">
                          <Edit3 className="mr-2 h-4 w-4" /> Edit Balance
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p>No wallets found for this user.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions TabContent removed */}
        
        <TabsContent value="actions">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>
                  {user.is_active ? "User account is currently active." : "User account is currently blocked/inactive."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleToggleActiveStatus} 
                  disabled={isPending}
                  variant={user.is_active ? "destructive" : "default"}
                >
                  {isPending ? (user.is_active ? 'Blocking...' : 'Unblocking...') : (user.is_active ? <><UserX className="mr-2 h-4 w-4" /> Block User</> : <><UserCheck className="mr-2 h-4 w-4" /> Unblock User</>)}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Blocking a user will prevent them from logging in or using platform services. Unblocking restores access. An email notification will be sent.
                </p>
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

      <AlertDialog open={isAdjustBalanceDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setSelectedWalletForAdjustment(null);
            setNewBalanceInput('');
            setBalanceAdjustmentNotes('');
          }
          setIsAdjustBalanceDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Wallet Balance for {selectedWalletForAdjustment?.currency}</AlertDialogTitle>
            <AlertDialogDescription>
              Current Balance: <span className="font-semibold">{selectedWalletForAdjustment?.balance.toFixed(selectedWalletForAdjustment?.currency === 'USD' ? 2 : 8)} {selectedWalletForAdjustment?.currency}</span>.
              <br/>
              Enter the new total balance for this wallet. Pending balances may be adjusted. An adjustment transaction will be logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="newBalance">New Total Balance</Label>
              <Input
                id="newBalance"
                type="number"
                value={newBalanceInput}
                onChange={(e) => setNewBalanceInput(e.target.value)}
                placeholder={`Enter new ${selectedWalletForAdjustment?.currency} balance`}
              />
            </div>
            <div>
              <Label htmlFor="balanceAdjustmentNotes">Admin Notes (Required)</Label>
              <Textarea
                id="balanceAdjustmentNotes"
                value={balanceAdjustmentNotes}
                onChange={(e) => setBalanceAdjustmentNotes(e.target.value)}
                placeholder="Reason for balance adjustment (e.g., confirmed deposit #123, bonus, correction)"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBalanceAdjustment} 
              disabled={isPending || !balanceAdjustmentNotes.trim() || newBalanceInput === '' || parseFloat(newBalanceInput) < 0 || (selectedWalletForAdjustment && parseFloat(newBalanceInput) === selectedWalletForAdjustment.balance)}
            >
              {isPending ? 'Saving...' : 'Save New Balance'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
