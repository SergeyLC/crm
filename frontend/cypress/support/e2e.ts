// ***********************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

beforeEach(() => {
  cy.login();
});

// Hide fetch/XHR requests from command log
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Handle uncaught exceptions in tests that expect errors
Cypress.on('uncaught:exception', (err) => {
  // Return false to prevent the error from failing the test
  // This is useful for tests that intentionally trigger errors
  if (err.message.includes('Failed to create deal') || 
      err.message.includes('Failed to update deal') ||
      err.message.includes('Failed to fetch')) {
    return false;
  }
  // Let other errors fail the test
  return true;
});