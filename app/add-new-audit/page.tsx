"use client";

import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import notFoundImg from "@/public/notFound.png";
import Image from "next/image";

export default function AddNewAuditPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-14 bg-transparent">
      <div className="">
        <h1 className="text-gray-900 mb-2 font-normal" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.6875rem)' }}>
          Hellow, {user.name}!
        </h1>
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
              START A NEW AUDIT
            </p>
            <p className="text-[#2D2D2D] mb-2 font-normal" style={{ fontSize: 'clamp(1rem, 4vw, 1.625rem)' }}>
              Choose a category from the sidebar to begin your audit.
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-[318px] mt-4 h-[42px] text-black font-medium transition-colors font-acumin cursor-pointer rounded-full"
              style={{
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                backgroundColor: theme.secondary
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
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
                onClick={() => (window.location.href = "/dashboard")}
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


