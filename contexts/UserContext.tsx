'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { SessionUser } from '@/lib/session';

interface UserContextType {
  user: SessionUser | null;
  isInvitedUser: boolean;
  setIsInvitedUser: (value: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: SessionUser | null;
}) {
  const deriveInvitedFromUser = Boolean(
    user?.companyRole &&
      user.companyRole.toLowerCase() === 'invited'
  );
  const [isInvitedUser, setIsInvitedUserState] = useState(deriveInvitedFromUser);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem('isInvitedUser');
    if (stored !== null) {
      setIsInvitedUserState(stored === 'true');
    } else {
      sessionStorage.setItem('isInvitedUser', deriveInvitedFromUser ? 'true' : 'false');
      setIsInvitedUserState(deriveInvitedFromUser);
    }
  }, [user, deriveInvitedFromUser]);

  const setIsInvitedUser = useCallback((value: boolean) => {
    setIsInvitedUserState(value);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('isInvitedUser', value ? 'true' : 'false');
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, isInvitedUser, setIsInvitedUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}