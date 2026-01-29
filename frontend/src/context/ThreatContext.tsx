/**
 * Global Threat State Context
 * Provides threat data across the application
 */
'use client';

import { createContext, useContext, ReactNode } from 'react';

interface ThreatContextType {
  threats: any[];
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const ThreatContext = createContext<ThreatContextType | undefined>(undefined);

export function ThreatContextProvider({ children, value }: { children: ReactNode; value: ThreatContextType }) {
  return (
    <ThreatContext.Provider value={value}>
      {children}
    </ThreatContext.Provider>
  );
}

export function useThreatContext() {
  const context = useContext(ThreatContext);
  if (context === undefined) {
    throw new Error('useThreatContext must be used within a ThreatContextProvider');
  }
  return context;
}

// Export for backward compatibility
export { ThreatContext };

