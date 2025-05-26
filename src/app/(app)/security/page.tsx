
// src/app/(app)/security/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setAdminPin, getAdminPinStatus } from '@/actions/adminActions';

// IMPORTANT SECURITY WARNING:
// The PIN is currently stored and handled in PLAIN TEXT by the backend actions.
// This is NOT SECURE for a production environment.
// PINs MUST be hashed before storage in a real application.

export default function SecurityPage() {
  const { user } = useAuth(); // Admin user from Firebase Auth
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [isPinSet, setIsPinSet] = useState<boolean | null>(null);
  const [currentPin, setCurrentPin] = useState(''); // For changing PIN (though not fully implemented for verification)
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'setup' | 'change' | 'reset'>('setup'); // 'setup', 'change', 'reset'

  const fetchPinStatus = async () => {
    if (user?.uid) {
      startTransition(async () => {
        const status = await getAdminPinStatus(user.uid);
        if (status.error) {
          toast({ title: 'Error Fetching PIN Status', description: status.error, variant: 'destructive' });
          setIsPinSet(false); // Default to false on error
        } else {
          setIsPinSet(status.isPinSet);
          if (status.isPinSet) {
            setMode('change'); // If PIN is set, default to change mode
          } else {
            setMode('setup');
          }
        }
      });
    }
  };

  useEffect(() => {
    // Only fetch if user is available and status is not yet determined
    if (user?.uid && isPinSet === null) {
      fetchPinStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, isPinSet]); // isPinSet added to re-evaluate if it becomes null

  const handleSetOrChangePin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!user?.uid) {
      setError('User not authenticated.');
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setError('New PINs do not match.');
      return;
    }

    startTransition(async () => {
      const result = await setAdminPin(user.uid, newPin);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setIsPinSet(true);
        setNewPin('');
        setConfirmNewPin('');
        setCurrentPin('');
        setMode('change');
      } else {
        toast({ title: 'Error Setting PIN', description: result.message, variant: 'destructive' });
        setError(result.message);
      }
    });
  };
  
  if (isPinSet === null && !isPending && user?.uid) {
      // If status is still null, not pending, and user is loaded, trigger fetch
      // This can happen if the initial useEffect didn't run due to timing
      fetchPinStatus();
  }


  if (isPinSet === null || (isPending && isPinSet === null)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Security" icon={ShieldCheck} description="Manage your Admin Portal PIN." />
        <p>Loading PIN status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Security" icon={ShieldCheck} description="Manage your Admin Portal PIN." />

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>
            {isPinSet && mode !== 'reset' ? 'Change Your Admin PIN' : 'Set Up Your Admin PIN'}
            {isPinSet && mode === 'reset' && 'Reset Your Admin PIN'}
          </CardTitle>
          <CardDescription>
            {isPinSet && mode !== 'reset' ? 'Enter a new 4-digit PIN. Your current PIN is not required to change it in this version.' : 'Create a 4-digit PIN for authorizing sensitive actions.'}
            {isPinSet && mode === 'reset' && 'Enter a new 4-digit PIN. Your Firebase authentication serves as verification for reset.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetOrChangePin} className="space-y-4">
            {isPinSet && mode === 'change' && (
              <div>
                <Label htmlFor="currentPin">Current PIN (Not Required for Change)</Label>
                <Input
                  id="currentPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Current PIN (optional)"
                  className="text-center tracking-[0.3em]"
                  disabled // True PIN change not implemented, setAdminPin just overwrites
                />
                <p className="text-xs text-muted-foreground mt-1">Note: True PIN change (verifying current PIN before update) is not implemented. This form currently resets/overwrites the PIN.</p>
              </div>
            )}

            <div>
              <Label htmlFor="newPin">New PIN</Label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit PIN"
                className="text-center tracking-[0.3em]"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmNewPin">Confirm New PIN</Label>
              <Input
                id="confirmNewPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm 4-digit PIN"
                className="text-center tracking-[0.3em]"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-destructive-foreground bg-destructive/20 p-2 rounded-md">
              <strong>Security Warning:</strong> PINs are currently stored in plain text. This is for demonstration only and is NOT secure for production.
            </p>

            <Button type="submit" disabled={isPending} className="w-full">
              <KeyRound className="mr-2 h-4 w-4" />
              {isPending ? 'Processing...' : (isPinSet && mode !== 'reset' ? 'Change PIN' : 'Set PIN')}
              {isPending && mode === 'reset' && 'Resetting PIN...'}
              {!isPending && mode === 'reset' && 'Confirm New PIN for Reset'}
            </Button>
          </form>
           {isPinSet && mode !== 'reset' && (
            <Button variant="link" onClick={() => { setMode('reset'); setError(''); setNewPin(''); setConfirmNewPin(''); }} className="mt-4 text-sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Forgot your PIN? Reset it.
            </Button>
          )}
          {mode === 'reset' && (
             <Button variant="link" onClick={() => { setMode(isPinSet ? 'change' : 'setup'); setError(''); }} className="mt-2 text-sm">
              Cancel Reset
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
