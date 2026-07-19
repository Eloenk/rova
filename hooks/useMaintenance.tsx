'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface MaintenanceContextType {
  isMaintenance: boolean;
  setIsMaintenance: (active: boolean) => Promise<void>;
  checkStatus: () => Promise<void>;
  hasError: boolean;
  setHasError: (val: boolean) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setMaintenanceState] = useState(false);
  const [hasError, setHasError] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/maintenance');
      const data = await res.json();
      if (typeof data.active === 'boolean') {
        setMaintenanceState(data.active);
      }
    } catch (e) {
      console.error('Failed to sync maintenance status');
    }
  }, []);

  const setIsMaintenance = async (active: boolean) => {
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      const data = await res.json();
      setMaintenanceState(!!data.active);
    } catch (e) {
      console.error('Failed to set maintenance status');
    }
  };

  useEffect(() => {
    checkStatus();
    const id = setInterval(checkStatus, 30000); // Polling every 30s
    return () => clearInterval(id);
  }, [checkStatus]);

  return (
    <MaintenanceContext.Provider value={{ isMaintenance, setIsMaintenance, checkStatus, hasError, setHasError }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
}
