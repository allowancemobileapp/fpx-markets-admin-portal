// src/components/instruments/instrument-form.tsx
'use client';

import type { Instrument, CurrencyCode } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { createInstrument, updateInstrument } from '@/actions/instrumentActions';
import { useState, useTransition } from 'react';

const InstrumentFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  description: z.string().optional().nullable(),
  asset_class: z.string().min(1, "Asset class is required (e.g., CRYPTO, STOCK, FOREX)"),
  base_currency: z.string().optional().nullable(),
  quote_currency: z.string().optional().nullable(),
  tick_size: z.coerce.number().positive("Tick size must be a positive number"),
  lot_size: z.coerce.number().positive("Lot size must be a positive number"),
  min_order_quantity: z.coerce.number().positive("Min order quantity must be positive"),
  max_order_quantity: z.coerce.number().positive("Max order quantity must be positive"),
  is_tradable: z.boolean().default(true),
  market_hours: z.string().refine((val) => {
    if (!val || val.trim() === "") return true; // Optional
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Market hours must be valid JSON or empty" }).optional().nullable(),
}).refine(data => !data.max_order_quantity || data.max_order_quantity > data.min_order_quantity, {
    message: "Max order quantity must be greater than min order quantity",
    path: ["max_order_quantity"],
});

type InstrumentFormData = z.infer<typeof InstrumentFormSchema>;

interface InstrumentFormProps {
  instrument?: Instrument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormSubmit: () => void; // Callback to refresh table
}

const currencyCodes: CurrencyCode[] = ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'];

export function InstrumentForm({ instrument, open, onOpenChange, onFormSubmit }: InstrumentFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<InstrumentFormData>({
    resolver: zodResolver(InstrumentFormSchema),
    defaultValues: instrument ? {
      ...instrument,
      tick_size: instrument.tick_size || 0,
      lot_size: instrument.lot_size || 0,
      min_order_quantity: instrument.min_order_quantity || 0,
      max_order_quantity: instrument.max_order_quantity || 0,
      market_hours: typeof instrument.market_hours === 'string' ? instrument.market_hours : JSON.stringify(instrument.market_hours || {}),
    } : {
      symbol: '',
      description: '',
      asset_class: '',
      base_currency: '',
      quote_currency: '',
      tick_size: 0.01,
      lot_size: 1,
      min_order_quantity: 0.01,
      max_order_quantity: 100,
      is_tradable: true,
      market_hours: '',
    },
  });

  const onSubmit = (data: InstrumentFormData) => {
    startTransition(async () => {
      const action = instrument ? updateInstrument : createInstrument;
      const result = instrument 
        ? await action(instrument.id, data as Partial<Instrument>) 
        : await action(data as Omit<Instrument, 'id' | 'created_at' | 'updated_at'>);

      if (result.success) {
        toast({ title: 'Success', description: result.message });
        onFormSubmit(); // Refresh table
        onOpenChange(false); // Close dialog
        form.reset();
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{instrument ? 'Edit Instrument' : 'Create New Instrument'}</DialogTitle>
          <DialogDescription>
            {instrument ? `Modify details for ${instrument.symbol}.` : 'Fill in the details for the new tradable instrument.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="symbol" render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl><Input placeholder="e.g., BTC/USD" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="asset_class" render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Class</FormLabel>
                  <FormControl><Input placeholder="e.g., CRYPTO, STOCK" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="e.g., Bitcoin vs US Dollar" {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="base_currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select base currency" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {currencyCodes.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="quote_currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote Currency</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select quote currency" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {currencyCodes.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="tick_size" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tick Size</FormLabel>
                  <FormControl><Input type="number" step="any" placeholder="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lot_size" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lot Size</FormLabel>
                  <FormControl><Input type="number" step="any" placeholder="0.00001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="min_order_quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Order Quantity</FormLabel>
                  <FormControl><Input type="number" step="any" placeholder="0.0001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="max_order_quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Order Quantity</FormLabel>
                  <FormControl><Input type="number" step="any" placeholder="100" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <FormField control={form.control} name="market_hours" render={({ field }) => (
              <FormItem>
                <FormLabel>Market Hours (JSON)</FormLabel>
                <FormControl><Textarea placeholder='e.g., {"0": "24/7"} or {"1": "09:30-16:00 ET", "2": "09:30-16:00 ET"}' {...field} value={field.value || ''} rows={3} /></FormControl>
                <FormDescription>Enter as a valid JSON string or leave empty.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormField control={form.control} name="is_tradable" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Is Tradable?</FormLabel>
                  <FormDescription>Allow users to trade this instrument.</FormDescription>
                </div>
              </FormItem>
            )} />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? (instrument ? 'Saving...' : 'Creating...') : (instrument ? 'Save Changes' : 'Create Instrument')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
