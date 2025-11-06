"use client";

import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import notFoundImg from "@/public/notFound.png";
import Image from "next/image";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return <div className="p-14 bg-white h-full">Loading...</div>;
  }

  if (!user) {
    return <div className="p-14 bg-white h-full">Loading...</div>;
  }

  return (
    <div className="p-14 bg-white h-full">
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
      </div>
    </div>
  );
}