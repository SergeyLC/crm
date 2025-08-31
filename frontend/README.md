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
