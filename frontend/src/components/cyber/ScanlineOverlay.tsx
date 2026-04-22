import React from 'react';

export const ScanlineOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent animate-scanline" />
    </div>
  );
};
