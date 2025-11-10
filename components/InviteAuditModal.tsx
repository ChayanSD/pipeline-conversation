"use client";

import React, { useState } from "react";
import { Mail } from "lucide-react";
import CustomButton from "./common/CustomButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InviteAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
  auditTitle: string;
  loading?: boolean;
}

export default function InviteAuditModal({
  isOpen,
  onClose,
  onInvite,
  auditTitle,
  loading = false,
}: InviteAuditModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      await onInvite(email.trim());
      setEmail("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail("");
      setError("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Mail size={32} className="text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-center">Invite to Audit</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Send an invitation to take the audit: <strong>{auditTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Enter email address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter className="sm:justify-center gap-3 pt-4">
            <CustomButton
              variant="gray"
              size="md"
              onClick={handleClose}
              disabled={loading}
              fullRounded={true}
              type="button"
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="md"
              type="submit"
              loading={loading}
              fullRounded={true}
            >
              Send Invitation
            </CustomButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

