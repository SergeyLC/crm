# 🚀 CRM Deployment-Leitfaden

*Vollständige Deployment-Anleitung für CRM-System*

*[[🇺🇸 English](DEPLOYMENT.md) | 🇩🇪 Deutsch*

## 📋 Deployment-Optionen

CRM unterstützt mehrere Deployment-Methoden:

### 🐳 **Docker Deployment (Empfohlen)**
- **Entwicklung**: Lokale Entwicklung mit Hot Reload
- **Produktion**: Containerisierte Produktionsumgebung
- **CI/CD**: Automatisierte Bereitstellung via GitHub Actions

### 🖥️ **Traditionelle Server-Installation**
- Manuelle Ubuntu-Server-Einrichtung mit PM2, Nginx, PostgreSQL
- Geeignet für benutzerdefinierte Server-Konfigurationen

---

## 🐳 Docker Deployment

### Voraussetzungen

#### Systemanforderungen
- **Docker**: Version 24.0+
- **Docker Compose**: Version 2.0+
- **Git**: Neueste Version
- **4GB RAM minimum** (8GB empfohlen)
- **2GB freier Festplattenspeicher**

#### Installation
```bash
# Docker installieren (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose installieren (v2 plugin)
# Docker Compose v2 kommt als Plugin mit Docker
# Falls nicht enthalten, separat installieren:
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Installation überprüfen
docker --version
docker compose version
```

### 🚀 Schnellstart mit Docker

#### 1. Repository klonen
```bash
git clone <your-repository-url> crm
cd crm
```

#### 2. Entwicklungsumgebung einrichten
```bash
# Entwicklungsumgebungsdatei kopieren
cp .env.dev.example .env.dev

# Entwicklungsumgebung starten
docker compose -f docker-compose.dev.yml up --build -d

# Container-Status prüfen
docker compose -f docker-compose.dev.yml ps

# Logs anzeigen
docker compose -f docker-compose.dev.yml logs -f
```

#### 3. Produktionsumgebung einrichten
```bash
# Produktionsumgebungsdateien kopieren
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend

# Umgebungsvariablen bearbeiten
nano .env.backend  # Datenbank und Secrets konfigurieren
nano .env.frontend # API-URLs konfigurieren

# Produktionsumgebung starten
docker compose up --build -d

# Status prüfen
docker compose ps
```

### 🌐 Zugriffs-URLs

| Umgebung | Frontend | Backend API | Datenbank |
|----------|----------|-------------|-----------|
| **Entwicklung** | http://localhost:3003 | http://localhost:4003/api | localhost:5435 |
| **Produktion** | http://localhost:3002 | http://localhost:4002/api | Externe PostgreSQL |

### 🔧 Docker-Verwaltungsbefehle

#### Entwicklungsumgebung
```bash
# Entwicklungscontainer starten
docker compose -f docker-compose.dev.yml up -d

# Entwicklungscontainer stoppen
docker compose -f docker-compose.dev.yml down

# Neu bauen und neu starten
docker compose -f docker-compose.dev.yml up --build --force-recreate

# Logs anzeigen
docker compose -f docker-compose.dev.yml logs -f [service-name]

# Container-Shell zugreifen
docker compose -f docker-compose.dev.yml exec [service-name] sh
```

#### Produktionsumgebung
```bash
# Produktionscontainer starten
docker compose up -d

# Produktionscontainer stoppen
docker compose down

# Aktualisieren und neu starten
docker compose pull && docker compose up -d

# Logs anzeigen
docker compose logs -f [service-name]
```

### 📊 Überwachung und Fehlerbehebung

#### Container-Zustand prüfen
```bash
# Alle Container auflisten
docker ps -a

# Container-Logs prüfen
docker logs crm-backend-dev
docker logs crm-frontend-dev

# Ressourcennutzung prüfen
docker stats

# Container inspizieren
docker inspect crm-postgres-dev
```

#### Datenbank-Operationen
```bash
# PostgreSQL in Entwicklung zugreifen
docker compose -f docker-compose.dev.yml exec postgres psql -U crm -d crm

# Datenbank-Migrationen ausführen
docker compose -f docker-compose.dev.yml exec backend sh -c "cd backend && pnpm prisma migrate deploy"

# Entwicklungsdatenbank zurücksetzen
docker compose -f docker-compose.dev.yml down -v  # Volumes entfernen
docker compose -f docker-compose.dev.yml up -d   # Neu mit frischen Daten erstellen
```

#### Häufige Probleme

**Port-Konflikte:**
```bash
# Prüfen, was Ports verwendet
sudo lsof -i :3003
sudo lsof -i :4003
sudo lsof -i :5435

# Ports in docker-compose-Dateien ändern falls nötig
```

**Berechtigungsprobleme:**
```bash
# Docker-Berechtigungen reparieren
sudo usermod -aG docker $USER
newgrp docker
```

**Build-Fehler:**
```bash
# Docker-Cache leeren
docker system prune -a

# Ohne Cache neu bauen
docker compose build --no-cache
```

### 🔄 Updates und Wartung

#### Anwendung aktualisieren
```bash
# Neueste Änderungen ziehen
git pull origin main

# Entwicklungsumgebung aktualisieren
docker compose -f docker-compose.dev.yml up --build -d

# Produktionsumgebung aktualisieren
docker compose down
docker compose pull
docker compose up -d
```

#### Datenbank sichern (Entwicklung)
```bash
# Backup erstellen
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U crm crm > backup_$(date +%Y%m%d).sql

# Backup wiederherstellen
docker compose -f docker-compose.dev.yml exec -T postgres psql -U crm crm < backup_20241201.sql
```

### 🔒 Sicherheitsüberlegungen

#### Umgebungsvariablen
- `.env`-Dateien niemals im Repository committen
- Starke Passwörter für Datenbank verwenden
- JWT-Secrets regelmäßig rotieren
- Verschiedene Secrets für dev/prod-Umgebungen verwenden

#### Produktionssicherheit
```bash
# Sicherheits-Scan ausführen
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock clair-scanner [image-name]

# Basis-Images regelmäßig aktualisieren
docker-compose build --pull

# Secrets-Management verwenden
# Docker-Secrets oder externe Secret-Manager in Betracht ziehen
```

### 📋 Docker Deployment-Checkliste

**Entwicklungs-Setup:**
- [ ] Docker und Docker Compose installiert
- [ ] Repository geklont
- [ ] `.env.dev` konfiguriert
- [ ] Entwicklungscontainer laufen
- [ ] Frontend zugänglich unter http://localhost:3003
- [ ] Backend API antwortet unter http://localhost:4003/api
- [ ] Datenbank zugänglich unter localhost:5435
- [ ] Hot Reload funktioniert für Code-Änderungen

**Produktions-Setup:**
- [ ] Produktionsumgebungsdateien konfiguriert
- [ ] Externe PostgreSQL-Datenbank bereit
- [ ] Domain/DNS konfiguriert
- [ ] SSL-Zertifikate erhalten
- [ ] Produktionscontainer deployed
- [ ] Anwendung über Domain zugänglich
- [ ] Überwachung und Logging konfiguriert

---

## 🖥️ Traditionelle Ubuntu-Server-Installation

### 1. System-Update
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Benötigte Pakete installieren
```bash
sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### 3. Node.js Installation (Version 24+)
```bash
# Node.js 24 über NodeSource-Repository installieren
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation überprüfen
node --version  # Sollte v24.x.x anzeigen
pnpm --version  # Sollte neueste pnpm-Version anzeigen

# Optional: nvm für Versionsverwaltung installieren
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24
nvm alias default 24
```

### 4. Node.js-Installation überprüfen
```bash
# Versionsüberprüfungsskript ausführen
./check-node-version.sh
```

### 5. PM2 Prozess-Manager
```bash
sudo pnpm add -g pm2
```

## 🗄️ PostgreSQL Installation und Konfiguration

### 1. PostgreSQL installieren
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 2. PostgreSQL konfigurieren
```bash
# Starten und Autostart aktivieren
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Benutzer und Datenbank erstellen
sudo -u postgres psql
```

In der PostgreSQL-Konsole ausführen:
```sql
CREATE USER crm WITH PASSWORD 'your_strong_password';
CREATE DATABASE crm OWNER crm;
GRANT ALL PRIVILEGES ON DATABASE crm TO crm;
\q
```

### 3. PostgreSQL-Zugriff konfigurieren
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```
Finden und auskommentieren/ändern:
```
listen_addresses = 'localhost'
```

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```
Zeile hinzufügen:
```
local   crm         crm                                 md5
```

```bash
sudo systemctl restart postgresql
```

## 🟢 Node.js und pnpm Installation

### 1. Node.js 24+ über NodeSource installieren
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. pnpm installieren
```bash
sudo npm install -g pnpm
```

### 3. Installation überprüfen
```bash
node --version
pnpm --version
```

### 4. PM2 für Prozessverwaltung installieren
```bash
sudo pnpm add -g pm2
```

## 🌐 Nginx Installation und Konfiguration

### 1. Nginx installieren
```bash
sudo apt install -y nginx
```

### 2. Starten und Autostart aktivieren
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 📁 Anwendungs-Deployment

### 1. Repository klonen
```bash
cd /var/www/
sudo git clone <your-repository-url> crm
sudo chown -R $USER:$USER /var/www/crm
cd crm
```

### 2. Umgebungsvariablen konfigurieren

#### Datenbank:
```bash
cd db
nano .env
```
Inhalt der `.env`:
```env
DATABASE_URL="postgresql://crm:your_strong_password@localhost:5432/crm"
```

#### Backend:
```bash
cd ../backend
nano .env
```
Inhalt der `.env`:
```env
DATABASE_URL="postgresql://crm:your_strong_password@localhost:5432/crm"
JWT_SECRET="your_super_secret_jwt_key_here"
PORT=4000
NODE_ENV=production
```

#### Frontend:
```bash
cd ../frontend
nano .env.local
```
Inhalt der `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://your-server-ip:4000
```

### 3. Abhängigkeiten installieren und Datenbank initialisieren

#### Datenbank:
```bash
cd /var/www/crm/db
pnpm install
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm run generate
```

#### Backend:
```bash
cd ../backend
pnpm install
pnpm run build
```

#### Frontend:
```bash
cd ../frontend
pnpm install
pnpm run build
```

## 🚀 Services mit PM2 starten

### 1. PM2-Konfiguration erstellen
```bash
cd /var/www/crm
nano ecosystem.config.js
```

Inhalt der `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      cwd: './backend',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'crm-frontend',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
```

### 2. Anwendungen starten
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
⚠️ **Wichtig:** Führen Sie den Befehl aus, den `pm2 startup` ausgibt.

## 🌐 Nginx als Reverse Proxy konfigurieren

### 1. Site-Konfiguration erstellen
```bash
sudo nano /etc/nginx/sites-available/crm
```

Konfigurationsinhalt:
```nginx
server {
    listen 80;
    server_name your-domain.com your-server-ip;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js statische Dateien
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 2. Site aktivieren
```bash
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL-Konfiguration (Optional aber empfohlen)

### 1. Certbot installieren
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. SSL-Zertifikat erhalten
```bash
sudo certbot --nginx -d your-domain.com
```

## 🛡️ Firewall-Konfiguration

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 🔧 Verwaltungsskripte erstellen

### 1. Anwendungs-Update-Skript
```bash
sudo nano /usr/local/bin/crm-update.sh
```

Inhalt:
```bash
#!/bin/bash
cd /var/www/crm

echo "Repository wird aktualisiert..."
git pull origin main

echo "Datenbank wird aktualisiert..."
cd db
pnpm run generate

echo "Backend wird erstellt..."
cd ../backend
pnpm install --prod
pnpm run build

echo "Frontend wird erstellt..."
cd ../frontend
pnpm install --prod
pnpm run build

echo "Services werden neu gestartet..."
pm2 restart all

echo "Update abgeschlossen!"
```

```bash
sudo chmod +x /usr/local/bin/crm-update.sh
```

### 2. Überwachungsskript
```bash
sudo nano /usr/local/bin/crm-status.sh
```

Inhalt:
```bash
#!/bin/bash
echo "=== PM2 Status ==="
pm2 status

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager

echo "=== PostgreSQL Status ==="
sudo systemctl status postgresql --no-pager

echo "=== Festplattennutzung ==="
df -h /var/www/crm
```

```bash
sudo chmod +x /usr/local/bin/crm-status.sh
```

## 📊 Deployment-Überprüfung

### 1. Service-Status prüfen
```bash
# PM2-Status
pm2 status

# Nginx-Status
sudo systemctl status nginx

# PostgreSQL-Status
sudo systemctl status postgresql

# Port-Überprüfung
sudo netstat -tlnp | grep -E ':3000|:4000|:5432|:80'
```

### 2. Logs überprüfen
```bash
# PM2-Logs
pm2 logs

# Nginx-Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Verfügbarkeit testen
```bash
# Backend-API prüfen
curl http://localhost:4000/api/health

# Frontend prüfen
curl http://localhost:3000
```

## 🔄 Automatisches Backup einrichten

### 1. Backup-Skript erstellen
```bash
sudo nano /usr/local/bin/crm-backup.sh
```

Inhalt:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/crm"
DATE=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR

# Datenbank-Backup
pg_dump -h localhost -U crm crm > "$BACKUP_DIR/db_backup_$DATE.sql"

# Code-Backup (ohne node_modules)
tar --exclude='node_modules' --exclude='.git' -czf "$BACKUP_DIR/code_backup_$DATE.tar.gz" /var/www/crm

# Alte Backups entfernen (älter als 7 Tage)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup abgeschlossen: $DATE"
```

```bash
sudo chmod +x /usr/local/bin/crm-backup.sh
```

### 2. Automatisches Backup einrichten
```bash
# Zu crontab für tägliches Backup hinzufügen
sudo crontab -e
```

Zeile hinzufügen:
```
0 2 * * * /usr/local/bin/crm-backup.sh
```

## 📝 Abschließende Überprüfungsbefehle

```bash
# Alle Services überprüfen
crm-status.sh

# Verfügbarkeit überprüfen
echo "Im Browser öffnen: http://your-server-ip"
echo "API verfügbar unter: http://your-server-ip/api"
```

## 🔧 Nützliche Verwaltungsbefehle

### PM2-Service-Verwaltung
```bash
# Alle Services neu starten
pm2 restart all

# Services stoppen
pm2 stop all

# Services starten
pm2 start all

# Logs anzeigen
pm2 logs crm-backend
pm2 logs crm-frontend

# Echtzeit-Überwachung
pm2 monit
```

### System-Verwaltung
```bash
# Anwendung aktualisieren
crm-update.sh

# Status überprüfen
crm-status.sh

# Backup
crm-backup.sh

# Nginx neu starten
sudo systemctl restart nginx

# PostgreSQL neu starten
sudo systemctl restart postgresql
```

### Problemdiagnose
```bash
# System-Logs überprüfen
sudo journalctl -u nginx
sudo journalctl -u postgresql

# Ressourcennutzung überprüfen
htop
df -h
free -h

# Netzwerkverbindungen überprüfen
sudo netstat -tlnp
sudo ss -tlnp
```

## 🚨 Fehlerbehebung

### Datenbankprobleme
```bash
# PostgreSQL-Verbindung überprüfen
sudo -u postgres psql -c "\l"

# Benutzer überprüfen
sudo -u postgres psql -c "\du"

# PostgreSQL neu starten
sudo systemctl restart postgresql
```

### Node.js-Anwendungsprobleme
```bash
# Detaillierte PM2-Logs
pm2 logs --lines 50

# Spezifische Anwendung neu starten
pm2 restart crm-backend
pm2 restart crm-frontend

# Vollständigen PM2-Neustart
pm2 kill
pm2 start ecosystem.config.js
```

### Nginx-Probleme
```bash
# Konfiguration überprüfen
sudo nginx -t

# Konfiguration neu laden
sudo nginx -s reload

# Fehler-Logs überprüfen
sudo tail -f /var/log/nginx/error.log
```

## 📋 Deployment-Checkliste

- [ ] Ubuntu System aktualisiert
- [ ] PostgreSQL installiert und konfiguriert
- [ ] Datenbank und Benutzer erstellt
- [ ] Node.js 24+ installiert
- [ ] pnpm installiert
- [ ] PM2 installiert
- [ ] Nginx installiert und konfiguriert
- [ ] Repository geklont
- [ ] Umgebungsvariablen konfiguriert
- [ ] pnpm-Abhängigkeiten installiert
- [ ] Datenbank-Migrationen ausgeführt
- [ ] Produktions-Builds erstellt
- [ ] PM2-Ecosystem konfiguriert
- [ ] PM2-Services gestartet
- [ ] Nginx-Proxy konfiguriert
- [ ] SSL konfiguriert (optional)
- [ ] Firewall konfiguriert
- [ ] Verwaltungsskripte erstellt
- [ ] Backup konfiguriert
- [ ] Funktionalität überprüft
- [ ] Verfügbarkeit getestet

## 📞 Support

Bei Problemen:
1. Logs überprüfen: `pm2 logs`
2. Service-Status überprüfen: `crm-status.sh`
3. Nginx-Konfiguration überprüfen: `sudo nginx -t`
4. Entwickler kontaktieren: sergeydaub@gmail.com

---

## 🚀 GitHub Actions CI/CD Setup

### Übersicht
Diese Anleitung behandelt die automatisierte Bereitstellung mit GitHub Actions für Continuous Integration und Deployment (CI/CD).

### Voraussetzungen
- Zugriff auf GitHub-Repository
- Server mit SSH-Zugriff
- Konfigurierte Repository-Geheimnisse

### Erforderliche GitHub-Geheimnisse
In Ihren Repository-Einstellungen (`Settings` → `Secrets and variables` → `Actions`) diese Geheimnisse hinzufügen:

#### SSH-Zugriff:
- `SERVER_HOST` - Server-IP-Adresse oder Domain
- `SERVER_USER` - Server-Benutzername (normalerweise `root` oder Ihr Benutzername)
- `SERVER_SSH_KEY` - Privater SSH-Schlüssel für Server-Zugriff

#### Umgebungsvariablen:
- `DATABASE_URL` - Produktions-Datenbank-Verbindungs-URL
- `JWT_SECRET` - JWT-Geheimschlüssel
- `NEXT_PUBLIC_BACKEND_API_URL` - Backend-API-URL für Produktion

### Server-Vorbereitung

#### 1. Abhängigkeiten installieren
```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js 24+ installieren
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm installieren
sudo npm install -g pnpm

# PM2 installieren
sudo pnpm add -g pm2

# Log-Verzeichnis erstellen
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

#### 2. PostgreSQL einrichten
```bash
# PostgreSQL installieren
sudo apt install postgresql postgresql-contrib -y

# Datenbank und Benutzer erstellen
sudo -u postgres psql
CREATE DATABASE crm;
CREATE USER crm_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE crm TO crm_user;
\q
```

#### 3. Repository klonen
```bash
sudo mkdir -p /var/www
cd /var/www
git clone https://github.com/your-username/CRM.git crm
cd crm
```

#### 4. Umgebungsvariablen konfigurieren
Erstellen Sie `.env`-Dateien auf dem Server:

**`/var/www/crm/backend/.env`:**
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://crm_user:your_secure_password@localhost:5432/crm"
JWT_SECRET="your_jwt_secret_here"
USE_MOCK=false
```

**`/var/www/crm/frontend/.env.local`:**
```bash
NODE_ENV=production
NEXT_PUBLIC_BACKEND_API_URL="https://your-domain.com/api"
```

### GitHub Actions Workflow

Die Workflow-Datei `.github/workflows/deploy-production.yml` ist bereits konfiguriert und wird:

1. **Code-Validierung** - Linting und Typ-Prüfung ausführen
2. **Anwendungs-Build** - Frontend und Backend bauen
3. **Datenbank-Migration** - Datenbank-Migrationen anwenden
4. **PM2-Konfiguration** - `ecosystem.config.js` automatisch generieren
5. **Service-Neustart** - Alte Prozesse stoppen und neue starten
6. **Gesundheitsprüfung** - Anwendungsverfügbarkeit überprüfen

### Wichtige Hinweise

⚠️ **Sicherheitswarnung:** Die Datei `ecosystem.config.js` wird **NICHT** im Repository gespeichert. Sie wird automatisch auf dem Server während der Bereitstellung generiert und enthält serverspezifische Konfigurationen (Pfade, Ports, Logs).

#### Dateistruktur nach der Bereitstellung:
```
/var/www/crm/
├── frontend/          # Gebautes Next.js-Anwendung
├── backend/           # Gebautes Node.js-Anwendung
├── db/               # Prisma-Client und Migrationen
├── ecosystem.config.js  # ← Wird automatisch generiert!
├── .env-Dateien     # Manuell konfiguriert
└── package.json     # Root-Abhängigkeiten
```

### Manuelle Bereitstellungs-Auslösung

Sie können die Bereitstellung manuell auslösen:
1. Zum GitHub-Repository gehen
2. `Actions`-Tab anklicken
3. `Deploy to Server`-Workflow auswählen
4. `Run workflow` anklicken

### Überwachung und Logs

#### Bereitstellungsstatus prüfen:
```bash
# Auf dem Server
cd /var/www/crm
pm2 status
pm2 logs
```

#### Anwendungs-Logs anzeigen:
```bash
pm2 logs crm-frontend
pm2 logs crm-backend
```

### Fehlerbehebung

#### Bei Bereitstellungsfehlern:
1. GitHub Actions-Logs auf Fehler prüfen
2. SSH-Verbindung prüfen: `ssh -T user@server`
3. Server-Ressourcen prüfen: `df -h` und `free -h`
4. Umgebungsvariablen korrekt überprüfen

#### Häufige Probleme:
- **SSH-Verbindung fehlgeschlagen**: `SERVER_SSH_KEY`-Format prüfen (privater Schlüssel)
- **Build fehlgeschlagen**: Node.js-Version und Abhängigkeiten prüfen
- **Migration fehlgeschlagen**: Datenbankverbindung und Berechtigungen prüfen
- **Services starten nicht**: PM2-Logs und Port-Verfügbarkeit prüfen

### Sicherheits-Best-Practices

1. **SSH-Schlüssel**: Separate SSH-Schlüssel für jeden Server verwenden
2. **Umgebungsvariablen**: Niemals echte Werte im Repository committen
3. **Datenbank**: Starke Passwörter verwenden und Zugriff beschränken
4. **Firewall**: UFW oder iptables richtig konfigurieren
5. **SSL**: HTTPS mit Let's Encrypt aktivieren

### Nützliche Befehle

```bash
# Alle Services prüfen
pm2 status

# Echtzeit-Logs anzeigen
pm2 logs --lines 50

# Services neu starten
pm2 restart all

# System-Ressourcen prüfen
htop
df -h
free -h

# Datenbank sichern
pg_dump crm > backup_$(date +%Y%m%d).sql
```

Diese Einrichtung bietet eine vollständige CI/CD-Pipeline für die automatisierte Bereitstellung Ihrer CRM-Anwendung! 🎉

---

**Autor:** Sergey Daub (sergeydaub@gmail.com)
**Version:** 2.0
**Datum:** 25. November 2025
