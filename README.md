# Australian Retirement Planning Tool

A comprehensive retirement calculator for Australian retirees with Monte Carlo simulation, stress testing, and detailed financial analysis.

## Features

- Australian superannuation minimum drawdown rules (4-14% based on age)
- Age Pension calculations with asset and income tests
- Sequencing buffer strategy for sequence-of-returns risk
- Multiple testing modes: Constant returns, Historical periods, Monte Carlo, Formal stress tests
- Flexible spending patterns (level or declining)
- One-off expense tracking with 14 default expenses
- Splurge spending for specific years
- Dynamic spending guardrails (Guyton-Klinger method)
- Real vs Nominal dollar display
- Detailed CSV export for verification

## Deployment to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

1. Create a GitHub repository and push this code
2. Go to https://vercel.com and sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js - just click "Deploy"
6. Done! You'll get a URL like: https://retirement-calculator.vercel.app

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts to link to your account
# Vercel will build and deploy automatically
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Build for Production

```bash
npm run build
npm start
```

## Version

Version 10.0 - Complete Retirement Modeling

## License

Personal use

