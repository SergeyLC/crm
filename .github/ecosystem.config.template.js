module.exports = {
  apps: [
    {
      name: "crm-frontend",
      script: "pnpm run start",
      cwd: "/var/www/crm/frontend",
      env_file: "./.env.production.local", // Load secrets from .env.production.local
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/crm-frontend-error.log",
      out_file: "/var/log/pm2/crm-frontend-out.log",
      log_file: "/var/log/pm2/crm-frontend.log"
    },
    {
      name: "crm-backend",
      script: "pnpm run start:prod",
      cwd: "/var/www/crm/backend",
      env_file: "./.env.production.local", // Load secrets from .env.production.local
      env: {
        NODE_ENV: "production",
        PORT: 4000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/crm-backend-error.log",
      out_file: "/var/log/pm2/crm-backend-out.log",
      log_file: "/var/log/pm2/crm-backend.log"
    }
  ]
};
