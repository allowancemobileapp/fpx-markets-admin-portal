
'use client';

import type { User, Wallet, CurrencyCode, BalanceAdjustmentFormData } from '@/lib/types';
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
import { adjustUserWalletBalance } from '@/actions/walletActions';
import { useState, useTransition, useEffect } from 'react';
import { UserX, UserCheck, Edit3, WalletCards } from 'lucide-react';
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';


const BalanceAdjustmentFormSchema = z.object({
  originalAssetCode: z.custom<CurrencyCode>((val) => typeof val === 'string' && ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'].includes(val), {
    message: "Please select a valid asset for the original transaction.",
  }),
  originalAssetAmount: z.coerce.number().positive("Original asset amount must be a positive number."),
  adjustmentAmountForWallet: z.coerce.number().refine(val => val !== 0, "Wallet adjustment amount cannot be zero."),
  adminNotes: z.string().min(5, "Admin notes must be at least 5 characters long."),
});


interface UserProfileTabsProps {
  user: User;
  wallet: Wallet; // Now a single wallet object
}

const availableAssetCodes: CurrencyCode[] = ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'];

export function UserProfileTabs({ user: initialUser, wallet: initialWallet }: UserProfileTabsProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [user, setUser] = useState<User>(initialUser);
  const [wallet, setWallet] = useState<Wallet>(initialWallet);

  const [selectedTradingPlanId, setSelectedTradingPlanId] = useState<number>(user.trading_plan_id);
  const [isAdjustBalanceDialogOpen, setIsAdjustBalanceDialogOpen] = useState(false);

  const form = useForm<BalanceAdjustmentFormData>({
    resolver: zodResolver(BalanceAdjustmentFormSchema),
    defaultValues: {
      originalAssetCode: 'USD',
      originalAssetAmount: 0,
      adjustmentAmountForWallet: 0,
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
    form.reset(); // Reset form on open
    setIsAdjustBalanceDialogOpen(true);
  };

  const handleBalanceAdjustmentSubmit = (data: BalanceAdjustmentFormData) => {
    startTransition(async () => {
      const result = await adjustUserWalletBalance({
        userId: user.id,
        ...data,
      });

      if (result.success && result.wallet) {
        setWallet(result.wallet);
        toast({ title: "Success", description: result.message });
        setIsAdjustBalanceDialogOpen(false);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Account Balance</CardTitle>
                <CardDescription>User's main account balance in {wallet.currency}.</CardDescription>
              </div>
              <WalletCards className="h-8 w-8 text-accent" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-4xl font-bold text-primary">
                {wallet.balance.toFixed(2)} <span className="text-2xl text-muted-foreground">{wallet.currency}</span>
              </div>
              <Button onClick={openAdjustBalanceDialog} className="w-full sm:w-auto" variant="outline">
                <Edit3 className="mr-2 h-4 w-4" /> Adjust Balance
              </Button>
              <p className="text-xs text-muted-foreground pt-2">
                Wallet ID: {wallet.id} <br/>
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

      <AlertDialog open={isAdjustBalanceDialogOpen} onOpenChange={setIsAdjustBalanceDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Adjust User Account Balance</AlertDialogTitle>
            <AlertDialogDescription>
              Current Balance: <span className="font-semibold">{wallet.balance.toFixed(2)} {wallet.currency}</span>.
              This action logs an adjustment transaction and notifies the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleBalanceAdjustmentSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="originalAssetCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset of External Transaction</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset" />
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
                    <FormLabel>Amount of External Asset</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., 0.5 or 1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adjustmentAmountForWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change to Account Balance (+/- {wallet.currency})</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., +5000 or -100" {...field} />
                    </FormControl>
                    <FormDescription>Enter positive for deposits/credits, negative for withdrawals/debits.</FormDescription>
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
                      <Textarea placeholder="Reason for adjustment, transaction ID, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AlertDialogFooter className="pt-4">
                <AlertDialogCancel onClick={() => setIsAdjustBalanceDialogOpen(false)}>Cancel</AlertDialogCancel>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Applying...' : 'Apply Adjustment'}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
