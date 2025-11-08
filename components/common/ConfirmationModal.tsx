"use client";

import React from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import CustomButton from "./CustomButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmationModalProps) {
  const variantStyles = {
    danger: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      icon: Trash2,
      defaultTitle: "Delete Confirmation",
    },
    warning: {
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      icon: AlertTriangle,
      defaultTitle: "Warning",
    },
    info: {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      icon: Info,
      defaultTitle: "Confirmation",
    },
  };

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`${styles.iconBg} rounded-full p-3`}>
              <Icon size={32} className={styles.iconColor} />
            </div>
          </div>
          
          <DialogTitle className="text-center">
            {title || variantStyles[variant].defaultTitle}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="sm:justify-center gap-3 pt-4">
          <CustomButton
            variant="gray"
            size="md"
            onClick={onClose}
            disabled={loading}
            fullRounded={true}
          >
            {cancelText}
          </CustomButton>
          <CustomButton
            variant={variant === "danger" ? "redLight" : variant === "warning" ? "primary" : "green"}
            size="md"
            onClick={onConfirm}
            loading={loading}
            fullRounded={true}
          >
            {confirmText}
          </CustomButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

