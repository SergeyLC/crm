#!/bin/bash

# Deployment status check script
# Note: ecosystem.config.js is generated automatically on the server during deployment

echo "🔍 Checking deployment status..."

# Check PM2 processes
echo "📊 PM2 Processes Status:"
pm2 status

echo ""
echo "📝 Application Logs:"
echo "Frontend logs:"
pm2 logs loyacrm-frontend --lines 10 --nostream
echo ""
echo "Backend logs:"
pm2 logs loyacrm-backend --lines 10 --nostream

echo ""
echo "🌐 Checking service availability:"

# Check if frontend is responding (adjust port if needed)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "✅ Frontend is accessible (port 3000)"
else
    echo "❌ Frontend is not accessible (port 3000)"
fi

# Check if backend is responding (adjust port if needed)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health | grep -q "200\|301\|302"; then
    echo "✅ Backend is accessible (port 4000)"
else
    echo "❌ Backend is not accessible (port 4000)"
fi

echo ""
echo "💾 Disk Usage:"
df -h /var/www 2>/dev/null || df -h

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "✅ Status check completed!"
