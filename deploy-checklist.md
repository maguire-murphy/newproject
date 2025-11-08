# Deployment Checklist

## Pre-Deployment ✅
- [x] All core functionality implemented
- [x] Database models created and synced
- [x] Authentication system working
- [x] Sample data seeded
- [x] JWT secrets generated
- [x] Environment variables configured
- [x] API documentation complete (via routes)

## Environment Variables Needed for Production

### Required for Backend (API)
```bash
# Server Configuration
NODE_ENV=production
PORT=4000
API_URL=https://your-api-domain.com
CLIENT_URL=https://your-frontend-domain.com

# Database (Supabase)
DATABASE_URL=postgresql://user:password@host:port/database

# Redis Cache (Upstash)
UPSTASH_REDIS_URL=redis://user:password@host:port

# JWT Security (Generate new for production!)
JWT_SECRET=your_production_jwt_secret_64_chars_minimum
JWT_REFRESH_SECRET=your_production_refresh_secret_64_chars_minimum
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=30d

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_live_your_stripe_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_GROWTH=price_growth_tier_id
STRIPE_PRICE_ID_SCALE=price_scale_tier_id

# Email Service (Optional)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_app_password
```

### Required for Frontend (React)
```bash
# API Configuration
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Environment
NODE_ENV=production
```

## Deployment Steps

### Option A: Railway (Recommended for Quick Start)

#### Backend Deployment
1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy API**
   ```bash
   cd packages/api
   railway init
   railway up
   ```

3. **Configure Environment Variables**
   - Add all production environment variables in Railway dashboard
   - Generate new JWT secrets: `npm run generate:secrets`
   - Update database connection strings

4. **Run Database Setup**
   ```bash
   # In Railway console or via deployment script
   npm run setup
   ```

#### Frontend Deployment
1. **Deploy to Vercel**
   ```bash
   cd packages/web
   npm install -g vercel
   vercel
   ```

2. **Configure Environment Variables**
   - Set `REACT_APP_API_URL` to your Railway API URL
   - Add Stripe publishable key

### Option B: Traditional Cloud Providers

#### Backend Options
- **AWS**: Elastic Beanstalk, EC2, or Lambda
- **Google Cloud**: Cloud Run, App Engine, or Compute Engine
- **Azure**: App Service or Container Instances
- **DigitalOcean**: App Platform or Droplets

#### Frontend Options
- **Vercel** (Recommended)
- **Netlify**
- **AWS S3** + CloudFront
- **Firebase Hosting**

## Post-Deployment Verification

### ✅ API Health Checks
- [ ] Health endpoint: `GET /health`
- [ ] Database connectivity working
- [ ] Redis cache working (graceful degradation if offline)
- [ ] Authentication endpoints working

### ✅ Frontend Functionality
- [ ] Application loads successfully
- [ ] Login/signup flow works
- [ ] Dashboard displays data
- [ ] Experiments list loads
- [ ] Analytics charts render

### ✅ Integration Tests
- [ ] Full user registration flow
- [ ] Login → Dashboard → Experiments flow
- [ ] API authentication working
- [ ] CORS configured properly

## Security Checklist

### ✅ Production Security
- [ ] New JWT secrets generated (not from development)
- [ ] Database credentials secured
- [ ] API keys stored in environment variables
- [ ] HTTPS enforced on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation active

### ✅ Monitoring Setup
- [ ] Error tracking (e.g., Sentry)
- [ ] Uptime monitoring (e.g., UptimeRobot)
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Log aggregation

## Quick Commands for Testing

### Test Authentication Flow
```bash
# In packages/api directory
npm run test:auth
```

### Reset Database (Development Only)
```bash
# WARNING: This will delete all data!
npm run reset
```

### Generate New JWT Secrets
```bash
npm run generate:secrets
```

## Success Criteria ✅

Once deployed, verify these work:

1. **API Health**: `https://your-api.domain.com/health` returns 200
2. **Frontend Load**: `https://your-app.domain.com` loads React app
3. **Authentication**: Can login with demo credentials:
   - Email: `demo@example.com`
   - Password: `demo123456`
4. **Data Display**: Dashboard shows sample experiments and analytics
5. **CRUD Operations**: Can create, read, update experiments

## Rollback Plan

If deployment fails:

1. **API Issues**: 
   - Check Railway/hosting provider logs
   - Verify environment variables
   - Rollback to previous deployment

2. **Frontend Issues**:
   - Check build logs in Vercel/Netlify
   - Verify API URL configuration
   - Rollback via hosting platform

3. **Database Issues**:
   - Check connection strings
   - Verify Supabase status
   - Run database sync: `npm run db:sync`

## Performance Optimization

### After Initial Deployment
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Optimize database queries
- [ ] Add Redis caching layer
- [ ] Monitor response times
- [ ] Set up auto-scaling if needed

---

## Current Status: MVP Ready for Deployment ✅

✅ **Core Features Working**:
- User authentication & authorization
- Project & experiment management
- Behavioral intervention templates
- Analytics event tracking
- Real-time experiment results
- Complete REST API
- React frontend with routing
- Database models & relationships

✅ **Production Features**:
- Security middleware (Helmet, CORS, rate limiting)
- Environment-based configuration
- Error handling & logging
- Input validation
- JWT token management
- Database migrations support

🚀 **Ready to Deploy**: The MVP is feature-complete and ready for staging/production deployment!