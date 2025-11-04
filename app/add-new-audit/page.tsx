"use client";

import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
 
 
import AddNewAudit from "./AddNewAudit";

export default function AddNewAuditPage() {
  const { user } = useUser();
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
    <div className="">
      <div className="mt-5">
        <AddNewAudit userId={user.id} />
      </div>

    </div>
  );
}


