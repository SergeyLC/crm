#!/bin/bash

# Node.js Version Check Script
# This script checks if the required Node.js version is installed

REQUIRED_NODE_VERSION="24"
CURRENT_NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d'.' -f1)

echo "🔍 Node.js Version Check"
echo "========================"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "📦 Please install Node.js version $REQUIRED_NODE_VERSION or higher"
    echo "   Run: curl -fsSL https://deb.nodesource.com/setup_$REQUIRED_NODE_VERSION.x | sudo -E bash -"
    echo "   Then: sudo apt-get install -y nodejs"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo "✅ NPM version: $(npm --version)"

if [ "$CURRENT_NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
    echo "⚠️  WARNING: Node.js version $CURRENT_NODE_VERSION is lower than required $REQUIRED_NODE_VERSION"
    echo "📦 Consider upgrading to Node.js $REQUIRED_NODE_VERSION+"
    echo "   Current: $(node --version)"
    echo "   Required: $REQUIRED_NODE_VERSION+"
    echo ""
    echo "🔧 Upgrade commands:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_$REQUIRED_NODE_VERSION.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
else
    echo "✅ Node.js version is compatible"
fi

echo ""
echo "📋 System Information:"
echo "   OS: $(lsb_release -d 2>/dev/null | cut -f2 || uname -s)"
echo "   Architecture: $(uname -m)"

echo ""
echo "✅ Version check completed!"
