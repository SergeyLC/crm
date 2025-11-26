# 🚀 LoyaCareCRM Deployment Guide

*Complete deployment instructions for CRM system*

*[🇸 English | [🇩🇪 Deutsch](DEPLOYMENT.de.md)*

## 📋 Deployment Options

LoyaCareCRM supports multiple deployment methods:

### 🐳 **Docker Deployment (Recommended)**
- **Development**: Local development with hot reload
- **Stage**: Pre-production testing environment
- **Production**: Containerized production deployment
- **CI/CD**: Automated deployment via GitHub Actions

### 🖥️ **Traditional Server Deployment**
- Manual Ubuntu server setup with PM2, Nginx, PostgreSQL
- Suitable for custom server configurations

---

## 📚 Deployment Documentation Structure

This deployment guide is organized into separate files for clarity:

### 🐳 Docker Deployment
**[DEPLOYMENT_DOCKER.md](DEPLOYMENT_DOCKER.md)** - Complete Docker deployment guide including:
- Prerequisites and installation
- Development, Stage, and Production environments
- Docker convenience scripts
- Management commands
- Monitoring and troubleshooting
- Security considerations
- CI/CD automation with GitHub Actions

### 🖥️ Traditional Ubuntu Server Deployment
**[DEPLOYMENT_TRADITIONAL.md](DEPLOYMENT_TRADITIONAL.md)** - Manual server deployment including:
- Ubuntu server setup
- PostgreSQL, Node.js, PM2, and Nginx installation
- Application deployment and configuration
- SSL setup and security
- Backup and monitoring scripts

### 🚀 CI/CD and Automation
**[CI_CD_WORKFLOW.md](CI_CD_WORKFLOW.md)** - GitHub Actions automation including:
- Automated deployment pipelines
- Server preparation and secrets setup
- Manual and automatic deployment triggers

**[DOCKER_CI_CD_WORKFLOW.md](DOCKER_CI_CD_WORKFLOW.md)** - Docker-specific CI/CD workflow:
- Containerized deployment automation
- Docker Compose integration
- Environment-specific configurations

### 🔧 Additional Resources
- **[DEPLOYMENT_OPTIMIZATION.md](DEPLOYMENT_OPTIMIZATION.md)** - Performance optimization
- **[DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md)** - Production-specific configurations
- **[SERVER_SETUP.md](SERVER_SETUP.md)** - Server infrastructure setup
- **[SERVER_PERFORMANCE.md](SERVER_PERFORMANCE.md)** - Performance monitoring
- **[NGINX_OPTIMIZATION.md](NGINX_OPTIMIZATION.md)** - Nginx configuration optimization

---

## 🚀 Quick Start

Choose your deployment method:

### 🐳 Docker (Recommended)
See **[DEPLOYMENT_DOCKER.md](DEPLOYMENT_DOCKER.md)** for complete Docker deployment instructions.

### 🖥️ Traditional Server
See **[DEPLOYMENT_TRADITIONAL.md](DEPLOYMENT_TRADITIONAL.md)** for manual Ubuntu server deployment.

---

**Author:** Sergey Daub (sergeydaub@gmail.com)
**Version:** 2.1
**Date:** 26 November 2025
