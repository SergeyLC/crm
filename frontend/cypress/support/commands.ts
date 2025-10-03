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
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      email: 'test@example.com',
      password: 'password123',
    },
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.token);
  });
});

Cypress.Commands.add('createTestLead', (leadData: LeadData) => {
  return cy.request({
    method: 'POST',
    url: '/api/leads',
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('authToken')}`,
    },
    body: leadData,
  }).then((response) => response.body as LeadData);
});

Cypress.Commands.add('tab', () => {
  cy.focused().tab();
});

export {};