'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './config';

const auth = getAuth(app);

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isLoading };
}
