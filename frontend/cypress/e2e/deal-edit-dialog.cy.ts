/// <reference types="cypress" />

import { currencyFormatter } from "../../src/shared/lib/formatCurrency";
// @ts-expect-error JSON imports are handled via Cypress bundler
import dealsFixture from "../fixtures/deals.json";
// @ts-expect-error JSON imports are handled via Cypress bundler
import usersFixture from "../fixtures/users.json";

type DealRecord = Record<string, unknown> & {
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

const cloneDeal = (deal: DealRecord): DealRecord => ({
  ...deal,
  contact: deal.contact ? { ...deal.contact } : null,
  assignee: deal.assignee ? { ...deal.assignee } : null,
  creator: deal.creator ? { ...deal.creator } : null,
  appointments: Array.isArray(deal.appointments)
    ? [...(deal.appointments as unknown[])]
    : [],
});

describe("Deal Edit Dialog", () => {
  let dealsData: DealRecord[] = [];
  let usersData: UserRecord[] = [];

  const getAssignee = (assigneeId?: string | null) =>
    usersData.find((user) => user.id === assigneeId) || null;

  beforeEach(() => {
    // Setup authentication
    cy.login();

    dealsData = (dealsFixture as DealRecord[]).map((deal) => cloneDeal(deal));
    usersData = (usersFixture as UserRecord[]).map((user) => ({ ...user }));

    cy.intercept("GET", "**/api/deals*", (req) => {
      console.info("upper beforeEach [intercept] /api/deals hit", req.url);
      req.reply(dealsData);
    }).as("getDeals");

    cy.intercept("GET", /\/api\/deals\/[A-Za-z0-9-]+$/, (req) => {
      const dealId = req.url.split("/").pop();
      const deal = dealsData.find((item) => item.id === dealId);
      req.reply(deal || dealsData[0]);
    }).as("getDealById");

    cy.intercept("GET", "/api/deals/archived", []).as("getArchivedDeals");

    cy.intercept("GET", "/api/users", (req) => {
      req.reply(usersData);
    }).as("getUsers");

    cy.intercept("POST", "/api/deals", (req) => {
      const now = new Date().toISOString();
      const potentialValue = req.body?.potentialValue;
      const parsedPotentialValue =
        typeof potentialValue === "string"
          ? Number(potentialValue.replace(/[^0-9.]/g, ""))
          : (potentialValue ?? null);

      const newDeal: DealRecord = {
        id: `deal-${Date.now()}`,
        ...req.body,
        potentialValue: parsedPotentialValue,
        contact: req.body?.contact || null,
        assigneeId: req.body?.assigneeId || null,
        assignee: getAssignee(req.body?.assigneeId),
        creator: req.body?.creator || null,
        stage: req.body?.stage || "QUALIFIED",
        createdAt: now,
        updatedAt: now,
      };

      dealsData = [...dealsData, cloneDeal(newDeal)];

      req.reply({
        statusCode: 201,
        body: newDeal,
      });
    }).as("createDeal");

    cy.intercept("PUT", /\/api\/deals\/[A-Za-z0-9-]+$/, (req) => {
      const dealId = req.url.split("/").pop();
      const index = dealsData.findIndex((deal) => deal.id === dealId);
      const now = new Date().toISOString();

      if (index === -1) {
        req.reply({ statusCode: 404, body: { message: "Deal not found" } });
        return;
      }

      const potentialValue = req.body?.potentialValue;
      const parsedPotentialValue =
        typeof potentialValue === "string"
          ? Number(potentialValue.replace(/[^0-9.]/g, ""))
          : (potentialValue ?? dealsData[index]?.potentialValue ?? null);

      const updatedDeal: DealRecord = {
        ...dealsData[index],
        ...req.body,
        potentialValue: parsedPotentialValue,
        contact: {
          ...(dealsData[index]?.contact || {}),
          ...(req.body?.contact || {}),
        },
        assigneeId: req.body?.assigneeId || dealsData[index]?.assigneeId,
        assignee:
          getAssignee(req.body?.assigneeId) ||
          (dealsData[index]?.assignee as Record<string, unknown> | null) ||
          null,
        creator:
          (req.body?.creator as Record<string, unknown> | null | undefined) ??
          (dealsData[index]?.creator as Record<string, unknown> | null) ??
          null,
        updatedAt: now,
      };

      dealsData[index] = cloneDeal(updatedDeal);

      req.reply({
        statusCode: 200,
        body: updatedDeal,
      });
    }).as("updateDeal");

    cy.visit("/en/deals?disableSsr=on");
    cy.wait("@getDeals");
  });

  describe("Create Deal", () => {
    it("should create a new deal successfully", () => {
      // Open create dialog
      cy.get('[data-testid="create-deal-button"]').click();

      // Verify dialog is open
      cy.get('[role="dialog"]').should("be.visible");
      cy.contains("Create Deal").should("be.visible");

      // Fill form fields
      cy.get('[data-testid="title-input"]').type("Test Deal from Cypress");
      cy.get('[data-testid="product-input"]').type("Test Product");
      cy.get('[data-testid="potential-value-input"]').type("5_000");
      cy.get('[data-testid="name-input"]').type("Test Client");
      cy.get('[data-testid="email-input"]').type("test.client@example.com");
      cy.get('[data-testid="user-select"]').click();
      cy.get('[data-testid="user-option-user-1"]').click();
      cy.get('[data-testid="submit-button"]').click();
      cy.wait("@createDeal").its("response.statusCode").should("eq", 201);

      // Verify success
      cy.get('[role="dialog"]').should("not.exist");
      cy.contains("Test Deal from Cypress").should("exist");

      // Verify success notification
      cy.get('[data-testid="success-notification"]')
        .should("be.visible")
        .should("contain", "Deal created successfully");
    });

    it("should show validation errors for required fields", () => {
      cy.get('[data-testid="create-deal-button"]').click();

      // Try to submit without required fields
      cy.get('[data-testid="submit-button"]').click();

      // Check for validation errors
      cy.contains("Please enter the client's name.").should("be.visible");
      cy.get('[data-testid="name-input"]').should("have.attr", "required");

      // Dialog should still be open
      cy.get('[role="dialog"]').should("be.visible");
    });

    it("should close dialog when cancel is clicked", () => {
      cy.get('[data-testid="create-deal-button"]').click();

      cy.get('[role="dialog"]').should("be.visible");

      cy.get('[data-testid="cancel-button"]').click();

      cy.get('[role="dialog"]').should("not.exist");
    });

    it("should close dialog when close icon is clicked", () => {
      cy.get('[data-testid="create-deal-button"]').click();

      cy.get('[role="dialog"]').should("be.visible");

      cy.get('[aria-label="close"]').click();

      cy.get('[role="dialog"]').should("not.exist");
    });
  });

  describe("Update Deal", () => {
    beforeEach(function () {
      const now = new Date().toISOString();
      const seedDeal: DealRecord = {
        id: "deal-to-update",
        title: "Deal to Update",
        productInterest: "Original Product",
        potentialValue: 5000,
        stage: "QUALIFIED",
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

      dealsData = [
        ...dealsData.filter((deal) => deal.id !== seedDeal.id),
        cloneDeal(seedDeal),
      ];

      cy.wrap(seedDeal).as("testDeal");
    });

    it("should update an existing deal successfully", function () {
      cy.get<DealRecord>("@testDeal").then((deal) => {
        cy.get(`[data-testid="table-row-${deal.id}"]`)
          .find(`[data-testid="action-cell-button-${deal.id}"]`)
          .click();

        cy.get(`[data-testid="action-menu-${deal.id}-item-edit"]`).click();

        cy.wait("@getDealById");

        cy.get('[role="dialog"]').should("be.visible");
        cy.contains("Edit Deal").should("be.visible");

        cy.get('[data-testid="title-input"]').should(
          "have.value",
          "Deal to Update"
        );
        cy.get('[data-testid="product-input"]').should(
          "have.value",
          "Original Product"
        );
        cy.get('[data-testid="potential-value-input"]').should(
          "have.value",
          "5000"
        );

        cy.get('[data-testid="title-input"]')
          .clear()
          .type("Updated Deal Title");
        cy.get('[data-testid="product-input"]').clear().type("Updated Product");
        const newPotentialValue = 55555;
        cy.get('[data-testid="potential-value-input"]')
          .clear()
          .type(newPotentialValue.toString());

        cy.get('[data-testid="submit-button"]').click();

        cy.wait("@updateDeal").its("response.statusCode").should("eq", 200);

        cy.get('[role="dialog"]').should("not.exist");
        cy.contains("Updated Deal Title").should("be.visible");
        const formattedValue = currencyFormatter(newPotentialValue).replace(
          /\u00A0/g,
          " "
        );
        cy.log(formattedValue);
        cy.contains(formattedValue).should("be.visible");
      });
    });

    it("should show loading state while fetching deal data", function () {
      cy.get("@testDeal").then((testDeal) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deal = testDeal as any;
        // Intercept API call to simulate slow loading
        cy.intercept("GET", `/api/deals/${deal.id}`, {
          delay: 2000,
          body: deal,
        }).as("getDealById");

        cy.get(`[data-testid="table-row-${deal.id}"]`)
          .find(`[data-testid="action-cell-button-${deal.id}"]`)
          .click();

        cy.get(`[data-testid="action-menu-${deal.id}-item-edit"]`).click();

        // Verify loading state
        cy.get('[role="dialog"]').should("be.visible");
        cy.get('[data-testid="deal-loading-spinner"]').should("be.visible");

        // Wait for data to load
        cy.wait("@getDealById");

        // Verify form is populated
        cy.get('[data-testid="deal-loading-spinner"]').should("not.exist");
        cy.get('[data-testid="title-input"]').should("be.visible");
      });
    });

    it("should handle update errors gracefully", function () {
      cy.get("@testDeal").then((testDeal) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deal = testDeal as any;
        // Mock API error
        cy.intercept("PUT", `/api/deals/${deal.id}`, {
          statusCode: 500,
          body: { error: "Internal server error" },
        }).as("updateDealError");

        cy.get(`[data-testid="table-row-${deal.id}"]`)
          .find(`[data-testid="action-cell-button-${deal.id}"]`)
          .click();
        cy.get(`[data-testid="action-menu-${deal.id}-item-edit"]`).click();

        cy.get('[data-testid="title-input"]').clear().type("This will fail");

        cy.get('[data-testid="submit-button"]').click();

        cy.wait("@updateDealError");

        // Verify error handling
        cy.get('[data-testid="error-notification"]')
          .should("be.visible")
          .should("contain", "Failed to update deal");

        // Dialog should remain open
        cy.get('[role="dialog"]').should("be.visible");
      });
    });
  });

  describe("Form Interactions", () => {
    beforeEach(() => {
      cy.get('[data-testid="create-deal-button"]').click();
    });

    it("should handle form field interactions correctly", () => {
      // Close any open menus first
      cy.get('body').type('{esc}');
      cy.wait(500);

      // Test text input
      cy.get('[data-testid="title-input"]')
        .type("Test Deal Title")
        .should("have.value", "Test Deal Title");

      // Test number input
      cy.get('[data-testid="potential-value-input"]')
        .type("1500.50")
        .should("have.value", "1500.50");

      // Test autocomplete/select fields
      cy.get('[data-testid="user-select"]').click();
      cy.get('[role="presentation"]').find('[data-testid="user-option-user-1"]').click();
      cy.get('[data-testid="user-select"]').should("contain", "Test Client");

      // Skip stage selection test for now due to multiple element issue
      // TODO: Fix stage selection test
      cy.log("Stage selection test skipped due to multiple elements issue");
    });

    it("should handle appointments section", () => {
      // Add appointment
      cy.get('[data-testid="add-appointment-button"]').click();

      cy.get('[data-testid="appointment-note-0"]').type(
        "Initial meeting with client"
      );

      cy.get('[data-testid="appointment-datetime-input-0"]').type(
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
      cy.get('[data-testid="create-deal-button"]').click();
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

      cy.get("form").should("have.attr", "id", "deal-upsert-form");

      cy.get('[type="submit"]').should("have.attr", "form", "deal-upsert-form");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", () => {
      // Simulate network error
      cy.intercept("POST", "/api/deals", {
        forceNetworkError: true,
      }).as("networkError");

      cy.get('[data-testid="create-deal-button"]').click();

      cy.get('[data-testid="title-input"]').type("Network Error Test");
      cy.get('[data-testid="name-input"]').type("Test Client");
      cy.get('[data-testid="submit-button"]').click();

      cy.wait("@networkError");

      // Should show error message
      cy.get('[data-testid="error-notification"]')
        .should("be.visible")
        .should("contain", "Failed to create deal");

      // Dialog should remain open
      cy.get('[role="dialog"]').should("be.visible");
    });

    it("should handle validation errors from server", () => {
      cy.intercept("POST", "/api/deals", {
        statusCode: 400,
        body: {
          errors: {
            title: ["Title is required"],
            potentialValue: ["Must be a positive number"],
          },
        },
      }).as("validationError");

      cy.get('[data-testid="create-deal-button"]').click();

      cy.get('[data-testid="title-input"]').type("Network Error Test");
      cy.get('[data-testid="name-input"]').type("Test Client");

      cy.get('[data-testid="submit-button"]').click();

      cy.wait("@validationError");
      cy.wait(500);
      // Should display server validation errors in notifications
      cy.contains("Title is required").should("be.visible");
      cy.contains("Must be a positive number").should("be.visible");
    });
  });

  describe("Data Persistence", () => {
    it("should preserve form data when switching between fields", () => {
      cy.get('[data-testid="create-deal-button"]').click();

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
      cy.intercept("POST", "/api/deals", {
        statusCode: 400,
        body: { error: "Validation failed" },
      }).as("validationFailed");

      cy.get('[data-testid="create-deal-button"]').click();

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