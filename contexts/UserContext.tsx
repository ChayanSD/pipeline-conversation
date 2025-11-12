'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
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
  const [isInvitedUser, setIsInvitedUser] = useState(false);

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