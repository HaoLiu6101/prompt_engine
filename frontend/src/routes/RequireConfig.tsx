import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppConfigStore } from '../stores/useAppConfigStore';

interface RequireConfigProps {
  children: ReactNode;
}

function RequireConfig({ children }: RequireConfigProps) {
  const backendUrl = useAppConfigStore((state) => state.backendUrl);
  const location = useLocation();

  const isConfigured = Boolean(backendUrl);

  if (!isConfigured) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default RequireConfig;
