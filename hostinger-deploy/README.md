# Dev Global Jobs - Hostinger Deployment Guide

## Files Included
- `index.cjs` - Main server file
- `public/` - Frontend static files
- `package.json` - Node.js dependencies
- `.env.example` - Environment variables template

## Deployment Steps for Hostinger

### 1. Upload Files
Upload all files from this folder to your Hostinger Node.js hosting:
- `index.cjs`
- `package.json`
- `public/` folder (with all contents)
- `.env` file (create from `.env.example`)

### 2. Create .env File
1. Copy `.env.example` to `.env`
2. Fill in your actual values:
   - Database credentials (from Neon or your PostgreSQL provider)
   - Stripe live keys (from Stripe Dashboard)
   - Generate random secrets for SESSION_SECRET and JWT_SECRET

### 3. Configure Hostinger
1. Go to Hostinger hPanel → Websites → Manage → Node.js
2. Set Node.js version to 18 or higher
3. Set startup file to `index.cjs`
4. Set port to the one Hostinger assigns (usually auto-configured)

### 4. Install Dependencies
In Hostinger terminal or SSH:
```bash
npm install --production
```

### 5. Start Application
```bash
npm start
```

### 6. Domain Setup
Configure your domain (devglobaljobs.com) to point to Hostinger.

## Environment Variables Required
| Variable | Description |
|----------|-------------|
| DATABASE_URL | Full PostgreSQL connection string |
| STRIPE_SECRET_KEY | Stripe live secret key |
| STRIPE_PUBLISHABLE_KEY | Stripe live publishable key |
| SESSION_SECRET | Random string for session encryption |
| JWT_SECRET | Random string for JWT tokens |
| PORT | Server port (usually auto-set by Hostinger) |

## Support
Company: Trend Nova World Limited
UK Company Number: 16709289
