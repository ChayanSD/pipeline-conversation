"use client";

import React from "react";
import { useUser } from "@/contexts/UserContext";

type ButtonVariant =
  | "primary"      // Yellow brand button (black text)
  | "brand"        // Deeper brand button (white text)
  | "gray"         // Neutral gray
  | "grayDark"     // Dark gray
  | "green"        // Success
  | "redLight";    // Destructive light

type ButtonSize = "sm" | "md" | "lg";

export interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullRounded?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const variantToClass: Record<ButtonVariant, string> = {
  primary:
    "text-black bg-[#F7AF41]",
  brand:
    "bg-[#F7B538] text-white hover:bg-[#F7AF41]",
  gray:
    "bg-[#CECECE] text-black hover:bg-[#CECECE]/80",
  grayDark:
    "bg-gray-600 text-white hover:bg-gray-700",
  green:
    "bg-green-600 text-white hover:bg-green-700",
  redLight:
    "bg-red-100 text-red-600 hover:bg-red-200",
};

const sizeToClass: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-base",
};

export default function CustomButton({
  variant = "primary",
  size = "md",
  fullRounded = true,
  leftIcon,
  rightIcon,
  loading = false,
  className,
  children,
  disabled,
  style,
  ...props
}: CustomButtonProps) {
  const { user } = useUser();
  const secondaryColor = user?.secondaryColor || '#456987';
  
  const base = "inline-flex  items-center justify-center font-medium transition-colors cursor-pointer";
  const rounded = fullRounded ? "rounded-full" : "rounded-md";
  const disabledClass = "disabled:opacity-60 disabled:cursor-not-allowed";

  // For primary variant, use secondary color from user context
  const primaryStyle = variant === "primary" 
    ? { backgroundColor: "#F7AF41", ...style }
    : style;

  return (
    <button
      className={[
        base,
        rounded,
        disabledClass,
        variantToClass[variant],
        sizeToClass[size],
        className || "",
      ].join(" ")}
      style={primaryStyle}
      disabled={disabled || loading}
      {...props}
    >
      {leftIcon ? <span className="mr-2 inline-flex">{leftIcon}</span> : null}
      <span>{loading ? "Please wait..." : children}</span>
      {rightIcon ? <span className="ml-2 inline-flex">{rightIcon}</span> : null}
    </button>
  );
}

