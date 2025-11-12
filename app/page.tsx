"use client";

import { useUser } from "@/contexts/UserContext";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import notFoundImg from "@/public/notFound2.png";
import Image from "next/image";
import { useAuthCheck, useAudits, useDeleteAudit, useSendAuditInvite } from "@/lib/hooks";
import { Presentation } from "@/lib/types";
import { Edit, Trash2, Play, Mail } from "lucide-react";
import toast from "react-hot-toast";
import "react-loading-skeleton/dist/skeleton.css";
import HomeSkeleton from "@/components/HomeSkeleton";
import CustomButton from "@/components/common/CustomButton";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import InviteAuditModal from "@/components/InviteAuditModal";

interface AuditWithScore extends Presentation {
  latestScore?: number;
}

export default function Home() {
  const { user, isInvitedUser, setIsInvitedUser } = useUser();
  const router = useRouter();
  const { data: authData, isLoading: authLoading } = useAuthCheck();
  const { data: auditsData, isLoading: auditsLoading, error: auditsError } = useAudits();
  const deleteAuditMutation = useDeleteAudit();
  const sendInviteMutation = useSendAuditInvite();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [auditToInvite, setAuditToInvite] = useState<{ id: string; title: string } | null>(null);

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
    if (auditsError) {
      toast.error("Failed to fetch audits. Please try again.");
    }
  }, [auditsError]);

  // Extract isInvitedUser flag from audits response
  useEffect(() => {
    if (!auditsData) return;
    
    const responseData = auditsData as { data?: Presentation[]; isInvitedUser?: boolean } | Presentation[];
    
    if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'isInvitedUser' in responseData) {
      setIsInvitedUser(responseData.isInvitedUser || false);
    }
  }, [auditsData, setIsInvitedUser]);

  // Process audits to include latest score
  const audits = useMemo<AuditWithScore[]>(() => {
    if (!auditsData) return [];
    
    const responseData = auditsData as { data?: Presentation[]; isInvitedUser?: boolean } | Presentation[];
    const auditsList = Array.isArray(responseData) 
      ? responseData 
      : responseData?.data || [];
    
    return auditsList.map((audit: Presentation & { tests?: Array<{ totalScore: number }> }) => ({
      ...audit,
      latestScore: audit.tests && audit.tests.length > 0 ? audit.tests[0].totalScore : undefined,
    }));
  }, [auditsData]);

  const isLoading = authLoading || !user;
  const loadingAudits = auditsLoading;

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
  };

  const getScoreColor = (score?: number) => {
    if (!score) return { bg: '#f3f4f6', text: '#6b7280' };
    if (score < 30) return { bg: '#fee2e2', text: '#dc2626' }; // red
    if (score < 40) return { bg: '#fed7aa', text: '#ea580c' }; // orange
    return { bg: '#d1fae5', text: '#16a34a' }; // green
  };

  const handleDeleteClick = (id: string) => {
    setAuditToDelete(id);
    setDeleteModalOpen(true);
  };

  const clearAuditSessionStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      // Clear full sessionStorage
      sessionStorage.clear();
      
      // Dispatch event to update sidebar
      window.dispatchEvent(new Event('categoryNameUpdated'));
    } catch (error) {
      console.error("Error clearing sessionStorage:", error);
    }
  };

  // Clear sessionStorage when component mounts (user lands on home page)
  useEffect(() => {
    clearAuditSessionStorage();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!auditToDelete) return;
    
    try {
      await deleteAuditMutation.mutateAsync(auditToDelete);
      toast.success("Audit deleted successfully");
      setDeleteModalOpen(false);
      setAuditToDelete(null);
    } catch (error) {
      console.error("Error deleting audit:", error);
      toast.error("Failed to delete audit. Please try again.");
    }
  };

  const handleInviteClick = (audit: AuditWithScore) => {
    setAuditToInvite({ id: audit.id, title: audit.title });
    setInviteModalOpen(true);
  };

  const handleInvite = async (email: string) => {
    if (!auditToInvite) return;
    
    try {
      await sendInviteMutation.mutateAsync({
        email,
        presentationId: auditToInvite.id,
      });
      toast.success("Invitation sent successfully!");
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || "Failed to send invitation";
      toast.error(errorMessage);
      throw error;
    }
  };

  if (isLoading || loadingAudits || !user) {
    return (
     <HomeSkeleton />
    );
  }

  // Empty state - no audits
  if (audits.length === 0) {
    return (
      <div className="p-14 bg-white h-full">
        <div className="">
          <h1 className="text-gray-900 mb-2 font-normal" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.6875rem)' }}>
            Hello, {user.name}!
          </h1>
          <div className="flex justify-center items-center h-[80vh]">
            <div className="flex flex-col justify-center items-center ">
              <Image 
                src={notFoundImg} 
                alt="Logo" 
                width={380} 
                height={266} 
                style={{
                  width: 'clamp(200px, 28vw, 480px)',
                  height: 'clamp(140px, 20vw, 366px)',
                  objectFit: 'contain'
                }}
              />
              <p className="text-[#2D2D2D] mb-2 font-normal" style={{ fontSize: 'clamp(.5rem, 4vw, 2rem)' }}>
                NO AUDIT CREATED
              </p>
              <p className="text-[#2D2D2D] mb-2 font-normal" style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}>
                {isInvitedUser 
                  ? "You have been invited to take an audit. Please wait for the audit to be shared with you."
                  : "Start your first audit to see your performance insights here."
                }
              </p>
              {!isInvitedUser && (
                <CustomButton
                  variant="primary"
                  size="lg"
                  style={{
                    width: '318px',
                    height: '50px',
                    padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                  }}
                  onClick={() => {
                    clearAuditSessionStorage();
                    router.push("/add-new-audit/?category=1");
                  }}
                >
                  Start New Audit
                </CustomButton>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Table view - audits exist
  return (
    <div className="p-14 bg-white h-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-[#2d3e50] text-3xl font-bold mb-2">ALL AUDIT AUDITS</h1>
            <p className="text-gray-600 text-base">
              Track and compare all your AUDIT audit reports in one place. View scores, dates, and improvement insights instantly.
            </p>
          </div>
          <div className="flex gap-3">
            {!isInvitedUser && (
              <CustomButton
                variant="primary"
                size="lg"
                onClick={() => {
                  clearAuditSessionStorage();
                  router.push("/add-new-audit/?category=1");
                }}
              >
                Create New AUDIT
              </CustomButton>
            )}
           
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 border-r text-left text-sm font-semibold text-gray-700 border-b">AUDIT Name</th>
              <th className="px-6 py-4 border-r text-left text-sm font-semibold text-gray-700 border-b">Creation Date</th>
             {/* <th className="px-6 py-4 border-r text-left text-sm font-semibold text-gray-700 border-b">Audit Score</th> */}
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((audit) => {
              const scoreColor = getScoreColor(audit.latestScore);
              return (
                <tr key={audit.id} className="border-b border-[#E0E0E0] hover:bg-gray-50">
                  <td className="px-6 border-r py-4 text-gray-800">{audit.title}</td>
                  <td className="px-6 border-r py-4 text-gray-600">{formatDate(audit.createdAt)}</td>
                  {/* <td className="px-6 border-r py-4">
                    {audit.latestScore !== undefined ? (
                      <span
                        className="px-3 py-1 rounded text-sm font-medium"
                        style={{ backgroundColor: scoreColor.bg, color: scoreColor.text }}
                      >
                        {audit.latestScore}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No score</span>
                    )}
                  </td> */}
                  <td className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-2">
                      {!isInvitedUser && (
                        <>
                          <button
                            onClick={() => router.push(`/update-audit/?edit=${audit.id}&category=1`)}
                            className="px-3 py-1.5 text-center cursor-pointer bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 flex items-center gap-1"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <CustomButton
                            variant="redLight"
                            className="text-center"
                            size="sm"
                            fullRounded={false}
                            leftIcon={<Trash2 size={14} />}
                            onClick={() => handleDeleteClick(audit.id)}
                          >
                            Delete
                          </CustomButton>
                        </>
                      )}
                      <button
                        onClick={() => router.push(`/test?presentationId=${audit.id}&category=1`)}
                        className="px-3 cursor-pointer py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-1"
                      >
                        <Play size={14} />
                        Start Audit
                      </button>
                      {!isInvitedUser && (
                        <button
                          onClick={() => handleInviteClick(audit)}
                          className="px-3 cursor-pointer py-1.5 text-center bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Mail size={14} />
                          Invite
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleteAuditMutation.isPending) {
            setDeleteModalOpen(false);
            setAuditToDelete(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Audit"
        message="Are you sure you want to delete this audit? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteAuditMutation.isPending}
      />

      {/* Invite Audit Modal */}
      {auditToInvite && (
        <InviteAuditModal
          isOpen={inviteModalOpen}
          onClose={() => {
            setInviteModalOpen(false);
            setAuditToInvite(null);
          }}
          onInvite={handleInvite}
          auditTitle={auditToInvite.title}
          loading={sendInviteMutation.isPending}
        />
      )}
    </div>
  );
}