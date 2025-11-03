"use client";

import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import notFoundImg from "@/public/notFound.png";
import Image from "next/image";
import { presentationApi } from "@/lib/api";
import { Presentation } from "@/lib/types";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [presentationsLoading, setPresentationsLoading] = useState(false);

  useEffect(() => {
    // Manual authentication check
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();

        if (!data.authenticated) {
          router.push("/signin");
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error(error);
        router.push("/signin");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchPresentations = async () => {
      if (!user) return;

      setPresentationsLoading(true);
      try {
        const data = await presentationApi.getAll();
        setPresentations(data);
      } catch (error) {
        console.error("Error fetching presentations:", error);
      } finally {
        setPresentationsLoading(false);
      }
    };

    fetchPresentations();
  }, [user]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  const getLatestTestScore = (presentation: Presentation): number | null => {
    if (presentation.tests.length === 0) return null;
    const latestTest = presentation.tests.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    return latestTest.totalScore;
  };

  const handleDelete = async (presentationId: string) => {
    if (!confirm("Are you sure you want to delete this audit?")) return;

    try {
      await presentationApi.delete(presentationId);
      setPresentations(prev => prev.filter(p => p.id !== presentationId));
    } catch (error) {
      console.error("Error deleting presentation:", error);
      alert("Failed to delete audit");
    }
  };

  const handleStartAudit = (presentationId: string) => {
    router.push(`/test/questions/${presentationId}`);
  };

  const handleEdit = (presentationId: string) => {
    router.push(`/add-new-audit/?edit=${presentationId}`);
  };

  return (
    <div className="p-14 bg-transparent">
      <div className="">
        <h1 className="text-gray-900 mb-2 font-normal" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.6875rem)' }}>
          Hello, {user.name}!
        </h1>

        {presentations.length === 0 && !presentationsLoading ? (
          <div className="flex justify-center items-center h-[80vh]">
            <div className="flex flex-col justify-center items-center">
              <Image
                src={notFoundImg}
                alt="Logo"
                width={380}
                height={266}
                style={{
                  width: 'clamp(200px, 25vw, 380px)',
                  height: 'clamp(140px, 18vw, 266px)',
                  objectFit: 'contain'
                }}
              />
              <p className="text-[#2D2D2D] mb-2 font-normal" style={{ fontSize: 'clamp(.5rem, 6vw, 2.5rem)' }}>
                NO AUDIT CREATED
              </p>
              <p className="text-[#2D2D2D] mb-2 font-normal" style={{ fontSize: 'clamp(1rem, 4vw, 1.625rem)' }}>
                Start your first audit to see your performance insights here.
              </p>
              <button
                onClick={() => router.push("/add-new-audit/?category=1")}
                className="w-[318px] mt-4 h-[50px] text-black font-medium transition-colors font-acumin cursor-pointer rounded-full"
                style={{
                  padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  backgroundColor: '#F7AF41'
                }}
              >
                Start New Audit
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Audits</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Audit Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creation Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Audit Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {presentationsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          Loading audits...
                        </td>
                      </tr>
                    ) : (
                      presentations.map((presentation) => (
                        <tr key={presentation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {presentation.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(presentation.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getLatestTestScore(presentation) !== null
                              ? `${getLatestTestScore(presentation)}%`
                              : "Not taken"
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(presentation.id)}
                                className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded-md text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(presentation.id)}
                                className="text-red-600 hover:text-red-900 px-3 py-1 rounded-md text-sm font-medium"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => handleStartAudit(presentation.id)}
                                className="text-green-600 hover:text-green-900 px-3 py-1 rounded-md text-sm font-medium"
                              >
                                Start Audit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {user.role === "ADMIN" && (
        <div 
          className="bg-linear-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
          style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}
        >
          <div className="flex items-start">
            <div 
              className="bg-yellow-100 rounded-lg mr-4"
              style={{ 
                padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                marginRight: 'clamp(0.75rem, 2vw, 1rem)'
              }}
            >
              <svg
                className="text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ width: 'clamp(1.25rem, 3vw, 1.5rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2 font-acumin" style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)' }}>
                Admin Access
              </h3>
              <p className="text-yellow-800 mb-4 font-acumin" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>
                You have administrative privileges. Access the dashboard to
                manage users, tests, and categories.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-md font-medium transition-colors font-acumin"
                style={{
                  padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                }}
              >
                Go to Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
