"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export interface AlchemeUserProfile {
  displayName: string | null;
  photoURL: string | null;
  bio: string | null;
  personalColor: string | null;
  skinType: string | null;
  skinTone: string | null;
  hairType: string | null;
  bodyType: string | null;
  faceType: string | null;
  occupation: string | null;
  interests: string[];
  favoriteBrands: string[];
  agentTheme: string;
}

interface AuthContextType {
  user: User | null;
  profile: AlchemeUserProfile | null;
  loading: boolean;
}

const DEFAULT_PROFILE: AlchemeUserProfile = {
  displayName: null,
  photoURL: null,
  bio: null,
  personalColor: null,
  skinType: null,
  skinTone: null,
  hairType: null,
  bodyType: null,
  faceType: null,
  occupation: null,
  interests: [],
  favoriteBrands: [],
  agentTheme: "maid",
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AlchemeUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          const idToken = await user.getIdToken();
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          // Fetch profile via server-side API (uses admin SDK, avoids client-side Firestore)
          const res = await fetch('/api/users/me');
          if (res.ok) {
            const { profile: userData } = await res.json();
            if (userData) {
              setProfile({
                ...DEFAULT_PROFILE,
                ...userData,
                displayName: userData.displayName ?? user.displayName ?? null,
              });
            } else {
              setProfile({
                ...DEFAULT_PROFILE,
                displayName: user.displayName ?? null,
              });
            }
          } else {
            setProfile({
              ...DEFAULT_PROFILE,
              displayName: user.displayName ?? null,
            });
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setProfile(null);
        }
      } else {
        await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
