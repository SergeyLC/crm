#!/bin/bash

# Script to install git hooks

echo "🔧 Installing git hooks..."

# Copy pre-push hook
if [ -f "scripts/pre-push" ]; then
    cp scripts/pre-push .git/hooks/pre-push
    chmod +x .git/hooks/pre-push
    echo "✅ Pre-push hook installed"
else
    echo "❌ Pre-push hook not found in scripts/"
    exit 1
fi

echo "✅ All hooks installed successfully!"
