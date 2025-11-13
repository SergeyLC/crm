module.exports = {
  apps: [
    {
      name: "loyacrm-staging-frontend",
      script: "pnpm run start",
      cwd: "/var/www/loyacrm-staging/frontend",
      env_file: "./.env.production.local",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      },
      instances: 1, // Single instance for staging (saves memory)
      exec_mode: "fork", // Fork mode instead of cluster
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      error_file: "/var/log/pm2/loyacrm-staging-frontend-error.log",
      out_file: "/var/log/pm2/loyacrm-staging-frontend-out.log",
      log_file: "/var/log/pm2/loyacrm-staging-frontend.log"
    },
    {
      name: "loyacrm-staging-backend",
      script: "pnpm run start:prod",
      cwd: "/var/www/loyacrm-staging/backend",
      env_file: "./.env.production.local",
      env: {
        NODE_ENV: "production",
        PORT: 4001
      },
      instances: 1, // Single instance for staging
      exec_mode: "fork", // Fork mode instead of cluster
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      error_file: "/var/log/pm2/loyacrm-staging-backend-error.log",
      out_file: "/var/log/pm2/loyacrm-staging-backend-out.log",
      log_file: "/var/log/pm2/loyacrm-staging-backend.log"
    }
  ]
};
