'use client';

import { useUser } from '@/contexts/UserContext';

export default function BackgroundWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  // Get the user's primary color, default to the original overlay color if not available
  const overlayColor = user?.primaryColor || '#2B4055'; // rgba(43,64,85,0.70) converted to hex
  
  // Convert hex to RGB for rgba overlay
  const hexToRgb = (hex: string): [number, number, number] | null => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Handle 3-digit hex
    let fullHex = cleanHex;
    if (cleanHex.length === 3) {
      fullHex = cleanHex.split('').map(char => char + char).join('');
    }
    
    if (fullHex.length !== 6) return null;
    
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    
    return [r, g, b];
  };

  const rgb = hexToRgb(overlayColor);
  const overlayRgba = rgb 
    ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.70)`
    : 'rgba(43, 64, 85, 0.70)'; // Fallback to original color

  return (
    <div 
      className="relative min-h-screen"
      style={{
        backgroundImage: 'url(/bg-img.png)',
        backgroundSize: 'contain',
      }}
    >
      {/* Dynamic Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: overlayRgba,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
