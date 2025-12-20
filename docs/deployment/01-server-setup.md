# Server Setup Guide

Initial server preparation for LoyaCareCRM deployment.

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
mkdir -p /var/www/loyacrm-production
mkdir -p /var/www/loyacrm-production/backups

# Set appropriate permissions
chmod -R 755 /var/www/loyacrm-production

# Verify creation
ls -la /var/www/
```

### For Staging (Optional)

```bash
# Create staging directories
mkdir -p /var/www/loyacrm-staging
mkdir -p /var/www/loyacrm-staging/backups

# Set permissions
chmod -R 755 /var/www/loyacrm-staging
```

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

# Allow Staging port (if deploying staging)
ufw allow 8080/tcp

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
