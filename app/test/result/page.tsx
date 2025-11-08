"use client";

import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import TestResult from "./components/TestResult";
import TableSkeleton from "../../add-new-audit/components/tableSkeleton";

export default function TestResultPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();

        if (!data.authenticated) {
          toast.error("Please sign in to continue");
          router.push("/signin");
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Authentication failed. Please sign in again");
        router.push("/signin");
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading || !user) {
    return (
      <TableSkeleton />
    );
  }

  return (
    <div className="">
      <TestResult />
    </div>
  );
}

