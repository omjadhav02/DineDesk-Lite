// 📁 context/SalesModeContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Type for sales mode
export type SalesMode = 'sales' | 'profit';

// Define context shape
interface SalesModeContextType {
  mode: SalesMode;
  toggleMode: () => void;
}

// Create context
const SalesModeContext = createContext<SalesModeContextType | undefined>(undefined);

// Context provider
export const SalesModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<SalesMode>('sales');

  const toggleMode = () => {
    setMode((prev) => (prev === 'sales' ? 'profit' : 'sales'));
  };

  return (
    <SalesModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </SalesModeContext.Provider>
  );
};

// Hook for using the mode
export const useSalesMode = () => {
  const context = useContext(SalesModeContext);
  if (!context) {
    throw new Error('useSalesMode must be used within a SalesModeProvider');
  }
  return context;
};
