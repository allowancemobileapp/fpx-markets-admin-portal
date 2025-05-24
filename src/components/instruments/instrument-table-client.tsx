// src/components/instruments/instrument-table-client.tsx
'use client';

import * as React from 'react';
import { PlusCircle, Edit, Trash2, MoreVertical, Search, CheckCircle, XCircle, Settings } from 'lucide-react';
import type { Instrument } from '@/lib/types';
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
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { deleteInstrument, getInstruments } from '@/actions/instrumentActions';
import { useToast } from '@/hooks/use-toast';
import { InstrumentForm } from './instrument-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface InstrumentTableClientProps {
  initialInstruments: Instrument[];
}

export function InstrumentTableClient({ initialInstruments }: InstrumentTableClientProps) {
  const [instruments, setInstruments] = React.useState<Instrument[]>(initialInstruments);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingInstrument, setEditingInstrument] = React.useState<Instrument | null>(null);
  const [deletingInstrument, setDeletingInstrument] = React.useState<Instrument | null>(null);
  
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const fetchInstruments = async () => {
    const fetchedInstruments = await getInstruments();
    setInstruments(fetchedInstruments);
  };

  React.useEffect(() => {
    fetchInstruments();
  }, []);

  const handleFormSubmit = () => {
    fetchInstruments(); // Refetch instruments after form submission
  };

  const openCreateForm = () => {
    setEditingInstrument(null);
    setIsFormOpen(true);
  };

  const openEditForm = (instrument: Instrument) => {
    setEditingInstrument(instrument);
    setIsFormOpen(true);
  };

  const confirmDelete = (instrument: Instrument) => {
    setDeletingInstrument(instrument);
  };

  const handleDelete = () => {
    if (!deletingInstrument) return;
    startTransition(async () => {
      const result = await deleteInstrument(deletingInstrument.id);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        fetchInstruments(); // Refetch
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
      setDeletingInstrument(null);
    });
  };

  const filteredInstruments = React.useMemo(() => {
    return instruments.filter(instrument =>
      instrument.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instrument.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instrument.asset_class.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [instruments, searchTerm]);


  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search instruments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
        </div>
        <Button onClick={openCreateForm} className="ml-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Instrument
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Asset Class</TableHead>
                  <TableHead>Tradable</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstruments.length > 0 ? filteredInstruments.map((instrument) => (
                  <TableRow key={instrument.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{instrument.symbol}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{instrument.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{instrument.asset_class}</Badge>
                    </TableCell>
                    <TableCell>
                      {instrument.is_tradable ? 
                        <CheckCircle className="h-5 w-5 text-green-500" /> : 
                        <XCircle className="h-5 w-5 text-red-500" />}
                    </TableCell>
                    <TableCell>{format(new Date(instrument.updated_at), 'PPpp')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                            <span className="sr-only">Instrument Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditForm(instrument)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => confirmDelete(instrument)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No instruments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Showing {filteredInstruments.length} of {instruments.length} instruments.</p>
            {/* Pagination can be added here */}
        </div>
        </CardContent>
      </Card>

      <InstrumentForm
        instrument={editingInstrument}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFormSubmit={handleFormSubmit}
      />

      <AlertDialog open={!!deletingInstrument} onOpenChange={() => setDeletingInstrument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this instrument?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the instrument "{deletingInstrument?.symbol}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingInstrument(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
