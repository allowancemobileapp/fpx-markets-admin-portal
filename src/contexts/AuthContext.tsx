
// src/contexts/AuthContext.tsx
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
// Skeleton import is no longer needed here if AuthProvider doesn't render it directly.
// import { Skeleton } from '@/components/ui/skeleton'; 

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
  const [loading, setLoading] = useState<boolean>(true); // This loading state is crucial for consumers
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
        } catch (error) {
          console.error("Error getting ID token result or claims:", error);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]); // router might be needed if redirects within onAuthStateChanged happen based on it, though not currently the case.

  const signOut = async () => {
    setLoading(true); // Indicate an auth operation is in progress
    try {
      await firebaseSignOut(auth);
      setUser(null); // These will trigger onAuthStateChanged anyway, but good for immediate UI
      setIsAdmin(false);
      router.push('/login'); // Redirect to login after sign out
    } catch (error) {
      console.error("Error signing out:", error);
      // Handle sign-out error (e.g., show a toast)
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false after sign out completes.
                         // If we set it here, there might be a flash if onAuthStateChanged is slightly delayed.
                         // However, for immediate feedback on logout action, one might set it here.
                         // Let's keep it as is, relying on onAuthStateChanged.
    }
  };
  
  // AuthProvider now consistently renders its children.
  // The loading state it provides via context will be used by AppLayout or other
  // components to show appropriate loading UIs or skeletons.
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
