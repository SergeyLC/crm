# LoyaCareCRM

*🇩🇪 Deutsch | [🇺🇸 English](README.md)*

## 📋 Projektbeschreibung

LoyaCareCRM ist ein modernes Customer Relationship Management (CRM) System, das auf modularer Architektur basiert. Das System ist für die Verwaltung von Leads, Deals, Kontakten und Benutzern mit einer intuitiven Benutzeroberfläche basierend auf Kanban-Boards und Tabellen konzipiert.

## 🏗️ Projektarchitektur

Das Projekt besteht aus drei Hauptteilen:

```
LoyaCRM/
├── frontend/     # Next.js 15 + React 18 Anwendung
├── backend/      # Express.js + TypeScript API
└── db/           # Prisma ORM + PostgreSQL Schema
```

## 🚀 Technologie-Stack

### Frontend
- **React 18** - Bibliothek für Benutzeroberflächen
- **Next.js 15** - React-Framework für Produktion
- **TypeScript** - statische Typisierung
- **Material-UI v7** - UI-Komponentenbibliothek
- **Redux Toolkit + RTK Query** - Zustandsverwaltung und API
- **@dnd-kit** - Drag & Drop Funktionalität für Kanban
- **React Hook Form + Yup** - Formularverwaltung und Validierung
- **Storybook** - Komponentenentwicklung und Dokumentation

### Backend
- **Node.js** - Server-Laufzeitumgebung
- **Express.js** - Web-Framework
- **TypeScript** - statische Typisierung
- **Prisma ORM** - Datenbankinteraktion
- **JWT** - Authentifizierung und Autorisierung
- **bcrypt** - Passwort-Hashing
- **UUID** - Generierung eindeutiger Kennungen

### Datenbank
- **PostgreSQL** - relationale Datenbank
- **Prisma** - modernes ORM für TypeScript

## 🏛️ Frontend-Architektur (Feature-Sliced Design)

Das Projekt verwendet **Feature-Sliced Design** Architektur für Skalierbarkeit und Wartbarkeit:

```
frontend/src/
├── app/                    # Anwendungskonfiguration (Next.js App Router)
├── entities/               # Geschäftsentitäten
│   ├── deal/              # Deals
│   ├── lead/              # Leads  
│   ├── contact/           # Kontakte
│   ├── user/              # Benutzer
│   ├── kanban/            # Kanban-Komponenten
│   ├── appointment/       # Termine
│   └── note/              # Notizen
├── features/              # Funktionale Fähigkeiten
│   ├── auth/              # Authentifizierung
│   ├── deal/              # Deal-Verwaltung
│   ├── lead/              # Lead-Verwaltung
│   ├── user/              # Benutzerverwaltung
│   ├── BaseTable/         # Universelle Tabellen
│   ├── kanban/            # Kanban-Funktionalität
│   └── app/               # Gemeinsame App-Funktionen
├── shared/                # Wiederverwendbare Ressourcen
│   ├── ui/                # UI-Komponenten
│   ├── lib/               # Hilfsprogramme und Hooks
│   ├── config/            # Konfiguration
│   └── theme/             # Material-UI Theme
└── stories/               # Storybook Stories
```

## 🗄️ Datenmodell

### Hauptentitäten:

- **User** - Systembenutzer (Administratoren und Mitarbeiter)
- **Contact** - Kundenkontaktinformationen
- **Deal** - Deals mit verschiedenen Phasen und Status
- **Note** - Deal-Notizen
- **Appointment** - Meetings und Anrufe

### Deal-Phasen:
- `LEAD` - Lead
- `QUALIFIED` - Qualifiziert
- `CONTACTED` - Kontaktiert
- `DEMO_SCHEDULED` - Demo geplant
- `PROPOSAL_SENT` - Angebot gesendet
- `NEGOTIATION` - Verhandlung
- `WON` - Gewonnen
- `LOST` - Verloren

## 🎯 Hauptfunktionen

### 1. Deal-Verwaltung
- **Kanban-Board** für visuelle Deal-Verwaltung
- **Tabellen** mit Sortierung, Filterung und Massenoperationen
- **Drag & Drop** Verschieben von Deals zwischen Phasen
- **Archivierung** und Wiederherstellung von Deals
- **Massenoperationen** (Archivierung, Wiederherstellung)

### 2. Authentifizierungssystem
- JWT-basierte Authentifizierung
- Benutzerrollen (ADMIN, EMPLOYEE)
- Geschützte Routen

### 3. Interaktive Komponenten
- **BaseTable** - universelle Tabelle mit Auswahl, Sortierung und Aktionen
- **Kanban Board** - mit Drag & Drop und visueller Rückmeldung
- **Responsive Design** für verschiedene Geräte

### 4. UX/UI-Funktionen
- **Dunkles/helles Theme** Material-UI
- **Semantische Farben** für verschiedene Aktionen (Gewinn - grün, Verlust - rot)
- **Animationen und Übergänge** für verbesserte Benutzererfahrung
- **Visuelle Rückmeldung** bei Drag & Drop Operationen

## 🛠️ Installation und Setup

### Voraussetzungen
- Node.js 18+
- PostgreSQL
- npm oder yarn

### 1. Repository klonen
```bash
git clone <repository-url>
cd LoyaCRM
```

### 2. Abhängigkeiten installieren

#### Datenbank
```bash
cd db
npm install
```

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Umgebungsvariablen einrichten

`.env` Dateien in den entsprechenden Verzeichnissen erstellen:

#### db/.env
```env
DATABASE_URL="postgresql://username:password@localhost:5432/loyacrm"
```

#### backend/.env
```env
DATABASE_URL="postgresql://username:password@localhost:5432/loyacrm"
JWT_SECRET="your-jwt-secret"
PORT=4000
```

### 4. Datenbank-Initialisierung
```bash
cd db
npx prisma migrate dev
npx prisma db seed  # falls Seed-Skript vorhanden
```

### 5. Projekt ausführen

#### Entwicklungsmodus (alle Services gleichzeitig)
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

#### Produktions-Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

## 📚 Zusätzliche Befehle

### Storybook (Frontend)
```bash
cd frontend
npm run storybook
```

### Datenbank
```bash
cd db
npx prisma studio          # Datenbank-GUI
npx prisma generate         # Prisma Client generieren
npx prisma migrate reset    # Migrationen zurücksetzen
```

### Linting und Formatierung
```bash
cd frontend
npm run lint
npm run lint:fix
```

### Qualitätsprüfungen
```bash
# Pre-push Hook manuell testen
./test-pre-push.sh

# Einzelne Prüfungen ausführen
cd frontend && npm run type-check && npm run lint:check
cd backend && npm run type-check && npm run lint:check
```

## 🛡️ Pre-push Qualitätsprüfungen

Das Projekt enthält automatische Qualitätsprüfungen, die vor jedem `git push` ausgeführt werden:

### Was wird geprüft:
- **Frontend TypeScript-Kompilierung** (`npm run type-check`)
- **Frontend ESLint-Validierung** (`npm run lint:check`)
- **Backend TypeScript-Kompilierung** (`npm run type-check`)
- **Backend ESLint-Validierung** (`npm run lint:check`)

### Wie es funktioniert:
- Pre-push Hook läuft automatisch bei jedem `git push`
- Bei fehlgeschlagenen Prüfungen wird der Push blockiert
- Farbige Ausgabe zeigt den Status jeder Prüfung
- Alle Prüfungen müssen bestehen, damit der Push fortgesetzt wird

### Manuelles Testen:
```bash
# Pre-push Hook manuell testen
.git/hooks/pre-push

# Oder das bequeme Skript verwenden
./test-pre-push.sh
```

### Prüfungen überspringen (nicht empfohlen):
```bash
# Push ohne Prüfungen (Hook umgehen)
git push --no-verify
```

## 🔗 API-Endpunkte

### Authentifizierung
- `POST /api/auth/login` - Anmeldung
- `POST /api/auth/register` - Registrierung (nur Admin)
- `POST /api/auth/logout` - Abmeldung

### Deals
- `GET /api/deals` - Deal-Liste abrufen
- `POST /api/deals` - Deal erstellen
- `PUT /api/deals/:id` - Deal aktualisieren
- `DELETE /api/deals/:id` - Deal löschen

### Benutzer
- `GET /api/users` - Benutzer abrufen
- `POST /api/users` - Benutzer erstellen
- `PUT /api/users/:id` - Benutzer aktualisieren

## 🎨 Theme-Anpassung

Das Projekt unterstützt Anpassung über Material-UI Theme:

```typescript
// src/shared/theme/index.ts
export const lightThemeOptions: ThemeOptions = {
  palette: {
    primary: { main: '#1976d2' },
    dropZone: {
      main: 'rgba(25, 118, 210, 0.1)',
      light: 'rgba(25, 118, 210, 0.05)',
    },
    // ...
  }
}
```

## 🧪 Testing

```bash
cd frontend
npm run test
npm run test:coverage
```

## 📦 Deployment

### Docker (falls konfiguriert)
```bash
docker-compose up -d
```

### Vercel (Frontend)
```bash
cd frontend
vercel deploy
```

## 🤝 Mitwirken

1. Projekt forken
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Zum Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request öffnen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 👥 Team

- **Entwickler:** Sergey Daub (sergeydaub@gmail.com)
- **Architekt:** Sergey Daub (sergeydaub@gmail.com)

## 🐛 Bekannte Probleme

- [ ] Leistungsoptimierung für große Tabellen
- [ ] Hinzufügung von Echtzeit-Benachrichtigungen
- [ ] Verbesserungen der mobilen Version

## 🔮 Roadmap

- [ ] Integration mit externen CRM-Systemen
- [ ] Analytics und Berichte
- [ ] Mobile Anwendung
- [ ] Integrations-API
- [ ] Erweiterte Zugriffsberechtigungen
