# Vercel Deployment Guide

Complete guide for deploying your Nuxt 3 Financial Control App to Vercel Hobby plan.

## Prerequisites

- GitHub account
- Vercel account (free Hobby plan)
- Git repository with your code
- Google Cloud Service Account credentials
- Google Sheets spreadsheet ID

## Project Configuration

Your project is now configured with:

- `nuxt.config.ts` - Vercel optimizations and Nitro configuration (includes preset, server assets, etc.)
- `vercel.json` - Vercel deployment configuration (includes API_ARCHITECTURE.md)
- `/server/api/health.get.ts` - Health check endpoint
- `/server/assets/docs/` - Server-side markdown files (API_ARCHITECTURE.md)
- `.env.example` - Environment variable template

**Note**: `nitro.config.ts` is NOT used with Nuxt 3. All Nitro configuration is in `nuxt.config.ts` under the `nitro` key.

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Configure project for Vercel deployment"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to main branch
git push -u origin main
```

### 2. Connect GitHub Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Nuxt 3 framework

### 3. Configure Build Settings

Vercel should auto-configure these settings, but verify:

- **Framework Preset**: Nuxt.js
- **Build Command**: `npm run build` (or `nuxt build`)
- **Output Directory**: `.output/public`
- **Install Command**: `npm install`

### 4. Add Environment Variables

**Critical Step:** Configure these in Vercel Project Settings before deploying.

Navigate to: **Project Settings > Environment Variables**

Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NUXT_PUBLIC_GOOGLE_SPREADSHEET_ID` | Your Google Sheets ID | Production, Preview, Development |
| `NUXT_GOOGLE_CLIENT_EMAIL` | Service account email | Production, Preview, Development |
| `NUXT_GOOGLE_PRIVATE_KEY` | Service account private key (with \n) | Production, Preview, Development |

**Important Notes:**

- For `NUXT_GOOGLE_PRIVATE_KEY`, paste the entire key including quotes and `\n` line breaks
- Example: `"-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"`
- Select all three environments (Production, Preview, Development) for each variable
- These values come from your Google Cloud Service Account JSON key file

### 5. Deploy

Click "Deploy" button. Vercel will:

1. Clone your repository
2. Install dependencies
3. Build the Nuxt 3 application
4. Deploy as serverless functions
5. Provide a live URL

First deployment typically takes 2-3 minutes.

### 6. Test Deployment

After deployment completes, test these endpoints:

**Health Check:**
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "ok": true,
  "timestamp": "2025-10-30T12:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "config": {
    "hasGoogleSpreadsheetId": true,
    "hasGoogleClientEmail": true,
    "hasGooglePrivateKey": true
  }
}
```

**Transactions API:**
```bash
curl https://your-app.vercel.app/api/transactions
```

Should return your transaction data from Google Sheets.

**Main App:**
Visit `https://your-app.vercel.app` in browser to see the full application.

### 7. Verify SSR Works

1. Open your deployed app in browser
2. View page source (right-click > View Page Source)
3. You should see rendered HTML content (not just empty divs)
4. This confirms Server-Side Rendering is working correctly

## Vercel Hobby Plan Limits

Your app is configured to work within Vercel Hobby plan limits:

- **Execution Time**: 10 seconds max per serverless function
- **Bandwidth**: 100 GB/month
- **Deployments**: Unlimited
- **Team Members**: 1 (Hobby plan)
- **Custom Domains**: Yes, supported

## API Routes Configuration

All your API routes in `/server/api/` will be deployed as serverless functions:

- `/api/health` - Health check endpoint (NEW)
- `/api/transactions` - Main transactions endpoint
- `/api/docs/architecture` - API documentation
- `/api/docs/generate` - Dynamic documentation

Each runs independently as a Vercel Serverless Function with 10-second timeout.

## Automatic Deployments

Vercel automatically deploys:

- **Production**: When you push to `main` branch
- **Preview**: When you open a Pull Request

Each PR gets a unique preview URL for testing before merging.

## Custom Domain (Optional)

To add a custom domain:

1. Go to Project Settings > Domains
2. Add your domain name
3. Configure DNS records as instructed by Vercel
4. SSL certificate is automatically provisioned

## Environment-Specific Variables

You can set different values per environment:

- **Production**: Live app with real data
- **Preview**: PR deployments, can use test data
- **Development**: Local development (uses `.env` file)

## Troubleshooting

### Build Fails

**Check build logs in Vercel dashboard for errors:**

```bash
# Test build locally first
npm run build
```

### API Routes Return 500

**Check function logs in Vercel dashboard:**
- Go to Deployments > Select deployment > Functions
- Click on specific function to see logs
- Look for errors related to missing environment variables

### Environment Variables Not Working

**Verify in Vercel dashboard:**
1. Go to Project Settings > Environment Variables
2. Ensure all three variables are present
3. Check they're enabled for the correct environments
4. Redeploy after adding/changing variables

### Google Sheets Connection Issues

**Verify credentials:**
```bash
# Test health endpoint to check config status
curl https://your-app.vercel.app/api/health
```

Check that all `config` fields return `true`.

**Common issues:**
- Private key format incorrect (missing `\n` line breaks)
- Service account email doesn't have access to spreadsheet
- Spreadsheet ID is incorrect

### SSR Not Working

**Symptoms:**
- Blank page on initial load
- "Flash" of content appearing
- SEO crawlers can't see content

**Solutions:**
1. Check Vercel build logs for hydration errors
2. Ensure no browser-only code runs during SSR
3. Verify `nitro.preset` is set to `'vercel'` in config files

### /api/docs/architecture Returns 500 or File Not Found

**Problem**: API_ARCHITECTURE.md not found in Vercel deployment

**Solution Applied**:
1. File is now read at startup using `readFileSync` with fallback paths
2. `vercel.json` includes the file in `includeFiles` array
3. File exists in both project root and `server/assets/docs/`

**If still failing**:
```bash
# Check if file is in your git repository
git ls-files | grep API_ARCHITECTURE.md

# If not, add it
git add API_ARCHITECTURE.md
git commit -m "Include API_ARCHITECTURE.md in deployment"
git push
```

**Verify deployment**:
```bash
curl https://your-app.vercel.app/api/docs/architecture
```

Should return the full markdown documentation, not a 500 error.

## Monitoring and Logs

**View logs in Vercel:**
1. Go to your project dashboard
2. Click "Deployments"
3. Select a deployment
4. Click "Functions" tab to see serverless function logs
5. Click "Runtime Logs" to see real-time logs

**Important:** Hobby plan has limited log retention (few hours).

## Rolling Back Deployment

If something goes wrong:

1. Go to Deployments in Vercel dashboard
2. Find a previous working deployment
3. Click the three dots menu
4. Select "Promote to Production"

## Performance Optimization

Your project is already configured with:

- Minified production builds
- No source maps in production (smaller bundle)
- Vercel Edge Network CDN (automatic)
- SSR for fast initial page loads
- API route caching headers (if needed, add in route handlers)

## Cost Management

Vercel Hobby plan is free, but monitor:

- Function execution time (10s limit)
- Bandwidth usage (100 GB/month limit)
- Build minutes (6000/month limit)

View usage in Vercel dashboard under Usage tab.

## Next Steps

After successful deployment:

1. **Monitor health endpoint** regularly
2. **Set up error tracking** (e.g., Sentry)
3. **Configure custom domain** if needed
4. **Enable analytics** in Vercel dashboard
5. **Set up notifications** for deployment failures

## Quick Reference Commands

```bash
# Local development
npm run dev

# Test production build locally
npm run build
npm run preview

# Check for build errors
npm run build

# Git deployment
git add .
git commit -m "your message"
git push origin main
```

## Support Resources

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Nuxt Integration](https://vercel.com/docs/frameworks/nuxt)
- [Nitro Vercel Preset](https://nitro.unjs.io/deploy/providers/vercel)

## Summary

Your Nuxt 3 app is now production-ready for Vercel Hobby plan with:

- Vercel serverless function preset
- Optimized build configuration
- Health check endpoint at `/api/health`
- All API routes working as serverless functions
- SSR enabled
- Environment variables configured
- Google Sheets integration secured server-side

Happy deploying!
