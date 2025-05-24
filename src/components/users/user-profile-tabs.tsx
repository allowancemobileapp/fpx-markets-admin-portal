
'use client';

import type { User, Wallet, CurrencyCode, BalanceAdjustmentFormData, AdjustBalanceServerActionData, PandLAdjustmentFormData, AdjustPandLServerActionData } from '@/lib/types';
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
import { adjustUserWalletBalance, adjustUserProfitLossBalance } from '@/actions/walletActions';
import { useState, useTransition, useEffect } from 'react';
import { UserX, UserCheck, Edit3, WalletCards, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

// Schema for main balance adjustment (external asset)
const BalanceAdjustmentFormSchema = z.object({
  originalAssetCode: z.custom<CurrencyCode>((val) => typeof val === 'string' && ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'].includes(val), {
    message: "Please select the asset of the external transaction.",
  }),
  originalAssetAmount: z.coerce.number().positive("Amount must be a positive number."),
  adminNotes: z.string().min(5, "Admin notes must be at least 5 characters long (e.g., transaction ID, reason)."),
});

// Schema for P&L balance adjustment
const PandLAdjustmentFormSchema = z.object({
  adjustmentAmount: z.coerce.number().refine(val => val !== 0, "Adjustment amount cannot be zero."), // Allow positive or negative, but not zero
  adminNotes: z.string().min(5, "Admin notes must be at least 5 characters long (e.g., reason for P&L change)."),
});


interface UserProfileTabsProps {
  user: User;
  wallet: Wallet;
}

const availableAssetCodes: CurrencyCode[] = ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'];
const MOCK_ADMIN_PIN = "1234"; // For demo purposes

export function UserProfileTabs({ user: initialUser, wallet: initialWallet }: UserProfileTabsProps) {
  const { toast } = useToast();
  const [isProcessing, startTransition] = useTransition();
  
  const [user, setUser] = useState<User>(initialUser);
  const [wallet, setWallet] = useState<Wallet>(initialWallet);

  const [selectedTradingPlanId, setSelectedTradingPlanId] = useState<number>(user.trading_plan_id);
  
  const [isAdjustBalanceDialogOpen, setIsAdjustBalanceDialogOpen] = useState(false);
  const [isAdjustPandLDialogOpen, setIsAdjustPandLDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Type to distinguish which action to perform after PIN
  type PendingActionType = 'mainBalance' | 'pandlBalance';
  const [pendingActionType, setPendingActionType] = useState<PendingActionType | null>(null);
  const [mainBalanceDataToSubmit, setMainBalanceDataToSubmit] = useState<AdjustBalanceServerActionData | null>(null);
  const [pandlDataToSubmit, setPandlDataToSubmit] = useState<AdjustPandLServerActionData | null>(null);


  const mainBalanceForm = useForm<BalanceAdjustmentFormData>({
    resolver: zodResolver(BalanceAdjustmentFormSchema),
    defaultValues: {
      originalAssetCode: 'USD',
      originalAssetAmount: 0,
      adminNotes: '',
    },
  });

  const pandlForm = useForm<PandLAdjustmentFormData>({
    resolver: zodResolver(PandLAdjustmentFormSchema),
    defaultValues: {
      adjustmentAmount: 0,
      adminNotes: '',
    },
  });
  
  useEffect(() => {
    setUser(initialUser);
    setWallet(initialWallet);
    setSelectedTradingPlanId(initialUser.trading_plan_id);
  }, [initialUser, initialWallet]);


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

  const openAdjustBalanceDialog = () => {
    mainBalanceForm.reset({ originalAssetCode: 'USD', originalAssetAmount: 0, adminNotes: '' });
    setIsAdjustBalanceDialogOpen(true);
  };

  const openAdjustPandLDialog = () => {
    pandlForm.reset({ adjustmentAmount: 0, adminNotes: '' });
    setIsAdjustPandLDialogOpen(true);
  };

  const onMainBalanceFormSubmit = (data: BalanceAdjustmentFormData) => {
    setMainBalanceDataToSubmit({ userId: user.id, ...data });
    setPendingActionType('mainBalance');
    setIsAdjustBalanceDialogOpen(false);
    setIsPinDialogOpen(true);
    setEnteredPin('');
    setPinError('');
  };

  const onPandLFormSubmit = (data: PandLAdjustmentFormData) => {
    setPandlDataToSubmit({ userId: user.id, ...data });
    setPendingActionType('pandlBalance');
    setIsAdjustPandLDialogOpen(false);
    setIsPinDialogOpen(true);
    setEnteredPin('');
    setPinError('');
  };

  const handlePinConfirm = () => {
    if (enteredPin === MOCK_ADMIN_PIN) {
      setPinError('');
      setIsPinDialogOpen(false);
      
      if (pendingActionType === 'mainBalance' && mainBalanceDataToSubmit) {
        startTransition(async () => {
          const result = await adjustUserWalletBalance(mainBalanceDataToSubmit);
          if (result.success && result.wallet) {
            setWallet(result.wallet);
            toast({ title: "Success", description: result.message });
          } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
          }
          setMainBalanceDataToSubmit(null);
        });
      } else if (pendingActionType === 'pandlBalance' && pandlDataToSubmit) {
        startTransition(async () => {
          const result = await adjustUserProfitLossBalance(pandlDataToSubmit);
           if (result.success && result.wallet) {
            setWallet(result.wallet);
            toast({ title: "Success", description: result.message });
          } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
          }
          setPandlDataToSubmit(null);
        });
      }
      setPendingActionType(null);
    } else {
      setPinError("Invalid PIN. Please try again.");
      setEnteredPin('');
    }
  };
  
  const handlePinDialogClose = () => {
    setIsPinDialogOpen(false);
    setEnteredPin('');
    setPinError('');
    setMainBalanceDataToSubmit(null);
    setPandlDataToSubmit(null);
    setPendingActionType(null);
  }


  return (
    <>
      <Tabs defaultValue="wallet" className="w-full"> {/* Default to wallet tab */}
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="actions">Admin Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>User Overview</CardTitle>
              <CardDescription>Key details about the user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Firebase UID:</strong> <span className="text-muted-foreground">{user.firebase_auth_uid}</span></div>
                <div><strong>Email Verified:</strong> {user.is_email_verified ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>}</div>
                <div><strong>Profile Completed:</strong> {user.profile_completed_at ? new Date(user.profile_completed_at).toLocaleDateString() : 'No'}</div>
                <div><strong>PIN Setup Completed:</strong> {user.pin_setup_completed_at ? new Date(user.pin_setup_completed_at).toLocaleDateString() : 'No'}</div>
                <div><strong>Current Trading Plan:</strong> {mockTradingPlans.find(p => p.id === user.trading_plan_id)?.name || 'N/A'}</div>
                <div><strong>Account Status:</strong> <span className={`font-semibold ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>{user.is_active ? 'Active' : 'Blocked/Inactive'}</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <div className="space-y-6">
            <Card className="shadow-md border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Account Balance</CardTitle>
                <WalletCards className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-1">
                  {wallet.balance.toFixed(2)} <span className="text-xl text-muted-foreground">{wallet.currency}</span>
                </div>
                <CardDescription className="text-xs mb-3">User's main available funds. Updated by admin for confirmed external transactions.</CardDescription>
                <Button onClick={openAdjustBalanceDialog} variant="outline" size="sm">
                  <Edit3 className="mr-2 h-4 w-4" /> Adjust Main Balance
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-md border-accent/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Profit & Loss (P&L)</CardTitle>
                {wallet.profit_loss_balance >= 0 ? <TrendingUp className="h-6 w-6 text-green-500" /> : <TrendingDown className="h-6 w-6 text-red-500" />}
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold mb-1 ${wallet.profit_loss_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {wallet.profit_loss_balance.toFixed(2)} <span className="text-xl text-muted-foreground">{wallet.currency}</span>
                </div>
                <CardDescription className="text-xs mb-3">User's realized profit or loss. Can be adjusted by admin.</CardDescription>
                <Button onClick={openAdjustPandLDialog} variant="outline" size="sm">
                  <Edit3 className="mr-2 h-4 w-4" /> Adjust P&L Balance
                </Button>
              </CardContent>
            </Card>
             <p className="text-xs text-muted-foreground pt-2 text-center">
                Wallet Last Updated: {new Date(wallet.updated_at).toLocaleString()}
            </p>
          </div>
        </TabsContent>
        
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
                  disabled={isProcessing}
                  variant={user.is_active ? "destructive" : "default"}
                >
                  {isProcessing ? (user.is_active ? 'Blocking...' : 'Unblocking...') : (user.is_active ? <><UserX className="mr-2 h-4 w-4" /> Block User</> : <><UserCheck className="mr-2 h-4 w-4" /> Unblock User</>)}
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
                <Button onClick={handleTradingPlanUpdate} disabled={isProcessing || selectedTradingPlanId === user.trading_plan_id}>
                  {isProcessing ? 'Updating...' : 'Change Trading Plan'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Adjust Main Balance Dialog */}
      <AlertDialog open={isAdjustBalanceDialogOpen} onOpenChange={setIsAdjustBalanceDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Adjust User Main Account Balance</AlertDialogTitle>
            <AlertDialogDescription>
              Current Main Balance: <span className="font-semibold">{wallet.balance.toFixed(2)} {wallet.currency}</span>.
              Enter details of the user's external deposit. The balance will be converted to {wallet.currency} and added.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...mainBalanceForm}>
            <form onSubmit={mainBalanceForm.handleSubmit(onMainBalanceFormSubmit)} className="space-y-4 py-2">
              <FormField
                control={mainBalanceForm.control}
                name="originalAssetCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset of External Transaction</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset (e.g., BTC, ETH)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableAssetCodes.map(code => (
                          <SelectItem key={code} value={code}>{code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={mainBalanceForm.control}
                name="originalAssetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount of External Asset Deposited</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., 0.5 or 1000" {...field} />
                    </FormControl>
                     <FormDescription>Enter the amount of the asset the user deposited (e.g., 0.5 for BTC).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={mainBalanceForm.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Notes (Required)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Reason, external transaction ID, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AlertDialogFooter className="pt-4">
                <AlertDialogCancel onClick={() => setIsAdjustBalanceDialogOpen(false)}>Cancel</AlertDialogCancel>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Proceed to PIN'}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adjust P&L Balance Dialog */}
      <AlertDialog open={isAdjustPandLDialogOpen} onOpenChange={setIsAdjustPandLDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Adjust User P&L Balance</AlertDialogTitle>
            <AlertDialogDescription>
              Current P&L Balance: <span className="font-semibold">{wallet.profit_loss_balance.toFixed(2)} {wallet.currency}</span>.
              Enter the amount to adjust the P&L balance by (in {wallet.currency}). Use positive for credits, negative for debits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...pandlForm}>
            <form onSubmit={pandlForm.handleSubmit(onPandLFormSubmit)} className="space-y-4 py-2">
               <FormField
                control={pandlForm.control}
                name="adjustmentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Amount ({wallet.currency})</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., 100 or -50" {...field} />
                    </FormControl>
                     <FormDescription>Enter positive for profit credits, negative for loss debits.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pandlForm.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Notes (Required)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Reason for P&L adjustment, e.g., trade settlement, bonus" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AlertDialogFooter className="pt-4">
                <AlertDialogCancel onClick={() => setIsAdjustPandLDialogOpen(false)}>Cancel</AlertDialogCancel>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Proceed to PIN'}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>


      {/* Admin PIN Dialog (Common for all adjustments) */}
      <AlertDialog open={isPinDialogOpen} onOpenChange={handlePinDialogClose}>
        <AlertDialogContent className="sm:max-w-xs">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/>Admin PIN Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your 4-digit Admin PIN to authorize this balance adjustment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="password"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={enteredPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setEnteredPin(val);
                if (pinError) setPinError('');
              }}
              className="text-center text-lg tracking-[0.5em]"
            />
            {pinError && <p className="text-sm text-destructive text-center">{pinError}</p>}
          </div>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel onClick={handlePinDialogClose}>Cancel</AlertDialogCancel>
            <Button onClick={handlePinConfirm} disabled={isProcessing || enteredPin.length !== 4}>
              {isProcessing ? 'Authorizing...' : 'Confirm Adjustment'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
