"use client";

import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "react-loading-skeleton/dist/skeleton.css";
import toast from "react-hot-toast";
import AddNewAudit from "./components/AddNewAudit";
import TableSkeleton from "./components/tableSkeleton";

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
      <div className="">
        <AddNewAudit />
      </div>
    </div>
  );
}


