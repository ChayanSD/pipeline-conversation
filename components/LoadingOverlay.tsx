'use client';

import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingOverlay({ isVisible, message = 'Loading...' }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#F7AF41] rounded-full animate-spin" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

