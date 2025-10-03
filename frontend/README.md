# Frontend-Teil / Frontend Part – CRM

**Architektur / Architecture:** Feature-Slice-Design  
**Technologien / Tech Stack:** Next.js, TypeScript, React, RTK Query  

## Prisma Client  
Im Ordner `generated/prisma-client` befinden sich die generierten Dateien für den **Prisma Client**.  
Diese werden benötigt, um die **Datentypen (Types)** für die **Entities** aus der Datenbank zu erhalten.  

## Daten generieren / Generate Data Types  
Um neue Typdefinitionen zu erstellen oder bestehende zu aktualisieren, bitte im **DB**-Projekt folgenden Befehl ausführen:  

```bash
npm run generate
```

💡 Hinweis / Note:
Der prisma-client wird automatisch aus dem Datenbankschema erstellt. Änderungen am Schema erfordern das erneute Ausführen des obigen Befehls.

## Development

1. Install dependencies
2. Run the development server

```bash
npm install
npm run dev
```

### Routing Architecture

The application is fully migrated to the Next.js **App Router** (`src/app`). The former `pages/` directory (and its placeholder `_app.tsx`) was removed after debugging a build failure (React error #130 originating from an empty legacy `_app`).

Guidelines:
- Place all routes (UI + API) inside `src/app`.
- Use `app/not-found.tsx` and `app/error.tsx` for error boundary & 404 handling.
- Shared layout / global providers live in `app/layout.tsx` (Redux, Auth, i18n, Sidebar).
- Do NOT reintroduce a `pages/` directory; mixing routers increases bundle size & complexity.

If you ever need to add legacy pages (not recommended), ensure a proper `_app.tsx` is defined—otherwise keep relying solely on the App Router.

### Component-local locales

You can colocate small i18n JSON files next to a component or feature instead of editing the central `src/locales` directory.

- Place locale files under a `locales/` folder next to the component, for example:
	- `src/features/group/ui/locales/en.json`
	- `src/features/group/ui/locales/de.json`

- During development and CI the repository runs a small collector script that discovers these folders and generates a consolidated TypeScript module at `src/locales/generated_i18n.ts`.

- The collector script is available at `scripts/collect-locales.js` and is wired into `predev`/`prebuild` so it runs automatically before `next dev` / `next build`.

- The generated module exports:
	- `default` — a language → namespace → payload object used by the app at runtime
	- `generatedNS` — an ordered list of namespaces discovered by the collector

- At app initialization `src/i18n.ts` imports the generated payloads and deep-merges them into the central `resources` object. Deep merge is used so component-local JSON can add or override only specific nested keys without clobbering existing entries from central locale files.

Notes & recommendations:
- Prefer small, component-scoped JSONs for UI text that belongs to a single feature.
- If a key exists both in the central `src/locales/*` file and in a component-local file, the collector + deep-merge strategy preserves nested keys (component entries merge into the namespace). If you want a different override priority, update `scripts/collect-locales.js` to change merge order.
- Generated files (e.g. `src/locales/generated_i18n.ts`) are committed by the collector during local dev for convenience; CI also runs the collector to ensure the file is present on build agents.

## Testing Infrastructure

### Overview

The application includes comprehensive testing infrastructure with:
- **Jest** (v30.0.5) - Unit testing framework with TypeScript support
- **React Testing Library** (v16.3.0) - Component testing utilities  
- **Cypress** (v15.3.0) - End-to-end testing framework
- **Code Coverage** - Detailed coverage reporting

### Available Test Commands

```bash
# Jest Unit Tests
npm test                    # Run all Jest tests
npm run test:watch          # Jest in watch mode
npm run test:lead-dialog    # Test specific component
npm run test:coverage       # Generate coverage report

# Cypress E2E Tests  
npm run cypress:open        # Open Cypress UI
npm run cypress:run         # Run all E2E tests headless
npm run cypress:demo        # Run demo tests (no server required)
npm run test:e2e:open       # Open E2E testing interface
```

### Test Structure

Following FSD architecture, tests are co-located with components:

```
src/features/lead/ui/__tests__/
├── LeadEditDialog.basic.test.tsx    # ✅ Working basic tests (4 tests)
├── LeadEditDialog.test.tsx          # 🚧 Comprehensive tests (disabled)

cypress/e2e/
├── demo-cypress.cy.ts               # ✅ Working demo tests (3 tests)
├── lead-management.cy.ts            # 📋 Full E2E scenarios (needs server)
└── lead-edit-dialog.cy.ts          # 📋 Component-specific E2E tests
```

### Configuration Files

- `jest.config.cjs` - Jest configuration with TypeScript transforms
- `cypress.config.ts` - Cypress E2E configuration  
- `src/shared/lib/__tests__/setupTests.ts` - Global test setup and mocks
- `src/shared/lib/__tests__/test-utils.ts` - Testing utilities with providers

### Current Status

✅ **Working**: 
- Jest: 4 test suites, 26 tests passing
- Cypress: 3 demo tests passing  
- Coverage reporting functional
- TypeScript support in all tests

🚧 **In Progress**: Complex component mocking for comprehensive tests  
📋 **Planned**: Full E2E test implementation (requires running server)

### Key Features

- TypeScript support in all tests
- Mock implementations for auth, i18n, and Material-UI
- Provider wrappers for TanStack Query and theme testing
- Code coverage reports with detailed metrics
- Both unit and E2E testing capabilities
- FSD-compliant test organization

**Note**: Component testing was initially attempted but disabled due to Next.js/Material-UI compatibility issues with Cypress component testing. Focus shifted to robust Jest unit tests and Cypress E2E tests.
