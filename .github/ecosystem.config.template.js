module.exports = {
  apps: [
    {
      name: "loyacrm-frontend",
      script: "npm run start",
      cwd: "/var/www/loyacrm/frontend",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/loyacrm-frontend-error.log",
      out_file: "/var/log/pm2/loyacrm-frontend-out.log",
      log_file: "/var/log/pm2/loyacrm-frontend.log"
    },
    {
      name: "loyacrm-backend",
      script: "npm run start:prod",
      cwd: "/var/www/loyacrm/backend",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/loyacrm-backend-error.log",
      out_file: "/var/log/pm2/loyacrm-backend-out.log",
      log_file: "/var/log/pm2/loyacrm-backend.log"
    }
  ]
};
