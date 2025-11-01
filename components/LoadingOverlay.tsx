'use client';

import { ClipLoader } from 'react-spinners';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingOverlay({ isVisible, message = 'Loading...' }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center space-y-4">
        <ClipLoader size={50} color="#3B82F6" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}