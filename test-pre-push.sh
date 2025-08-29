#!/bin/bash

# Test script for pre-push hook
# This script simulates the pre-push hook behavior

echo "🧪 Testing pre-push hook..."
echo "This will run the same checks as the actual pre-push hook"
echo ""

# Run the pre-push hook
if .git/hooks/pre-push; then
    echo ""
    echo "✅ Pre-push hook test passed!"
    echo "Your code is ready for push."
else
    echo ""
    echo "❌ Pre-push hook test failed!"
    echo "Please fix the issues before pushing."
    exit 1
fi
