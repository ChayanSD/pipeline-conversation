'use client';

import { useUser } from '@/contexts/UserContext';

export default function UserGreeting() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-blue-900">
        👋 Hello, <strong>{user.name}</strong>!
      </p>
      <p className="text-sm text-blue-700 mt-1">
        Role: {user.role} • Email: {user.email}
      </p>
    </div>
  );
}
