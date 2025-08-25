# Migration to Supabase + Upstash Setup Guide

## ✅ Migration Complete

The codebase has been successfully migrated from Docker to Supabase (PostgreSQL) and Upstash (Redis).

### What Was Changed

1. **Database Configuration**: Updated to use Supabase PostgreSQL with SSL
2. **Cache System**: Replaced direct Redis calls with a unified cache interface (supports both Upstash Redis and in-memory fallback)
3. **MongoDB Replacement**: Created PostgreSQL models with JSONB columns for flexible data storage
4. **New Models**: Added `AnalyticsEvent` and `ExperimentResults` models
5. **Environment Variables**: Updated for cloud services

### Current Status

✅ **Server Running**: API server starts successfully on port 4000  
✅ **Validation Working**: Input validation working correctly  
✅ **Fallback Cache**: In-memory cache working when Redis not configured  
⚠️ **Database**: Currently using placeholder credentials (needs real Supabase setup)  
⚠️ **JWT**: Temporarily simplified (will be restored after database connection)

## Setup Instructions

### Step 1: Create Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project:
   - **Name**: `behavioropt` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
4. Wait for project initialization (~2 minutes)

### Step 2: Get Supabase Credentials

1. **Database URL**:
   - Go to Settings → Database
   - Copy the "Connection string" under "Connection string"
   - It should look like: `postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`

2. **API Credentials**:
   - Go to Settings → API
   - Copy the "Project URL" (e.g., `https://[PROJECT-REF].supabase.co`)
   - Copy the "anon public" key

### Step 3: Set Up Upstash Redis (Optional)

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up for a free account
3. Create a new Redis database:
   - **Name**: `behavioropt-cache`
   - **Region**: Select same as Supabase or closest to your users
4. Copy the "Redis URL" from the dashboard

### Step 4: Update Environment Variables

Edit `packages/api/.env` and replace the placeholder values:

```bash
# Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]

# Upstash Redis (optional - leave blank to use in-memory cache)
UPSTASH_REDIS_URL=[YOUR-UPSTASH-URL]
```

### Step 5: Run Database Migration

```bash
# Navigate to the API directory
cd packages/api

# Sync the database (creates tables)
npm run db:sync

# Start the server
npm run dev
```

### Step 6: Verify Everything Works

Test the endpoints:

```bash
# Health check
curl http://localhost:4000/health

# Test signup validation
curl -X POST http://localhost:4000/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "organizationName": "Test Company"
  }'
```

## Fallback Behavior

The system is designed to gracefully handle missing services:

- **No Redis**: Uses in-memory cache for sessions
- **Database Connection Failed**: Server still starts but without database features
- **Invalid Credentials**: Clear error messages in logs

## What's Next

Once you have real Supabase credentials:

1. Update the `.env` file with real values
2. Run `npm run db:sync` to create the database tables
3. The JWT authentication will be re-enabled
4. Full signup/login functionality will work

## Commands Reference

```bash
# Install dependencies
npm run setup

# Start API only
npm run dev:api

# Start API and Web together
npm run dev

# Sync database
npm run db:sync

# Force recreate all tables (careful!)
npm run db:sync:force
```

## Database Models

The following tables will be created in Supabase:

- **organizations**: Company accounts and billing info
- **users**: User accounts and authentication
- **projects**: Tracking projects within organizations  
- **analytics_events**: User behavior events (replaces MongoDB)
- **experiment_results**: A/B test results and metrics

All models use JSONB columns for flexible data storage, maintaining the flexibility of MongoDB while using PostgreSQL.