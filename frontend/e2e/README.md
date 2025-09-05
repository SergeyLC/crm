
# Playwright E2E Tests (Frontend)

Kurze Anleitung zum Ausführen der End-to-end-Tests mit Playwright.

Wichtige Punkte
- Die `playwright.config.ts` enthält jetzt eine `webServer`-Konfiguration. Playwright versucht standardmäßig, den Dev-Server mit `npm run dev` zu starten und wartet auf `http://localhost:3000`.
- Wenn bereits ein Dev-Server läuft, wird dieser wiederverwendet (`reuseExistingServer: true`).
- Für spezielle Setups können Sie die Startkommando- und Basis-URL per Umgebungsvariablen überschreiben.

Schnellstart (empfohlen)
1. Wechseln Sie in das `frontend`-Verzeichnis:

```bash
cd frontend
```

2. Starten Sie die Tests. Playwright startet den Dev-Server automatisch (falls noch nicht gestartet):

```bash
npx playwright test
```

Einzeltest lokal ausführen

```bash
npx playwright test e2e/group-save.spec.ts --project=chromium --reporter=list
```

Overrides (optional)
- Wenn Ihr Dev-Server auf einer anderen URL/Port läuft, setzen Sie `PW_BASE_URL`. Beispiel:

```bash
PW_BASE_URL=http://localhost:3001 npx playwright test
```

- Um ein anderes Startkommando zu verwenden (z. B. `pnpm dev` oder mit speziellen ENV), setzen Sie `PLAYWRIGHT_DEV_COMMAND`:

```bash
PLAYWRIGHT_DEV_COMMAND='pnpm dev' npx playwright test
```

Tipps für CI
- Die `webServer`-Option ist praktisch für CI: stellen Sie sicher, dass im CI-Job zuerst `npm ci` (oder `pnpm install`) ausgeführt wird.
- Wenn Sie die Dev-Server-Startzeit verlängern müssen, passen Sie `webServer.timeout` in `playwright.config.ts` an.

Fehlersuche
- Wenn Tests nicht starten: prüfen Sie, ob `npm run dev` lokal im `frontend`-Ordner funktioniert.
- Für Debugging können Sie `--headed` und `--debug` an Playwright übergeben:

```bash
npx playwright test --headed --debug
```

Mehr Informationen
- `playwright.config.ts` befindet sich im `frontend`-Ordner und enthält die `webServer`-Konfiguration sowie Projekt-/Browseroptionen.

