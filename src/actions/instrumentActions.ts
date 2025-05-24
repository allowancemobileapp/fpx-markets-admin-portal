// src/actions/instrumentActions.ts
'use server';

import type { Instrument } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Mock database
let mockInstrumentsDB = (await import('@/lib/mock-data')).mockInstruments;

const InstrumentSchema = z.object({
  id: z.string().uuid().optional(), // Optional for create
  symbol: z.string().min(1, "Symbol is required"),
  description: z.string().optional().nullable(),
  asset_class: z.string().min(1, "Asset class is required"),
  base_currency: z.string().optional().nullable(), // Should be CurrencyCode enum
  quote_currency: z.string().optional().nullable(), // Should be CurrencyCode enum
  tick_size: z.number().positive("Tick size must be positive"),
  lot_size: z.number().positive("Lot size must be positive"),
  min_order_quantity: z.number().positive("Min order quantity must be positive"),
  max_order_quantity: z.number().positive("Max order quantity must be positive"),
  is_tradable: z.boolean(),
  market_hours: z.string().optional().nullable(), // JSON string
}).refine(data => !data.max_order_quantity || data.max_order_quantity > data.min_order_quantity, {
    message: "Max order quantity must be greater than min order quantity",
    path: ["max_order_quantity"],
});


export async function createInstrument(data: Omit<Instrument, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; instrument?: Instrument }> {
  const validatedFields = InstrumentSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Validation failed: " + validatedFields.error.flatten().fieldErrors };
  }
  
  const newInstrument: Instrument = {
    ...validatedFields.data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockInstrumentsDB.push(newInstrument);
  console.log(`Admin action: Created instrument ${newInstrument.symbol}`);
  revalidatePath('/instruments');
  return { success: true, message: 'Instrument created successfully.', instrument: newInstrument };
}

export async function updateInstrument(id: string, data: Partial<Omit<Instrument, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; message: string; instrument?: Instrument }> {
  const instrumentIndex = mockInstrumentsDB.findIndex(i => i.id === id);
  if (instrumentIndex === -1) {
    return { success: false, message: 'Instrument not found.' };
  }

  const validatedFields = InstrumentSchema.partial().safeParse(data);
   if (!validatedFields.success) {
    return { success: false, message: "Validation failed: " + validatedFields.error.flatten().fieldErrors };
  }

  const updatedInstrument = {
    ...mockInstrumentsDB[instrumentIndex],
    ...validatedFields.data,
    updated_at: new Date().toISOString(),
  };
  mockInstrumentsDB[instrumentIndex] = updatedInstrument;
  console.log(`Admin action: Updated instrument ${updatedInstrument.symbol}`);
  revalidatePath('/instruments');
  return { success: true, message: 'Instrument updated successfully.', instrument: updatedInstrument };
}

export async function deleteInstrument(id: string): Promise<{ success: boolean; message: string }> {
  const initialLength = mockInstrumentsDB.length;
  mockInstrumentsDB = mockInstrumentsDB.filter(i => i.id !== id);
  if (mockInstrumentsDB.length === initialLength) {
    return { success: false, message: 'Instrument not found or could not be deleted.' };
  }
  console.log(`Admin action: Deleted instrument with ID ${id}`);
  revalidatePath('/instruments');
  return { success: true, message: 'Instrument deleted successfully.' };
}

export async function getInstruments(): Promise<Instrument[]> {
    return [...mockInstrumentsDB];
}

export async function getInstrumentById(id: string): Promise<Instrument | undefined> {
    return mockInstrumentsDB.find(i => i.id === id);
}
