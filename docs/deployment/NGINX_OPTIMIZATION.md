# Nginx Optimization Guide

## 🚀 Performance Improvements

The optimized nginx configuration adds:

### 1. **Gzip compression (saves 70-80% traffic)**
```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript...;
```
**Effect:** Page 500KB → 100KB

### 2. **HTTP/2 (30-50% speedup)**
```nginx
listen 443 ssl http2;
```
**Effect:** Parallel resource loading, less latency

### 3. **Aggressive static caching**
- `_next/static/` - 1 year (immutable)
- `_next/image` - 1 year
- `/public/` - 1 hour
- `favicon.ico` - 1 day

**Effect:** Repeat visits load instantly

### 4. **Rate Limiting (DDoS protection)**
```nginx
limit_req zone=api_limit burst=5 nodelay;  # API: 10 req/s
limit_req zone=general_limit burst=20 nodelay;  # Frontend: 30 req/s
```
**Effect:** Protection against overload and abuse

### 5. **Connection Keepalive**
```nginx
upstream frontend {
    server localhost:3000;
    keepalive 64;  # Connection reuse
}
```
**Effect:** Fewer TCP handshakes, faster response

### 6. **Optimized buffers**
```nginx
client_max_body_size 10M;  # File upload up to 10MB
proxy_buffers 8 4k;  # Efficient buffering
```

## 📋 How to apply

### Step 1: Backup current configuration
```bash
sudo cp /etc/nginx/sites-available/loyacrm /etc/nginx/sites-available/loyacrm.backup
```

### Step 2: Copy optimized configuration
```bash
# Copy .github/nginx-optimized.conf from the repository
sudo cp /path/to/repo/.github/nginx-optimized.conf /etc/nginx/sites-available/loyacrm
```

### Step 3: Edit for your domain
```bash
sudo nano /etc/nginx/sites-available/loyacrm
```

Replace:
- `your-domain.com` → your real domain
- `www.your-domain.com` → your www domain (if any)

### Step 4: Test configuration
```bash
sudo nginx -t
```

**Expected output:**
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 5: Apply changes
```bash
sudo systemctl reload nginx
```

### Step 6: Test gzip
```bash
curl -H "Accept-Encoding: gzip" -I https://your-domain.com
```

**Should be:**
```
Content-Encoding: gzip
```

### Step 7: Set up SSL and HTTP/2

After obtaining SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot automatically:
- ✅ Adds SSL certificates
- ✅ Enables HTTP/2
- ✅ Sets up HTTP → HTTPS redirect
- ✅ Automatic certificate renewal

## 📊 Performance Measurement

### Before optimization:
```bash
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com
```

### After optimization:
```bash
# Should see:
# - time_total: reduction by 30-50%
# - size_download: reduction by 70-80% (thanks to gzip)
```

### Test with tools:
- **Google PageSpeed Insights**: https://pagespeed.web.dev/
- **GTmetrix**: https://gtmetrix.com/
- **WebPageTest**: https://www.webpagetest.org/

**Expected improvements:**
- PageSpeed Score: +20-30 points
- First Contentful Paint: -30-40%
- Time to Interactive: -20-30%

## 🔍 Monitoring

### Check active connections:
```bash
sudo ss -s
```

### Check rate limiting:
```bash
sudo tail -f /var/log/nginx/error.log | grep limiting
```

### Check cache headers:
```bash
curl -I https://your-domain.com/_next/static/chunks/main.js
# Should be: Cache-Control: public, max-age=31536000, immutable
```

## ⚠️ Important notes

1. **Rate limiting may block legitimate users**
   - If you see 503 errors - increase `burst` values
   - Current limits: API 10 req/s, Frontend 30 req/s

2. **client_max_body_size is set to 10MB**
   - If you need to upload larger files → increase
   - Example: `client_max_body_size 50M;`

3. **Gzip compression uses CPU**
   - `gzip_comp_level 6` - balance between speed and compression
   - If CPU is loaded → decrease to 4
   - If CPU is free → increase to 9

4. **After SSL certificate**
   - Uncomment the HTTPS server block
   - Enable HSTS (after testing!)

## 🎯 Staging configuration

For staging, use a similar configuration, but with different ports:
- Frontend: `localhost:3001` (instead of 3000)
- Backend: `localhost:4001` (instead of 4000)
- Rate limits: can be made stricter (staging for tests)

## 📈 Expected results

**Before optimization:**
- Page size: ~500KB
- Load time: ~2-3 seconds
- Number of requests: ~40

**After optimization:**
- Page size: ~100KB (gzip)
- Load time: ~0.8-1.2 seconds (HTTP/2 + cache)
- Number of requests: ~10 (cache works)
- Repeat visits: <0.3 seconds

## 🛠️ Troubleshooting

### Problem: 502 Bad Gateway
```bash
# Check that Node.js applications are running
pm2 status

# Check ports
sudo ss -tulpn | grep -E '3000|4000'
```

### Problem: 503 Service Temporarily Unavailable
```bash
# Rate limiting is triggered
# Increase burst in configuration or check logs
sudo tail -f /var/log/nginx/error.log
```

### Problem: Gzip is not working
```bash
# Check main nginx.conf
sudo nano /etc/nginx/nginx.conf
# Make sure there is no `gzip off;` in the main configuration
```
