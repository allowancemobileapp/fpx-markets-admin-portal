
'use client';

import type { User, Wallet, CurrencyCode, BalanceAdjustmentFormData, AdjustBalanceServerActionData } from '@/lib/types';
import { mockTradingPlans } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keep Label for other parts
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateUserTradingPlan, toggleUserActiveStatus } from '@/actions/userActions';
import { adjustUserWalletBalance } from '@/actions/walletActions';
import { useState, useTransition, useEffect } from 'react';
import { UserX, UserCheck, Edit3, WalletCards, ShieldCheck } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Added for PIN dialog trigger
} from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

// Simplified form schema: only asks for original asset and amount, and notes.
// The USDT equivalent will be calculated on the server.
const BalanceAdjustmentFormSchema = z.object({
  originalAssetCode: z.custom<CurrencyCode>((val) => typeof val === 'string' && ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'].includes(val), {
    message: "Please select the asset of the external transaction.",
  }),
  originalAssetAmount: z.coerce.number().positive("Amount must be a positive number."), // Assuming deposits are positive
  adminNotes: z.string().min(5, "Admin notes must be at least 5 characters long (e.g., transaction ID, reason)."),
});

interface UserProfileTabsProps {
  user: User;
  wallet: Wallet;
}

const availableAssetCodes: CurrencyCode[] = ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'];
const MOCK_ADMIN_PIN = "1234"; // For demo purposes

export function UserProfileTabs({ user: initialUser, wallet: initialWallet }: UserProfileTabsProps) {
  const { toast } = useToast();
  const [isProcessing, startTransition] = useTransition(); // Renamed for clarity
  
  const [user, setUser] = useState<User>(initialUser);
  const [wallet, setWallet] = useState<Wallet>(initialWallet);

  const [selectedTradingPlanId, setSelectedTradingPlanId] = useState<number>(user.trading_plan_id);
  
  // State for Adjust Balance Dialog
  const [isAdjustBalanceDialogOpen, setIsAdjustBalanceDialogOpen] = useState(false);
  // State for Admin PIN Dialog
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [adjustmentDataToSubmit, setAdjustmentDataToSubmit] = useState<AdjustBalanceServerActionData | null>(null);


  const form = useForm<BalanceAdjustmentFormData>({
    resolver: zodResolver(BalanceAdjustmentFormSchema),
    defaultValues: {
      originalAssetCode: 'USD', // Default to USD
      originalAssetAmount: 0,
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
    form.reset({ originalAssetCode: 'USD', originalAssetAmount: 0, adminNotes: '' });
    setIsAdjustBalanceDialogOpen(true);
  };

  // Called when the simplified adjustment form is submitted
  const onBalanceAdjustmentFormSubmit = (data: BalanceAdjustmentFormData) => {
    setAdjustmentDataToSubmit({ userId: user.id, ...data });
    setIsAdjustBalanceDialogOpen(false); // Close adjustment dialog
    setIsPinDialogOpen(true); // Open PIN dialog
    setEnteredPin('');
    setPinError('');
  };

  const handlePinConfirm = () => {
    if (enteredPin === MOCK_ADMIN_PIN) {
      setPinError('');
      setIsPinDialogOpen(false);
      if (adjustmentDataToSubmit) {
        startTransition(async () => {
          const result = await adjustUserWalletBalance(adjustmentDataToSubmit);
          if (result.success && result.wallet) {
            setWallet(result.wallet);
            toast({ title: "Success", description: result.message });
          } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
          }
          setAdjustmentDataToSubmit(null); // Clear data after submission
        });
      }
    } else {
      setPinError("Invalid PIN. Please try again.");
      setEnteredPin(''); // Clear PIN input on error
    }
  };
  
  const handlePinDialogClose = () => {
    setIsPinDialogOpen(false);
    setEnteredPin('');
    setPinError('');
    setAdjustmentDataToSubmit(null); // Clear pending data if PIN dialog is cancelled
  }


  return (
    <>
      <Tabs defaultValue="overview" className="w-full">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Firebase UID:</strong> <span className="text-sm text-muted-foreground">{user.firebase_auth_uid}</span></div>
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
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-2xl font-bold">Account Balance</CardTitle>
                <CardDescription>User's main account balance in {wallet.currency}. Updated by admin for confirmed external transactions.</CardDescription>
              </div>
              <WalletCards className="h-8 w-8 text-accent flex-shrink-0" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-4xl font-bold text-primary">
                {wallet.balance.toFixed(2)} <span className="text-2xl text-muted-foreground">{wallet.currency}</span>
              </div>
              <Button onClick={openAdjustBalanceDialog} className="w-full sm:w-auto" variant="outline">
                <Edit3 className="mr-2 h-4 w-4" /> Adjust Balance
              </Button>
              <p className="text-xs text-muted-foreground pt-2">
                This balance reflects all confirmed transactions and admin adjustments. <br/>
                Last Updated: {new Date(wallet.updated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
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
                  <Label htmlFor="tradingPlan">Trading Plan</Label> {/* Using ShadCN Label */}
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

      {/* Adjust Balance Dialog */}
      <AlertDialog open={isAdjustBalanceDialogOpen} onOpenChange={setIsAdjustBalanceDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Adjust User Account Balance</AlertDialogTitle>
            <AlertDialogDescription>
              Current Balance: <span className="font-semibold">{wallet.balance.toFixed(2)} {wallet.currency}</span>.
              Enter details of the user's external deposit. The balance will be converted and added to their {wallet.currency} wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onBalanceAdjustmentFormSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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

      {/* Admin PIN Dialog */}
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
              type="password" // Mask PIN input
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={enteredPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); // Allow only digits
                setEnteredPin(val);
                if (pinError) setPinError(''); // Clear error on new input
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

