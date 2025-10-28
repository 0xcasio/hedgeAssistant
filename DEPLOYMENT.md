# 🚀 Deployment Guide

This guide covers various deployment options for the Prediction Market Hedging Calculator.

## 📋 Prerequisites

- Node.js 18+ installed
- Git repository set up
- Domain name (optional)

## 🌐 Deployment Options

### 1. Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

#### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/prediction-market-hedging-calculator)

#### Manual Deploy
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow the prompts**
   - Link to existing project or create new
   - Set up environment variables if needed
   - Deploy!

### 2. Netlify

#### Manual Deploy
1. **Build the project**
   ```bash
   npm run build
   npm run export
   ```

2. **Deploy to Netlify**
   - Drag and drop the `out` folder to Netlify
   - Or connect your GitHub repository

#### Netlify Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build && npm run export"
  publish = "out"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. GitHub Pages

#### Setup
1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json**
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d out"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run build
   npm run export
   npm run deploy
   ```

### 4. AWS Amplify

1. **Connect repository**
   - Go to AWS Amplify console
   - Connect your GitHub repository

2. **Configure build settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
           - npm run export
     artifacts:
       baseDirectory: out
       files:
         - '**/*'
   ```

### 5. Docker Deployment

#### Create Dockerfile
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Build and Run
```bash
docker build -t hedging-calculator .
docker run -p 3000:3000 hedging-calculator
```

## 🔧 Environment Variables

### Production Environment
Create `.env.production`:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Vercel Environment Variables
In Vercel dashboard:
- Go to Project Settings
- Add Environment Variables
- Set for Production, Preview, and Development

## 📊 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run analyze

# Check for unused dependencies
npx depcheck
```

### Image Optimization
- Use Next.js Image component
- Optimize images with tools like ImageOptim
- Consider WebP format

### Caching Strategy
- Set up CDN caching
- Configure browser caching headers
- Use service workers for offline functionality

## 🔒 Security Considerations

### HTTPS
- Always use HTTPS in production
- Set up SSL certificates
- Redirect HTTP to HTTPS

### Environment Variables
- Never commit sensitive data
- Use environment variables for API keys
- Rotate keys regularly

### Headers Security
Add security headers in `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

## 📈 Monitoring and Analytics

### Error Tracking
- Set up Sentry for error monitoring
- Configure alerts for critical errors
- Monitor performance metrics

### Analytics
- Add Google Analytics or similar
- Track user interactions
- Monitor conversion rates

### Uptime Monitoring
- Use services like UptimeRobot
- Set up alerts for downtime
- Monitor response times

## 🔄 CI/CD Pipeline

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run export
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
- Check Node.js version compatibility
- Clear `.next` folder and rebuild
- Verify all dependencies are installed

#### Runtime Errors
- Check environment variables
- Verify API endpoints are accessible
- Check browser console for errors

#### Performance Issues
- Analyze bundle size
- Check for memory leaks
- Optimize images and assets

### Debug Mode
```bash
# Run in debug mode
DEBUG=* npm run dev

# Check build output
npm run build -- --debug
```

## 📞 Support

If you encounter deployment issues:
- Check the [GitHub Issues](https://github.com/yourusername/prediction-market-hedging-calculator/issues)
- Review platform-specific documentation
- Contact support for your chosen platform

---

**Happy Deploying! 🚀**
