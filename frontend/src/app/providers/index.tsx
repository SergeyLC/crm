import { ReactNode } from 'react';
import { DialogProvider } from '@/shared/lib/dialog';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    // AnotherProviders...
    <DialogProvider>
      {children}
    </DialogProvider>
    // AnotherProviders...
  );
};