/// <reference types="cypress" />

interface LeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      createTestLead(lead: LeadData): Chainable<LeadData>;
      tab(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', () => {
  const mockUser = {
    id: "63b0819c-08ea-4a66-9166-769760db12c1",
    email: "test.client@example.com",
    firstName: "Test",
    lastName: "User",
    role: "ADMIN",
  };

  cy.intercept('POST', '**/auth/login', {
    statusCode: 200,
    body: {
      success: true,
      token: 'test-token',
      user: mockUser,
    },
  }).as('loginRequest');

  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: {
      success: true,
      user: mockUser,
    },
  }).as('getCurrentUser');

  cy.session(
    'test-user-session',
    () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
      });
    },
    {
      validate: () => {
        cy.window().then((win) => {
          cy.wrap(win.localStorage.getItem('token')).should('equal', 'test-token');
        });
      },
      cacheAcrossSpecs: true,
    }
  );
});

Cypress.Commands.add('createTestLead', (leadData: LeadData) => {
  return cy.request({
    method: 'POST',
    url: '/api/leads',
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: leadData,
  }).then((response) => response.body as LeadData);
});

Cypress.Commands.add('tab', () => {
  cy.focused().tab();
});

export {};