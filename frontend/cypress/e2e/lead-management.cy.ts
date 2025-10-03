describe('Lead Management E2E Tests', () => {
  beforeEach(() => {
    // Visit the leads page
    cy.visit('/leads');
    
    // Mock auth by setting localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'test-token');
    });
  });

  it('should display leads page', () => {
    cy.get('h1').should('contain', 'Leads');
    cy.get('[data-testid="leads-table"]').should('exist');
  });

  it('should open lead edit dialog when clicking edit button', () => {
    // Assuming there's a lead edit button
    cy.get('[data-testid="lead-edit-btn"]').first().click();
    
    // Check if dialog opens
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').should('contain', 'Edit Lead');
  });

  it('should close lead edit dialog when clicking close button', () => {
    // Open dialog first
    cy.get('[data-testid="lead-edit-btn"]').first().click();
    cy.get('[role="dialog"]').should('be.visible');
    
    // Close dialog
    cy.get('[aria-label="close"]').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should create new lead when clicking add button', () => {
    // Click add new lead button
    cy.get('[data-testid="add-lead-btn"]').click();
    
    // Check if dialog opens for creation
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').should('contain', 'New Lead');
  });

  it('should validate form fields when submitting empty form', () => {
    // Open create dialog
    cy.get('[data-testid="add-lead-btn"]').click();
    
    // Try to submit empty form
    cy.get('[data-testid="save-btn"]').click();
    
    // Check for validation errors
    cy.get('.MuiFormHelperText-root').should('contain', 'required');
  });

  it('should successfully create a new lead with valid data', () => {
    // Intercept API call
    cy.intercept('POST', '/api/leads', { statusCode: 201, body: { id: 'new-lead-id' } }).as('createLead');
    
    // Open create dialog
    cy.get('[data-testid="add-lead-btn"]').click();
    
    // Fill form
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="lastName"]').type('Doe');
    cy.get('input[name="email"]').type('john.doe@example.com');
    cy.get('input[name="phone"]').type('+1234567890');
    
    // Submit form
    cy.get('[data-testid="save-btn"]').click();
    
    // Wait for API call
    cy.wait('@createLead');
    
    // Check if dialog closes
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should filter leads by search term', () => {
    // Type in search field
    cy.get('[data-testid="search-input"]').type('John');
    
    // Check if table updates
    cy.get('[data-testid="leads-table"]').should('contain', 'John');
  });

  it('should sort leads by column', () => {
    // Click on name column header to sort
    cy.get('[data-testid="sort-name"]').click();
    
    // Check if table is sorted (this would depend on your implementation)
    cy.get('[data-testid="leads-table"] tbody tr').first().should('contain', 'A');
  });

  it('should archive a lead', () => {
    // Intercept API call
    cy.intercept('PUT', '/api/leads/*/archive', { statusCode: 200 }).as('archiveLead');
    
    // Click archive button
    cy.get('[data-testid="archive-lead-btn"]').first().click();
    
    // Confirm in dialog
    cy.get('[data-testid="confirm-archive"]').click();
    
    // Wait for API call
    cy.wait('@archiveLead');
    
    // Check if lead is removed from list
    cy.get('[data-testid="leads-table"]').should('not.contain', 'archived-lead');
  });
});