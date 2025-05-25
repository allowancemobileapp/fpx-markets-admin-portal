
// src/contexts/AuthContext.tsx
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface AuthContextType {
  user: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          // Check for admin custom claim
          const userIsAdmin = idTokenResult.claims.admin === true;
          setIsAdmin(userIsAdmin);
          if (!userIsAdmin && window.location.pathname !== '/login') {
            // If not an admin and not on login page, redirect to login.
            // This is a secondary check; primary check should be in AppLayout.
            // console.warn("User is not an admin. Redirecting from AuthProvider.");
            // router.replace('/login');
          }
        } catch (error) {
          console.error("Error getting ID token result or claims:", error);
          setIsAdmin(false);
           if (window.location.pathname !== '/login') {
            // router.replace('/login');
           }
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        // If user is not logged in and not on the login page, redirect.
        // This is also a secondary check.
        // if (window.location.pathname !== '/login') {
        //   router.replace('/login');
        // }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
      router.push('/login'); // Redirect to login after sign out
    } catch (error) {
      console.error("Error signing out:", error);
      // Handle sign-out error (e.g., show a toast)
    } finally {
      setLoading(false);
    }
  };
  
  // Show a global loading indicator if Firebase auth is still resolving
  // This prevents rendering protected content before auth state is known
  if (loading && typeof window !== 'undefined' && window.location.pathname !== '/login') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 p-8 rounded-lg">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <p className="text-muted-foreground">Initializing admin session...</p>
        </div>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
