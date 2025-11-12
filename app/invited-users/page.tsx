"use client";

import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useSentInvitations } from "@/lib/hooks";
import { useAuthCheck } from "@/lib/hooks";
import toast from "react-hot-toast";
import { useEffect } from "react";
import CustomButton from "@/components/common/CustomButton";
import InvitedUsersSkeleton from "@/components/InvitedUsersSkeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function InvitedUsersPage() {
  const { user } = useUser();
  const router = useRouter();
  const { data: authData, isLoading: authLoading } = useAuthCheck();
  const { data: invitations, isLoading: invitationsLoading, error: invitationsError } = useSentInvitations();

  useEffect(() => {
    if (!authLoading && authData) {
      if (!authData.authenticated) {
        toast.error("Please sign in to continue");
        router.push("/signin");
        return;
      }
    }
  }, [authData, authLoading, router]);

  useEffect(() => {
    if (invitationsError) {
      toast.error("Failed to fetch invited users. Please try again.");
    }
  }, [invitationsError]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return { bg: "#fef3c7", text: "#92400e" }; // yellow
      case "ACCEPTED":
        return { bg: "#d1fae5", text: "#065f46" }; // green
      case "EXPIRED":
        return { bg: "#fee2e2", text: "#991b1b" }; // red
      case "REVOKED":
        return { bg: "#f3f4f6", text: "#374151" }; // gray
      default:
        return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (authLoading || invitationsLoading || !user) {
    return <InvitedUsersSkeleton />;
  }

  return (
    <div className="p-14 bg-white h-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-[#2d3e50] text-3xl font-bold mb-2">INVITED USERS</h1>
            <p className="text-gray-600 text-base">
              View all users you have invited to join your audits. Track invitation status and manage your invites.
            </p>
          </div>
          <CustomButton
            variant="primary"
            size="lg"
            onClick={() => router.push("/")}
          >
            Back to Audits
          </CustomButton>
        </div>
      </div>

      {/* Table */}
      {invitations && invitations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-500 text-lg mb-4">No invitations sent yet</p>
          <p className="text-gray-400 text-sm">
            When you invite users to take an audit, they will appear here.
          </p>
        </div>
      ) : (
        <div className="border overflow-hidden rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 border-r text-left text-sm font-semibold text-gray-700 border-b">
                  Email
                </th>
                <th className="px-6 py-4 border-r text-left text-sm font-semibold text-gray-700 border-b">
                  Audit
                </th>
                <th className="px-6 py-4 border-r text-left text-sm font-semibold text-gray-700 border-b">
                  Status
                </th>
                <th className="px-6 py-4 border-r text-left text-sm font-semibold text-gray-700 border-b">
                  Invited Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                  Expires At
                </th>
              </tr>
            </thead>
            <tbody>
              {invitations && invitations.map((invitation) => {
                const statusColor = getStatusColor(invitation.status);
                const expired = isExpired(invitation.expiresAt);
                const displayStatus = expired && invitation.status === "PENDING" ? "EXPIRED" : invitation.status;

                return (
                  <tr
                    key={invitation.id}
                    className="border-b border-[#E0E0E0] hover:bg-gray-50"
                  >
                    <td className="px-6 border-r py-4 text-gray-800">
                      {invitation.email}
                    </td>
                    <td className="px-6 border-r py-4 text-gray-600">
                      {invitation.presentation ? (
                        <span className="font-medium">{invitation.presentation.title}</span>
                      ) : (
                        <span className="text-gray-400 italic">General invitation</span>
                      )}
                    </td>
                    <td className="px-6 border-r py-4">
                      <span
                        className="px-3 py-1 rounded text-sm font-medium"
                        style={{
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                        }}
                      >
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 border-r py-4 text-gray-600">
                      {formatDate(invitation.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className={expired ? "text-red-600" : ""}>
                        {formatDate(invitation.expiresAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

