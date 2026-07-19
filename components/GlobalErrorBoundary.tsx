'use client';
import React, { ErrorInfo, useState, useEffect } from 'react';
import { MaintenanceProvider, useMaintenance } from '@/hooks/useMaintenance';
import MaintenanceOverlay from './MaintenanceOverlay';

interface Props {
  children: React.ReactNode;
}

class ErrorBoundaryInternal extends React.Component<Props & { hasError: boolean, setHasError: (val: boolean) => void }> {
  constructor(props: any) {
    super(props);
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Error caught:', error, errorInfo);
    this.props.setHasError(true);
  }

  render() {
    if (this.props.hasError) {
      return <MaintenanceOverlay isError={true} />;
    }

    return this.props.children;
  }
}

function ErrorBoundaryContent({ children }: { children: React.ReactNode }) {
  const { isMaintenance, hasError, setHasError } = useMaintenance();
  const [isAdminMounted, setIsAdminMounted] = useState(false);

  useEffect(() => {
    // Purely client-side check to see if we are in admin bypass mode
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'rova_admin_2026') {
        setIsAdminMounted(true);
      }
    }
  }, []);

  // If maintenance is active AND we are not a verified admin, show overlay
  // We check isMaintenance first to ensure the common case (Offline) is fast
  if (isMaintenance && !isAdminMounted) {
    return <MaintenanceOverlay isError={false} />;
  }

  return (
    <ErrorBoundaryInternal hasError={hasError} setHasError={setHasError}>
      {children}
    </ErrorBoundaryInternal>
  );
}

export default function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <MaintenanceProvider>
      <ErrorBoundaryContent>
        {children}
      </ErrorBoundaryContent>
    </MaintenanceProvider>
  );
}
