# Server Setup Guide

Initial server preparation for CRM deployment.

## Prerequisites

- Ubuntu 20.04 LTS or newer
- Root or sudo access
- Minimum 2GB RAM (4GB recommended)
- 2+ CPU cores
- 10GB+ free disk space

## Step 1: Connect to Server

```bash
# Replace YOUR_SERVER_IP with your server's IP address
ssh root@YOUR_SERVER_IP

# If using SSH key
ssh -i ~/.ssh/your_key root@YOUR_SERVER_IP
```

## Step 2: Update System

```bash
# Update package list
apt update

# Upgrade installed packages
apt upgrade -y

# Install essential utilities
apt install -y curl wget git nano ufw
```

## Step 3: Install Docker

```bash
# Download and run Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify installation
docker --version
# Expected output: Docker version 29.x.x or newer

# Enable Docker to start on boot
systemctl enable docker
systemctl start docker

# Check Docker service status
systemctl status docker
```

## Step 4: Install Docker Compose

Docker Compose is typically included with modern Docker installations.

```bash
# Verify Docker Compose installation
docker compose version
# Expected output: Docker Compose version v5.x.x or newer
```

If Docker Compose is not installed:

```bash
# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Verify again
docker compose version
```

## Step 5: Create Directory Structure

### For Production

```bash
# Create production directories
mkdir -p /var/www/crm-production
mkdir -p /var/www/crm-production/backups

# Set appropriate permissions
chmod -R 755 /var/www/crm-production

# Verify creation
ls -la /var/www/
```

### For Stage-main and Stage-develop

```bash
mkdir -p /var/www/crm-stage-main /var/www/crm-stage-main/backups
mkdir -p /var/www/crm-stage-develop /var/www/crm-stage-develop/backups
chmod -R 755 /var/www/crm-stage-main /var/www/crm-stage-develop
```

> Legacy path `/var/www/crm-staging` (compose `docker-compose.stage.yml`) is only a fallback for the old GitHub environment name `staging`. Prefer `stage-main` / `stage-develop`.

## Deploy user for CI

GitHub Actions must SSH as a dedicated **`deploy`** user (not `root`). That user owns `/var/www/crm-*` and is in the `docker` group so Compose can pull/recreate containers.

```bash
# Create user + docker access
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# Own app directories
chown -R deploy:deploy \
  /var/www/crm-production \
  /var/www/crm-stage-main \
  /var/www/crm-stage-develop \
  /var/www/crm-staging 2>/dev/null || true

# CI SSH key (public → authorized_keys; private → GitHub SERVER_SSH_KEY)
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
sudo -u deploy ssh-keygen -t ed25519 -f /home/deploy/.ssh/github_actions_deploy -C "github-actions-deploy" -N ""

# Forced-command gateway: key may only mkdir/scp /tmp/crm-deploy-<runId> and run crm-ci-deploy.sh
install -d -m 755 /home/deploy/bin
install -m 755 scripts/server/crm-ci-ssh-gateway.sh /home/deploy/bin/crm-ci-ssh-gateway.sh
install -m 755 scripts/server/crm-ci-deploy.sh /home/deploy/bin/crm-ci-deploy.sh
PUB=$(cat /home/deploy/.ssh/github_actions_deploy.pub)
printf 'restrict,command="/home/deploy/bin/crm-ci-ssh-gateway.sh" %s\n' "$PUB" > /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys

# Copy private key into GitHub repo secret SERVER_SSH_KEY; set SERVER_USER=deploy
cat /home/deploy/.ssh/github_actions_deploy
```

`deploy` is in the `docker` group (near-root via the socket). The `restrict,command=…` option on the CI key limits that key to the deploy gateway — not an interactive shell.

Verify (must be **denied** for arbitrary commands):

```bash
ssh -i /home/deploy/.ssh/github_actions_deploy deploy@YOUR_SERVER_IP 'docker ps'
# → crm-ci-ssh-gateway: command denied
```

Do **not** install the CI public key into `/root/.ssh/authorized_keys`. Keep root SSH for admin keys only. See [GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md#server_ssh_key).

## Step 6: Configure Firewall

```bash
# Install UFW if not already installed
apt install -y ufw

# Allow SSH (IMPORTANT: Do this first!)
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS (if using SSL)
ufw allow 443/tcp

# Allow Stage-main port
ufw allow 8080/tcp

# Allow Stage-develop port
ufw allow 8081/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
8080/tcp                   ALLOW       Anywhere
```

## Step 7: System Optimization (Optional but Recommended)

### Increase File Limits

```bash
# Edit system limits
nano /etc/security/limits.conf

# Add these lines:
* soft nofile 65536
* hard nofile 65536
```

### Configure Swap (if RAM < 4GB)

```bash
# Create 2GB swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verify
swapon --show
free -h
```

### Enable Automatic Security Updates

```bash
# Install unattended-upgrades
apt install -y unattended-upgrades

# Enable automatic updates
dpkg-reconfigure -plow unattended-upgrades
```

## Step 8: Verify Installation

Run this verification script:

```bash
echo "=== System Information ==="
uname -a
echo ""

echo "=== Available Resources ==="
free -h
df -h /var/www
echo ""

echo "=== Docker Version ==="
docker --version
docker compose version
echo ""

echo "=== Docker Status ==="
systemctl is-active docker
echo ""

echo "=== Directory Structure ==="
ls -la /var/www/
echo ""

echo "=== Firewall Status ==="
ufw status
```

## Troubleshooting

### Docker daemon not running

```bash
systemctl start docker
systemctl enable docker
systemctl status docker
```

### Permission denied errors

```bash
# Add your user to docker group (if not using root)
usermod -aG docker $USER

# Logout and login again for changes to take effect
```

### Disk space issues

```bash
# Check disk usage
df -h

# Clean Docker system
docker system prune -a --volumes
```

## Next Steps

Your server is now ready for deployment. Choose your deployment method:

- **[GitHub Actions Deployment](02-production-github-actions.md)** - Recommended for teams
- **[Manual Build Deployment](03-production-manual-build.md)** - Quick deployment option

## Security Recommendations

1. **Change default SSH port** (optional but recommended):
   ```bash
   nano /etc/ssh/sshd_config
   # Change Port 22 to something else
   systemctl restart sshd
   ufw allow YOUR_NEW_PORT/tcp
   ```

2. **Disable root SSH login** (use sudo user instead):
   ```bash
   nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   systemctl restart sshd
   ```

3. **Set up SSH key authentication** and disable password login

4. **Enable fail2ban** for brute-force protection:
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

---

[← Back to Documentation Index](README.md) | [Next: GitHub Actions Deployment →](02-production-github-actions.md)
