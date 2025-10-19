/// <reference types="cypress" />

import { currencyFormatter } from "../../src/shared/lib/formatCurrency";
// @ts-expect-error JSON imports are handled via Cypress bundler
import leadsFixture from "../fixtures/leads.json";
// @ts-expect-error JSON imports are handled via Cypress bundler
import usersFixture from "../fixtures/users.json";

type LeadRecord = Record<string, unknown> & {
  id: string;
  title?: string;
  assigneeId?: string | null;
  contact?: Record<string, unknown> | null;
  assignee?: Record<string, unknown> | null;
  creator?: Record<string, unknown> | null;
  potentialValue?: number | string | null;
};

type UserRecord = Record<string, unknown> & {
  id: string;
};

const cloneLead = (lead: LeadRecord): LeadRecord => ({
  ...lead,
  contact: lead.contact ? { ...lead.contact } : null,
  assignee: lead.assignee ? { ...lead.assignee } : null,
  creator: lead.creator ? { ...lead.creator } : null,
  appointments: Array.isArray(lead.appointments)
    ? [...(lead.appointments as unknown[])]
    : [],
});

describe("Lead Edit Dialog", () => {
  let leadsData: LeadRecord[] = [];
  let usersData: UserRecord[] = [];

  const getAssignee = (assigneeId?: string | null) =>
    usersData.find((user) => user.id === assigneeId) || null;

  beforeEach(() => {
    // Setup authentication
    cy.login();

    leadsData = (leadsFixture as LeadRecord[]).map((lead) => cloneLead(lead));
    usersData = (usersFixture as UserRecord[]).map((user) => ({ ...user }));

    cy.intercept("GET", "**/api/leads*", (req) => {
      console.info("upper beforeEach [intercept] /api/leads hit", req.url);
      req.reply(leadsData);
    }).as("getLeads");

    cy.intercept("GET", /\/api\/leads\/[A-Za-z0-9-]+$/, (req) => {
      const leadId = req.url.split("/").pop();
      const lead = leadsData.find((item) => item.id === leadId);
      req.reply(lead || leadsData[0]);
    }).as("getLeadById");

    cy.intercept("GET", "/api/leads/archived", []).as("getArchivedLeads");

    cy.intercept("GET", "/api/users", (req) => {
      req.reply(usersData);
    }).as("getUsers");

    cy.intercept("POST", "/api/leads", (req) => {
      const now = new Date().toISOString();
      const potentialValue = req.body?.potentialValue;
      const parsedPotentialValue =
        typeof potentialValue === "string"
          ? Number(potentialValue.replace(/[^0-9.]/g, ""))
          : (potentialValue ?? null);

      const newLead: LeadRecord = {
        id: `lead-${Date.now()}`,
        ...req.body,
        potentialValue: parsedPotentialValue,
        contact: req.body?.contact || null,
        assigneeId: req.body?.assigneeId || null,
        assignee: getAssignee(req.body?.assigneeId),
        creator: req.body?.creator || null,
        stage: req.body?.stage || "LEAD",
        createdAt: now,
        updatedAt: now,
      };

      leadsData = [...leadsData, cloneLead(newLead)];

      req.reply({
        statusCode: 201,
        body: newLead,
      });
    }).as("createLead");

    cy.intercept("PUT", /\/api\/leads\/[A-Za-z0-9-]+$/, (req) => {
      const leadId = req.url.split("/").pop();
      const index = leadsData.findIndex((lead) => lead.id === leadId);
      const now = new Date().toISOString();

      if (index === -1) {
        req.reply({ statusCode: 404, body: { message: "Lead not found" } });
        return;
      }

      const potentialValue = req.body?.potentialValue;
      const parsedPotentialValue =
        typeof potentialValue === "string"
          ? Number(potentialValue.replace(/[^0-9.]/g, ""))
          : (potentialValue ?? leadsData[index]?.potentialValue ?? null);

      const updatedLead: LeadRecord = {
        ...leadsData[index],
        ...req.body,
        potentialValue: parsedPotentialValue,
        contact: {
          ...(leadsData[index]?.contact || {}),
          ...(req.body?.contact || {}),
        },
        assigneeId: req.body?.assigneeId || leadsData[index]?.assigneeId,
        assignee:
          getAssignee(req.body?.assigneeId) ||
          (leadsData[index]?.assignee as Record<string, unknown> | null) ||
          null,
        creator:
          (req.body?.creator as Record<string, unknown> | null | undefined) ??
          (leadsData[index]?.creator as Record<string, unknown> | null) ??
          null,
        updatedAt: now,
      };

      leadsData[index] = cloneLead(updatedLead);

      req.reply({
        statusCode: 200,
        body: updatedLead,
      });
    }).as("updateLead");

    cy.visit("/en/leads?disableSsr=on");
    cy.wait("@getLeads");
  });

  describe("Create Lead", () => {
    it("should create a new lead successfully", () => {
      // Open create dialog
      cy.get('[data-testid="create-lead-button"]').click();

      // Verify dialog is open
      cy.get('[role="dialog"]').should("be.visible");
      cy.contains("Create Lead").should("be.visible");

      // Fill form fields
      cy.get('[data-testid="title-input"]').type("Test Lead from Cypress");
      cy.get('[data-testid="product-input"]').type("Test Product");
      cy.get('[data-testid="potential-value-input"]').type("5_000");
      cy.get('[data-testid="name-input"]').type("Test Client");
      cy.get('[data-testid="email-input"]').type("test.client@example.com");
      cy.get('[data-testid="user-select"]').click();
      cy.get('[data-testid="user-option-user-1"]').click();
      cy.get('[data-testid="submit-button"]').click();
      cy.wait("@createLead").its("response.statusCode").should("eq", 201);

      // Verify success
      cy.get('[role="dialog"]').should("not.exist");
      cy.contains("Test Lead from Cypress").should("exist");

      // Verify success notification
      cy.get('[data-testid="success-notification"]')
        .should("be.visible")
        .should("contain", "Lead created successfully");
    });

    it("should show validation errors for required fields", () => {
      cy.get('[data-testid="create-lead-button"]').click();

      // Try to submit without required fields
      cy.get('[data-testid="submit-button"]').click();

      // Check for validation errors
      cy.contains("Please enter the client's name.").should("be.visible");
      cy.get('[data-testid="name-input"]').should("have.attr", "required");

      // Dialog should still be open
      cy.get('[role="dialog"]').should("be.visible");
    });

    it("should close dialog when cancel is clicked", () => {
      cy.get('[data-testid="create-lead-button"]').click();

      cy.get('[role="dialog"]').should("be.visible");

      cy.get('[data-testid="cancel-button"]').click();

      cy.get('[role="dialog"]').should("not.exist");
    });

    it("should close dialog when close icon is clicked", () => {
      cy.get('[data-testid="create-lead-button"]').click();

      cy.get('[role="dialog"]').should("be.visible");

      cy.get('[aria-label="close"]').click();

      cy.get('[role="dialog"]').should("not.exist");
    });
  });

  describe("Update Lead", () => {
    beforeEach(function () {
      const now = new Date().toISOString();
      // const assignee = usersData[0] ? { ...usersData[0] } : null;
      const seedLead: LeadRecord = {
        id: "lead-to-update",
        title: "Lead to Update",
        productInterest: "Original Product",
        potentialValue: 1000,
        stage: "LEAD",
        assigneeId: "user-1",
        assignee: {
          id: "user-1",
          name: "Test Client",
          email: "test.client@example.com",
        },
        creator: {
          id: "user-1",
          name: "Test Client",
          email: "test.client@example.com",
        },
        contact: {
          id: "contact-1",
          name: "Test Client",
          email: "test.client@example.com",
          phone: "+1234567890",
        },
        appointments: [],
        createdAt: now,
        updatedAt: now,
      };

      leadsData = [
        ...leadsData.filter((lead) => lead.id !== seedLead.id),
        cloneLead(seedLead),
      ];

      cy.wrap(seedLead).as("testLead");
    });

    it("should update an existing lead successfully", function () {
      cy.get<LeadRecord>("@testLead").then((lead) => {
        cy.get(`[data-testid="table-row-${lead.id}"]`)
          .find(`[data-testid="action-cell-button-${lead.id}"]`)
          .click();

        cy.get(`[data-testid="action-menu-${lead.id}-item-edit"]`).click();

        cy.wait("@getLeadById");

        cy.get('[role="dialog"]').should("be.visible");
        cy.contains("Edit Lead").should("be.visible");

        cy.get('[data-testid="title-input"]').should(
          "have.value",
          "Lead to Update"
        );
        cy.get('[data-testid="product-input"]').should(
          "have.value",
          "Original Product"
        );
        cy.get('[data-testid="potential-value-input"]').should(
          "have.value",
          "1000"
        );

        cy.get('[data-testid="title-input"]')
          .clear()
          .type("Updated Lead Title");
        cy.get('[data-testid="product-input"]').clear().type("Updated Product");
        const newPotentialValue = 55555;
        cy.get('[data-testid="potential-value-input"]')
          .clear()
          .type(newPotentialValue.toString());

        cy.get('[data-testid="submit-button"]').click();

        cy.wait("@updateLead").its("response.statusCode").should("eq", 200);

        cy.get('[role="dialog"]').should("not.exist");
        cy.contains("Updated Lead Title").should("be.visible");
        const formattedValue = currencyFormatter(newPotentialValue).replace(
          /\u00A0/g,
          " "
        );
        cy.log(formattedValue);
        cy.contains(formattedValue).should("be.visible");
      });
    });

    it("should show loading state while fetching lead data", function () {
      cy.get("@testLead").then((testLead) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lead = testLead as any;
        // Intercept API call to simulate slow loading
        cy.intercept("GET", `/api/leads/${lead.id}`, {
          delay: 2000,
          fixture: "lead.json",
        }).as("getLeadById");

        cy.get(`[data-testid="table-row-${lead.id}"]`)
          .find(`[data-testid="action-cell-button-${lead.id}"]`)
          .click();

        cy.get(`[data-testid="action-menu-${lead.id}-item-edit"]`).click();

        // Verify loading state
        cy.get('[role="dialog"]').should("be.visible");
        cy.get('[data-testid="lead-loading-spinner"]').should("be.visible");

        // Wait for data to load
        cy.wait("@getLeadById");

        // Verify form is populated
        cy.get('[data-testid="lead-loading-spinner"]').should("not.exist");
        cy.get('[data-testid="title-input"]').should("be.visible");
      });
    });

    it("should handle update errors gracefully", function () {
      cy.get("@testLead").then((testLead) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lead = testLead as any;
        // Mock API error
        cy.intercept("PUT", `/api/leads/${lead.id}`, {
          statusCode: 500,
          body: { error: "Internal server error" },
        }).as("updateLeadError");

        cy.get(`[data-testid="table-row-${lead.id}"]`)
          .find(`[data-testid="action-cell-button-${lead.id}"]`)
          .click();
        cy.get(`[data-testid="action-menu-${lead.id}-item-edit"]`).click();

        cy.get('[data-testid="title-input"]').clear().type("This will fail");

        cy.get('[data-testid="submit-button"]').click();

        cy.wait("@updateLeadError");

        // Verify error handling
        cy.get('[data-testid="error-notification"]')
          .should("be.visible")
          .should("contain", "Failed to update lead");

        // Dialog should remain open
        cy.get('[role="dialog"]').should("be.visible");
      });
    });
  });

  describe("Form Interactions", () => {
    beforeEach(() => {
      cy.get('[data-testid="create-lead-button"]').click();
    });

    it("should handle form field interactions correctly", () => {
      // Test text input
      cy.get('[data-testid="title-input"]')
        .type("Test Lead Title")
        .should("have.value", "Test Lead Title");

      // Test number input
      cy.get('[data-testid="potential-value-input"]')
        .type("1500.50")
        .should("have.value", "1500.50");

      // Test autocomplete/select fields
      cy.get('[data-testid="user-select"]').click();
      cy.get('[data-testid="user-option-user-1"]').click();
      cy.get('[data-testid="user-select"]').should("contain", "Test Client");

      // Test stage selection
      cy.get('[data-testid="stage-select"]').click();
      cy.get('[data-testid="stage-option-QUALIFIED"]').click();
      cy.get('[data-testid="stage-select"]').should("contain", "Qualified");
    });

    it("should handle appointments section", () => {
      // Add appointment
      cy.get('[data-testid="add-appointment-button"]').click();

      cy.get('[data-testid="appointment-note-0"]').type(
        "Initial meeting with client"
      );

      cy.get('[data-testid="appointment-datetime-input-0"]').type(
        // "2024-12-15T10:00"
        "12.15.2025 10:00"
      );

      cy.get('[data-testid="appointment-type-select-0"]').click();
      cy.get('[data-testid="appointment-type-MEETING"]').click();

      // Verify appointment is added
      cy.get('[data-testid="appointment-type-select-0"]').should("be.visible");

      // Remove appointment
      cy.get('[data-testid="remove-appointment-0"]').click();
      cy.get('[data-testid="appointment-note-0"]').should("not.exist");
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      cy.get('[data-testid="create-lead-button"]').click();
    });

    it("should be accessible via keyboard navigation", () => {      
      cy.get('[data-testid="product-input"]').should('exist').focus();
      cy.focused().should("have.attr", "data-testid", "product-input");

      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.focused().should("have.attr", "data-testid", "potential-value-input");

      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.focused().should("have.attr", "data-testid", "title-input");

      // Test escape key closes dialog
      cy.get("body").type("{esc}");
      cy.get('[role="dialog"]').should("not.exist");
    });

    it("should have proper ARIA labels and roles", () => {
      cy.get('[role="dialog"]').should("have.attr", "aria-labelledby");

      cy.get('[aria-label="close"]').should("be.visible");

      cy.get("form").should("have.attr", "id", "lead-upsert-form");

      cy.get('[type="submit"]').should("have.attr", "form", "lead-upsert-form");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", () => {
      // Simulate network error
      cy.intercept("POST", "/api/leads", {
        forceNetworkError: true,
      }).as("networkError");

      cy.get('[data-testid="create-lead-button"]').click();

      cy.get('[data-testid="title-input"]').type("Network Error Test");
      cy.get('[data-testid="name-input"]').type("Test Client");
      cy.get('[data-testid="submit-button"]').click();

      cy.wait("@networkError");

      // Should show error message
      cy.get('[data-testid="error-notification"]')
        .should("be.visible")
        .should("contain", "Failed to create lead");

      // Dialog should remain open
      cy.get('[role="dialog"]').should("be.visible");
    });

    it("should handle validation errors from server", () => {
      cy.intercept("POST", "/api/leads", {
        statusCode: 400,
        body: {
          errors: {
            title: ["Title is required"],
            potentialValue: ["Must be a positive number"],
          },
        },
      }).as("validationError");

      cy.get('[data-testid="create-lead-button"]').click();

      cy.get('[data-testid="title-input"]').type("Network Error Test");
      cy.get('[data-testid="name-input"]').type("Test Client");

      cy.get('[data-testid="submit-button"]').click();

      cy.wait("@validationError");
      cy.wait(1000);
      // Should display server validation errors in form helper text
      cy.get('[role="dialog"]').within(() => {
        cy.contains("Title is required").should("exist");
        cy.contains("Must be a positive number").should("exist");
      });
    });
  });

  describe("Data Persistence", () => {
    it("should preserve form data when switching between fields", () => {
      cy.get('[data-testid="create-lead-button"]').click();

      // Fill multiple fields
      cy.get('[data-testid="title-input"]').type("Persistent Data Test");
      cy.get('[data-testid="product-input"]').type("Test Product");
      cy.get('[data-testid="potential-value-input"]').type("3000");

      // Navigate away and back to first field
      cy.get('[data-testid="product-input"]').focus();
      cy.get('[data-testid="title-input"]').focus();

      // Data should still be there
      cy.get('[data-testid="title-input"]').should(
        "have.value",
        "Persistent Data Test"
      );
      cy.get('[data-testid="product-input"]').should(
        "have.value",
        "Test Product"
      );
      cy.get('[data-testid="potential-value-input"]').should(
        "have.value",
        "3000"
      );
    });

    it("should not lose data when validation fails", () => {
      cy.intercept("POST", "/api/leads", {
        statusCode: 400,
        body: { error: "Validation failed" },
      }).as("validationFailed");

      cy.get('[data-testid="create-lead-button"]').click();

      cy.get('[data-testid="title-input"]').type("Data Persistence Test");
      cy.get('[data-testid="product-input"]').type("Test Product");
      cy.get('[data-testid="name-input"]').type("Test Client");

      cy.get('[data-testid="submit-button"]').click();

      cy.wait("@validationFailed");

      // Form data should still be present after failed submission
      cy.get('[data-testid="title-input"]').should(
        "have.value",
        "Data Persistence Test"
      );
      cy.get('[data-testid="product-input"]').should(
        "have.value",
        "Test Product"
      );
    });
  });
});
