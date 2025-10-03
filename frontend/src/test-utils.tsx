import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize i18n for tests
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          'dialog.create': 'Create Lead',
          'dialog.edit': 'Edit Lead',
          'dialog.update': 'Update Lead',
          'dialog.cancel': 'Cancel',
          'dialog.loading': 'Loading...',
          'dialog.errorLoad': 'Error loading lead data',
        },
        lead: {
          'dialog.create': 'Create Lead',
          'dialog.edit': 'Edit Lead', 
          'dialog.update': 'Update Lead',
          'dialog.cancel': 'Cancel',
          'dialog.loading': 'Loading...',
          'dialog.errorLoad': 'Error loading lead data',
        },
        deal: {
          'dialog.create': 'Create Deal',
          'dialog.edit': 'Edit Deal',
          'dialog.update': 'Update Deal', 
          'dialog.cancel': 'Cancel',
          'dialog.loading': 'Loading...',
          'dialog.errorLoad': 'Error loading deal data',
        },
      },
    },
  });
}

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data
export const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'ADMIN' as const,
};

export const mockLeadData = {
  id: 'lead-1',
  title: 'Test Lead',
  productInterest: 'Product A',
  potentialValue: 1000,
  assigneeId: 'user-1',
  stage: 'LEAD' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockCreateLeadData = {
  title: 'New Lead',
  productInterest: 'New Product',
  potentialValue: 2000,
  assigneeId: 'user-1',
};

export const mockDealData = {
  id: 'deal-1',
  title: 'Test Deal',
  description: 'Test Deal Description',
  potentialValue: 5000,
  stage: 'qualified' as const,
  status: 'active' as const,
  contactId: 'contact-1',
  creatorId: 'user-1',
  assigneeId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockCreateDealData = {
  title: 'New Deal',
  description: 'New Deal Description',
  potentialValue: 3000,
  stage: 'proposal' as const,
  contactId: 'contact-1',
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
export { createTestQueryClient, AllTheProviders };