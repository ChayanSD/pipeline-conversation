'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';

export default function Navbar() {
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      // Force page refresh to clear all state
      window.location.href = '/signin';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout on client side with page refresh
      window.location.href = '/signin';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-800">Pipeline Conversation</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Home Link */}
            <button
              onClick={() => router.push('/')}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Home
            </button>

            {/* Profile Link */}
            <button
              onClick={() => router.push('/profile')}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Profile
            </button>

            {/* Admin Dashboard Link */}
            {user.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin Dashboard
              </button>
            )}

            {/* User Info and Logout */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {user.profileImageUrl ? (
                  <Image
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.profileImageUrl}
                    alt="Profile"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}