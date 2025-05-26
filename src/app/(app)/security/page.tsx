
// src/app/(app)/security/page.tsx
'use client';

import { useState, useEffect, useTransition, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setAdminPin, getAdminPinStatus, verifyAdminPin } from '@/actions/adminActions';

// IMPORTANT SECURITY WARNING:
// The PIN is currently stored and handled in PLAIN TEXT by the backend actions.
// This is NOT SECURE for a production environment.
// PINs MUST be hashed before storage in a real application.

export default function SecurityPage() {
  const { user } = useAuth(); // Admin user from Firebase Auth
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [isPinSet, setIsPinSet] = useState<boolean | null>(null);
  const [currentPin, setCurrentPin] = useState('');
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
          setIsPinSet(false);
        } else {
          setIsPinSet(status.isPinSet);
          setMode(status.isPinSet ? 'change' : 'setup');
        }
      });
    }
  };

  useEffect(() => {
    if (user?.uid && isPinSet === null) {
      fetchPinStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, isPinSet]);

  const handleSetOrChangePin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!user?.uid) {
      setError('User not authenticated.');
      return;
    }

    // Validate Current PIN if in 'change' mode
    if (isPinSet && mode === 'change') {
      if (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin)) {
        setError('Current PIN must be exactly 4 digits.');
        return;
      }
      // Verify current PIN first
      const verificationResult = await verifyAdminPin(user.uid, currentPin);
      if (!verificationResult.success) {
        setError(verificationResult.message || 'Incorrect current PIN.');
        setCurrentPin(''); // Clear current PIN input on error
        return;
      }
      // Current PIN is correct, proceed to new PIN validation
    }

    // Validate New PIN and Confirm New PIN (applies to all modes: setup, change, reset)
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
        setCurrentPin(''); // Clear current PIN as well
        setMode('change'); // Default to change mode after any successful set/reset
      } else {
        toast({ title: 'Error Setting PIN', description: result.message, variant: 'destructive' });
        setError(result.message);
      }
    });
  };

  if (isPinSet === null || (isPending && isPinSet === null)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Security" icon={ShieldCheck} description="Manage your Admin Portal PIN." />
        <p>Loading PIN status...</p>
      </div>
    );
  }

  const getTitle = () => {
    if (mode === 'reset') return 'Reset Your Admin PIN';
    if (isPinSet) return 'Change Your Admin PIN';
    return 'Set Up Your Admin PIN';
  };

  const getDescription = () => {
    if (mode === 'reset') return 'Enter a new 4-digit PIN. Your Firebase authentication serves as verification for reset.';
    if (isPinSet) return 'Enter your current PIN, then set a new 4-digit PIN.';
    return 'Create a 4-digit PIN for authorizing sensitive actions.';
  };

  const getButtonText = () => {
    if (isPending) {
      if (mode === 'reset') return 'Resetting PIN...';
      return isPinSet ? 'Changing PIN...' : 'Setting PIN...';
    }
    if (mode === 'reset') return 'Confirm New PIN for Reset';
    return isPinSet ? 'Change PIN' : 'Set PIN';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Security" icon={ShieldCheck} description="Manage your Admin Portal PIN." />

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetOrChangePin} className="space-y-4">
            {isPinSet && mode === 'change' && (
              <div>
                <Label htmlFor="currentPin">Current PIN</Label>
                <Input
                  id="currentPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter current 4-digit PIN"
                  className="text-center tracking-[0.3em]"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="newPin">{isPinSet && mode !== 'reset' ? 'New PIN' : 'PIN'}</Label>
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
              <Label htmlFor="confirmNewPin">{isPinSet && mode !== 'reset' ? 'Confirm New PIN' : 'Confirm PIN'}</Label>
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
              {getButtonText()}
            </Button>
          </form>
          {isPinSet && mode !== 'reset' && (
            <Button variant="link" onClick={() => { setMode('reset'); setError(''); setNewPin(''); setConfirmNewPin(''); setCurrentPin(''); }} className="mt-4 text-sm">
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
