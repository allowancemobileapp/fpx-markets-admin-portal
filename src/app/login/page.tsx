
// src/app/login/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'; // Updated imports
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Google Icon SVG as a component
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);


export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const userCredential = await signInWithPopup(auth, provider);
      // No admin claim check needed here as per user request
      // Any successful Google Sign-in is sufficient for this portal
      toast({ title: 'Login Successful', description: 'Welcome to the Admin Portal!' });
      router.replace('/dashboard'); // Redirect to dashboard after successful login
    } catch (err: any) {
      console.error("Firebase Google Auth Error:", err);
      let errorMessage = "Failed to sign in with Google. Please try again.";
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-blocked') {
        errorMessage = "Sign-in popup was cancelled or blocked. Please ensure popups are allowed and try again.";
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address."
      }
      setError(errorMessage);
      toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <Link href="/" className="flex items-center justify-center gap-2 mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-primary">
                <path d="M12 2L1 9l4 1.5V15h2V10.5L12 6l5 4.5V15h2v-4.5L23 9l-3.5-2.6L12 2zm0 10.5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            <span className="text-3xl font-bold text-primary">FPX Markets</span>
          </Link>
          <CardTitle className="text-2xl font-semibold">Admin Portal Login</CardTitle>
          <CardDescription>Sign in with your Google account to access the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Button onClick={handleGoogleSignIn} className="w-full" disabled={isLoading}>
              {isLoading ? (
                'Signing In...'
              ) : (
                <>
                  <GoogleIcon className="mr-2 h-5 w-5" /> Sign in with Google
                </>
              )}
            </Button>
            {error && <p className="text-sm text-destructive text-center pt-4">{error}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
