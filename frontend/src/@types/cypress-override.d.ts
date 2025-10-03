// Override all Cypress types with empty definitions
declare namespace Cypress {
  // Empty - remove all Cypress types
}

// Remove global Assertion from Cypress
declare global {
  interface Assertion {
    // Keep empty to let Jest take over
  }
}

export {};