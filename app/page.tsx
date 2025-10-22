
'use client';

import { useUser } from '@/contexts/UserContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Manual authentication check
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (!data.authenticated) {
          router.push('/signin');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error(error);
        router.push('/signin');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-600 mb-6">
                Welcome to Pipeline Conversation - your quiz application platform.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Take Tests</h3>
                  <p className="text-blue-700">Participate in various quizzes and assessments.</p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-green-900 mb-2">View Results</h3>
                  <p className="text-green-700">Check your test scores and performance analytics.</p>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-purple-900 mb-2">Profile</h3>
                  <p className="text-purple-700">Manage your account and view your information.</p>
                </div>
              </div>

              {user.role === 'ADMIN' && (
                <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-yellow-900 mb-2">Admin Access</h3>
                  <p className="text-yellow-700 mb-4">
                    You have administrative privileges. Access the dashboard to manage users, tests, and categories.
                  </p>
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white px-4 py-2 rounded"
                  >
                    Go to Admin Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
