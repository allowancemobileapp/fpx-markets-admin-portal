
// src/components/users/add-user-form.tsx
'use client';

import type { TradingPlan, CreateUserInput } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createUser } from '@/actions/userActions'; 
import { useState, useTransition } from 'react';

// Schema for client-side validation, identical to the server-side one.
const AddUserFormSchema = z.object({
  firebase_auth_uid: z.string().min(1, "Firebase Auth UID is required."),
  username: z.string().min(3, "Username must be at least 3 characters.").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  email: z.string().email("Invalid email address."),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  country_code: z.string().length(2, "Country code must be 2 characters.").optional().nullable(),
  trading_plan_id: z.coerce.number().int().positive("Trading plan must be selected."),
});


type AddUserFormData = z.infer<typeof AddUserFormSchema>;

interface AddUserFormProps {
  tradingPlans: TradingPlan[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormSubmit: () => void; // Callback to refresh table or parent state
}

export function AddUserForm({ tradingPlans, open, onOpenChange, onFormSubmit }: AddUserFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddUserFormData>({
    resolver: zodResolver(AddUserFormSchema),
    defaultValues: {
      firebase_auth_uid: '',
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      country_code: '',
      trading_plan_id: undefined, // Or a default plan ID if applicable
    },
  });

  const onSubmit = (data: AddUserFormData) => {
    startTransition(async () => {
      // Ensure trading_plan_id is a number
      const userData: CreateUserInput = {
        ...data,
        trading_plan_id: Number(data.trading_plan_id),
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        phone_number: data.phone_number || null,
        country_code: data.country_code || null,
      };

      const result = await createUser(userData);

      if (result.success) {
        toast({ title: 'Success', description: result.message });
        onFormSubmit(); 
        onOpenChange(false); 
        form.reset();
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) form.reset(); // Reset form if dialog is closed
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Enter the details for the new user. A default wallet will be created.
            Note: The Firebase Auth UID must correspond to an existing Firebase Authentication user or be planned for future linking.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-1">
            <FormField control={form.control} name="firebase_auth_uid" render={({ field }) => (
              <FormItem>
                <FormLabel>Firebase Auth UID</FormLabel>
                <FormControl><Input placeholder="Enter Firebase Auth User ID" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl><Input placeholder="e.g., newuser123" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input type="email" placeholder="user@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="first_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name (Optional)</FormLabel>
                  <FormControl><Input placeholder="John" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="last_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name (Optional)</FormLabel>
                  <FormControl><Input placeholder="Doe" {...field} value={field.value || ''}/></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone_number" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl><Input placeholder="+1234567890" {...field} value={field.value || ''}/></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="country_code" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Country Code (Optional, 2 letters)</FormLabel>
                    <FormControl><Input placeholder="US" {...field} maxLength={2} value={field.value || ''} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
            </div>
            
            <FormField control={form.control} name="trading_plan_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Trading Plan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a trading plan" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {tradingPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormDescription className="text-xs">
                User will be set to 'Active' and 'Email Not Verified' by default. These can be changed later from the user's profile.
            </FormDescription>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating User...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
