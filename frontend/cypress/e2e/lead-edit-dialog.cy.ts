/// <reference types="cypress" />

describe('Lead Edit Dialog', () => {
  beforeEach(() => {
    // Setup authentication
    cy.login();
    cy.visit('/leads');
  });

  describe('Create Lead', () => {
    it('should create a new lead successfully', () => {
      // Open create dialog
      cy.get('[data-testid="create-lead-button"]').click();

      // Verify dialog is open
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Create Lead').should('be.visible');

      // Fill form fields
      cy.get('[data-testid="title-input"]').type('Test Lead from Cypress');
      cy.get('[data-testid="product-input"]').type('Test Product');
      cy.get('[data-testid="potential-value-input"]').type('5000');

      // Submit form
      cy.get('[data-testid="submit-button"]').click();

      // Verify success
      cy.get('[role="dialog"]').should('not.exist');
      cy.contains('Test Lead from Cypress').should('be.visible');
      
      // Verify success notification
      cy.get('[data-testid="success-notification"]')
        .should('be.visible')
        .should('contain', 'Lead created successfully');
    });

    it('should show validation errors for required fields', () => {
      cy.get('[data-testid="create-lead-button"]').click();

      // Try to submit without required fields
      cy.get('[data-testid="submit-button"]').click();

      // Check for validation errors
      cy.contains('Title is required').should('be.visible');
      
      // Dialog should still be open
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('should close dialog when cancel is clicked', () => {
      cy.get('[data-testid="create-lead-button"]').click();
      
      cy.get('[role="dialog"]').should('be.visible');
      
      cy.get('[data-testid="cancel-button"]').click();
      
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should close dialog when close icon is clicked', () => {
      cy.get('[data-testid="create-lead-button"]').click();
      
      cy.get('[role="dialog"]').should('be.visible');
      
      cy.get('[aria-label="close"]').click();
      
      cy.get('[role="dialog"]').should('not.exist');
    });
  });

  describe('Update Lead', () => {
    beforeEach(function () {
      // Create a test lead first
      cy.createTestLead({
        title: 'Lead to Update',
        productInterest: 'Original Product',
        potentialValue: 1000,
      }).as('testLead');
    });

    it('should update an existing lead successfully', function () {
      // Get the test lead from alias
      cy.get('@testLead').then((testLead) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lead = testLead as any;
        // Open edit dialog for the test lead
        cy.get(`[data-testid="lead-row-${lead.id}"]`)
          .find('[data-testid="edit-button"]')
          .click();

        // Verify dialog is open with existing data
        cy.get('[role="dialog"]').should('be.visible');
        cy.contains('Edit Lead').should('be.visible');
      
      // Verify form is populated with existing data
      cy.get('[data-testid="title-input"]').should('have.value', 'Lead to Update');
      cy.get('[data-testid="product-input"]').should('have.value', 'Original Product');
      cy.get('[data-testid="potential-value-input"]').should('have.value', '1000');

      // Update form fields
      cy.get('[data-testid="title-input"]')
        .clear()
        .type('Updated Lead Title');
      
      cy.get('[data-testid="product-input"]')
        .clear()
        .type('Updated Product');
      
      cy.get('[data-testid="potential-value-input"]')
        .clear()
        .type('2500');

      // Submit form
      cy.get('[data-testid="submit-button"]').click();

      // Verify success
      cy.get('[role="dialog"]').should('not.exist');
      cy.contains('Updated Lead Title').should('be.visible');
      cy.contains('Updated Product').should('be.visible');
      
      // Verify success notification
      cy.get('[data-testid="success-notification"]')
        .should('be.visible')
        .should('contain', 'Lead updated successfully');
    });

    it('should show loading state while fetching lead data', function () {
      cy.get('@testLead').then((testLead) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lead = testLead as any;
        // Intercept API call to simulate slow loading
        cy.intercept('GET', `/api/leads/${lead.id}`, {
          delay: 2000,
          fixture: 'lead.json',
        }).as('getLeadById');

        cy.get(`[data-testid="lead-row-${lead.id}"]`)
          .find('[data-testid="edit-button"]')
          .click();

        // Verify loading state
        cy.get('[role="dialog"]').should('be.visible');
        cy.get('[data-testid="loading-spinner"]').should('be.visible');
        
        // Wait for data to load
        cy.wait('@getLeadById');
        
        // Verify form is populated
        cy.get('[data-testid="loading-spinner"]').should('not.exist');
        cy.get('[data-testid="title-input"]').should('be.visible');
      });
    });

    it('should handle update errors gracefully', function () {
      cy.get('@testLead').then((testLead) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lead = testLead as any;
        // Mock API error
        cy.intercept('PUT', `/api/leads/${lead.id}`, {
          statusCode: 500,
          body: { error: 'Internal server error' },
        }).as('updateLeadError');

        cy.get(`[data-testid="lead-row-${lead.id}"]`)
          .find('[data-testid="edit-button"]')
          .click();

        cy.get('[data-testid="title-input"]')
          .clear()
          .type('This will fail');

        cy.get('[data-testid="submit-button"]').click();

        cy.wait('@updateLeadError');

        // Verify error handling
        cy.get('[data-testid="error-notification"]')
          .should('be.visible')
          .should('contain', 'Failed to update lead');
        
        // Dialog should remain open
        cy.get('[role="dialog"]').should('be.visible');
      });
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      cy.get('[data-testid="create-lead-button"]').click();
    });

    it('should handle form field interactions correctly', () => {
      // Test text input
      cy.get('[data-testid="title-input"]')
        .type('Test Lead Title')
        .should('have.value', 'Test Lead Title');

      // Test number input
      cy.get('[data-testid="potential-value-input"]')
        .type('1500.50')
        .should('have.value', '1500.50');

      // Test autocomplete/select fields
      cy.get('[data-testid="assignee-select"]').click();
      cy.get('[data-testid="assignee-option-user-1"]').click();
      cy.get('[data-testid="assignee-select"]').should('contain', 'Test User');

      // Test stage selection
      cy.get('[data-testid="stage-select"]').click();
      cy.get('[data-testid="stage-option-qualified"]').click();
      cy.get('[data-testid="stage-select"]').should('contain', 'Qualified');
    });

    it('should handle appointments section', () => {
      // Add appointment
      cy.get('[data-testid="add-appointment-button"]').click();
      
      cy.get('[data-testid="appointment-note-0"]')
        .type('Initial meeting with client');
      
      cy.get('[data-testid="appointment-datetime-0"]')
        .type('2024-12-15T10:00');
      
      cy.get('[data-testid="appointment-type-0"]').click();
      cy.get('[data-testid="appointment-type-meeting"]').click();

      // Verify appointment is added
      cy.get('[data-testid="appointment-item-0"]').should('be.visible');
      
      // Remove appointment
      cy.get('[data-testid="remove-appointment-0"]').click();
      cy.get('[data-testid="appointment-item-0"]').should('not.exist');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via keyboard navigation', () => {
      cy.get('[data-testid="create-lead-button"]').click();

      // Test tab navigation
      cy.get('[data-testid="title-input"]').focus();
      cy.focused().should('have.attr', 'data-testid', 'title-input');
      
      cy.tab();
      cy.focused().should('have.attr', 'data-testid', 'product-input');
      
      cy.tab();
      cy.focused().should('have.attr', 'data-testid', 'potential-value-input');

      // Test escape key closes dialog
      cy.get('body').type('{esc}');
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.get('[data-testid="create-lead-button"]').click();

      cy.get('[role="dialog"]')
        .should('have.attr', 'aria-labelledby')
        .and('have.attr', 'aria-describedby');

      cy.get('[aria-label="close"]').should('be.visible');
      
      cy.get('form').should('have.attr', 'id', 'lead-upsert-form');
      
      cy.get('[type="submit"]')
        .should('have.attr', 'form', 'lead-upsert-form');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network error
      cy.intercept('POST', '/api/leads', {
        forceNetworkError: true
      }).as('networkError');

      cy.get('[data-testid="create-lead-button"]').click();
      
      cy.get('[data-testid="title-input"]').type('Network Error Test');
      cy.get('[data-testid="submit-button"]').click();

      cy.wait('@networkError');

      // Should show error message
      cy.get('[data-testid="error-notification"]')
        .should('be.visible')
        .should('contain', 'Network error');
      
      // Dialog should remain open
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('should handle validation errors from server', () => {
      cy.intercept('POST', '/api/leads', {
        statusCode: 400,
        body: {
          errors: {
            title: ['Title is required'],
            potentialValue: ['Must be a positive number']
          }
        }
      }).as('validationError');

      cy.get('[data-testid="create-lead-button"]').click();
      cy.get('[data-testid="submit-button"]').click();

      cy.wait('@validationError');

      // Should display server validation errors
      cy.contains('Title is required').should('be.visible');
      cy.contains('Must be a positive number').should('be.visible');
    });
  });

  describe('Data Persistence', () => {
    it('should preserve form data when switching between fields', () => {
      cy.get('[data-testid="create-lead-button"]').click();

      // Fill multiple fields
      cy.get('[data-testid="title-input"]').type('Persistent Data Test');
      cy.get('[data-testid="product-input"]').type('Test Product');
      cy.get('[data-testid="potential-value-input"]').type('3000');

      // Navigate away and back to first field
      cy.get('[data-testid="product-input"]').focus();
      cy.get('[data-testid="title-input"]').focus();

      // Data should still be there
      cy.get('[data-testid="title-input"]').should('have.value', 'Persistent Data Test');
      cy.get('[data-testid="product-input"]').should('have.value', 'Test Product');
      cy.get('[data-testid="potential-value-input"]').should('have.value', '3000');
    });

    it('should not lose data when validation fails', () => {
      cy.intercept('POST', '/api/leads', {
        statusCode: 400,
        body: { error: 'Validation failed' }
      }).as('validationFailed');

      cy.get('[data-testid="create-lead-button"]').click();

      cy.get('[data-testid="title-input"]').type('Data Persistence Test');
      cy.get('[data-testid="product-input"]').type('Test Product');
      cy.get('[data-testid="submit-button"]').click();

      cy.wait('@validationFailed');

      // Form data should still be present after failed submission
      cy.get('[data-testid="title-input"]').should('have.value', 'Data Persistence Test');
      cy.get('[data-testid="product-input"]').should('have.value', 'Test Product');
    });
  });
});
});
