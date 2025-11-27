# LoyaCare CRM - Production Docker Deployment

This directory contains the production-ready Docker deployment configuration for LoyaCare CRM. This architecture eliminates source code from production servers and uses Docker secrets for secure credential management.

## Directory Structure

```
docker-example/
├── docker-compose.yml          # Main production configuration
├── docker-compose.staging.yml  # Staging environment overrides
├── .env.production            # Production environment variables
├── .env.staging               # Staging environment variables
├── nginx/
│   └── conf.d/
│       └── loyacrm.conf       # Nginx reverse proxy configuration
├── secrets/                   # Docker secrets (create these files)
│   ├── db_password.txt        # Database password
│   └── jwt_secret.txt         # JWT secret key
└── backups/                   # Database backup storage
```

## Setup Instructions

### 1. Prepare Secrets

Create the secret files with your actual credentials:

```bash
# Database password
echo "your-secure-db-password" > secrets/db_password.txt

# JWT secret (generate a secure random string)
openssl rand -base64 32 > secrets/jwt_secret.txt
```

### 2. Configure Environment

Edit `.env.production` and `.env.staging` with your domain and configuration:

- Update `your-domain.com` to your actual domain
- Adjust ports if needed
- Configure SSL certificates in nginx configuration

### 3. Deploy

For production:
```bash
docker-compose --env-file .env.production up -d
```

For staging:
```bash
docker-compose --env-file .env.staging -f docker-compose.yml -f docker-compose.staging.yml up -d
```

## Services

- **nginx**: Reverse proxy with SSL termination
- **frontend**: Next.js application (pre-built image)
- **backend**: Node.js API server (pre-built image)
- **db**: PostgreSQL database with persistent storage
- **migrator**: Database migration service (runs on-demand)

## Security Features

- ✅ Zero source code on production servers
- ✅ Docker secrets for sensitive credentials
- ✅ SSL/TLS encryption
- ✅ Security headers configured
- ✅ Database backups with persistent volumes

## Maintenance

### Database Backups

Backups are stored in the `backups/` directory. The database container has access to this volume.

### Updates

To update the application:
1. Build new images with updated tags
2. Update the TAG in `.env.production` or `.env.staging`
3. Run migrations if needed: `docker-compose run --rm migrator`
4. Restart services: `docker-compose up -d`

### Logs

View logs for all services:
```bash
docker-compose logs -f
```

View logs for specific service:
```bash
docker-compose logs -f backend
```