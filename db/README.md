# Prisma ORM Database Schema for CRM

## Setup

**Initialization**
   Run the following command to initialize Prisma:
   ```bash
   npx prisma init
   ```

**Create Database & Run Migrations**
Run the migrations to create the database structure:
```bash
npm run migrate
```

**Generate Client**
Generate the Prisma client and copy the data to backend and frontend projects:
```bash
npm run generate
```

💡 Note:
After running `npm run generate`, the generated data is automatically copied to the backend and frontend projects.

Make sure the database connection in `prisma/schema.prisma` is configured correctly.

## Available Commands

### Database Management
- **`npm run migrate`** - Run database migrations in development mode. Creates and applies new migrations based on schema changes.
- **`npm run migrate:deploy`** - Deploy migrations to production database without generating new ones.
- **`npm run migrate:reset`** - Reset the database and apply all migrations from scratch (⚠️ **WARNING**: This will delete all data).
- **`npm run migrate:status`** - Check the status of migrations and see which ones are applied or pending.

### Development Tools
- **`npm run generate`** - Generate Prisma client and automatically copy it to frontend and backend projects.
- **`npm run studio`** - Open Prisma Studio (web-based database GUI) for viewing and editing data.
- **`npm run seed`** - Run database seeding script to populate the database with initial/test data.

### Code Quality
- **`npm run type-check`** - Run TypeScript type checking without emitting files.
- **`npm run lint`** - Run linting (currently not configured).
- **`npm run lint:check`** - Check linting status (currently not configured).

---

# ORM Prisma Datenbankschema für CRM

## Einrichtung

**Initialisierung**
   Führe den folgenden Befehl aus, um Prisma zu initialisieren:
   ```bash
   npx prisma init
   ```

**Datenbank erstellen & Migrationen durchführen**
Führe die Migrationen aus, um die Datenbankstruktur zu erstellen:
```bash
npm run migrate
```

**Client generieren**
Generiere den Prisma-Client und kopiere die Daten in die Backend- und Frontend-Projekte:
```bash
npm run generate
```

💡 Hinweis:
Nach `npm run generate` werden die generierten Daten automatisch in die Projekte backend und frontend kopiert.

Stelle sicher, dass die Datenbankverbindung in der `prisma/schema.prisma` korrekt konfiguriert ist.

## Verfügbare Befehle

### Datenbankverwaltung
- **`npm run migrate`** - Führe Datenbankmigrationen im Entwicklungsmodus aus. Erstellt und wendet neue Migrationen basierend auf Schemaänderungen an.
- **`npm run migrate:deploy`** - Setze Migrationen auf die Produktionsdatenbank ohne neue zu generieren.
- **`npm run migrate:reset`** - Setze die Datenbank zurück und wende alle Migrationen von Grund auf neu an (⚠️ **WARNUNG**: Dies löscht alle Daten).
- **`npm run migrate:status`** - Überprüfe den Status der Migrationen und sieh, welche angewendet oder ausstehend sind.

### Entwicklungstools
- **`npm run generate`** - Generiere Prisma-Client und kopiere ihn automatisch in Frontend- und Backend-Projekte.
- **`npm run studio`** - Öffne Prisma Studio (webbasiertes Datenbank-GUI) zum Anzeigen und Bearbeiten von Daten.
- **`npm run seed`** - Führe Datenbank-Seed-Script aus, um die Datenbank mit initialen/Testdaten zu füllen.

### Codequalität
- **`npm run type-check`** - Führe TypeScript-Typprüfung aus, ohne Dateien zu erzeugen.
- **`npm run lint`** - Führe Linting aus (derzeit nicht konfiguriert).
- **`npm run lint:check`** - Überprüfe Linting-Status (derzeit nicht konfiguriert).