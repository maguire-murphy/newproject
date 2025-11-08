# BehaviorOpt API

Backend API service for the BehaviorOpt behavioral economics platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Configure your database and Redis connections in .env

# Setup database
npm run setup

# Start development server
npm run dev

# Start production server
npm run build && npm start
```

## 📁 Project Structure

```
src/
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/         # Database models (Sequelize)
├── routes/         # API route definitions
├── scripts/        # Utility scripts and database operations
├── utils/          # Utility functions
└── config/         # Configuration files
```

## 🔐 Authentication System

The API uses a secure JWT-based authentication system with httpOnly cookies for enhanced security.

### Authentication Flow

1. **User Registration/Login** → Server generates JWT tokens
2. **Tokens stored in httpOnly cookies** → Automatic inclusion in subsequent requests
3. **Automatic token refresh** → Seamless session management
4. **Secure logout** → Proper token cleanup

### Authentication Endpoints

| Endpoint | Method | Purpose | Body Parameters |
|----------|--------|---------|-----------------|
| `/api/auth/signup` | POST | User registration | `firstName`, `lastName`, `email`, `password`, `organizationName` |
| `/api/auth/login` | POST | User authentication | `email`, `password` |
| `/api/auth/me` | GET | Get current user info | None (requires authentication) |
| `/api/auth/refresh` | POST | Refresh access token | None (uses refresh token from cookies) |
| `/api/auth/logout` | POST | User logout | None |

### Response Format

All API responses follow a standardized format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly error message",
  "details": [
    // Optional validation error details
  ]
}
```

### Authentication Features

- **HttpOnly Cookies**: JWT tokens are stored in secure, httpOnly cookies to prevent XSS attacks
- **Automatic Refresh**: Access tokens are automatically refreshed using refresh tokens
- **Token Validation**: All protected routes validate JWT tokens via middleware
- **Session Management**: Proper token cleanup on logout
- **User Context**: Authentication middleware provides user and organization context

### User & Organization Model

**User Object:**
```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}
```

**Organization Object:**
```typescript
{
  id: string;
  name: string;
  subdomain: string;
  planTier: string;
}
```

## 🛠 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run db:sync` | Synchronize database models |
| `npm run db:sync:force` | Force synchronize (drops existing tables) |
| `npm run db:seed` | Seed database with sample data |
| `npm run setup` | Full setup (sync + seed) |
| `npm run reset` | Reset database (force sync + seed) |
| `npm run test:auth` | Run basic authentication tests |
| `npm run test:full-auth` | Run comprehensive authentication tests |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## 🏗 Architecture

### Database
- **PostgreSQL** (via Supabase) for relational data
- **Redis** (via Upstash) for caching and session storage
- **Sequelize ORM** for database operations

### Security
- **Helmet.js** for security headers
- **CORS** configuration for cross-origin requests
- **Rate limiting** to prevent abuse
- **Input validation** using express-validator
- **Secure cookie settings** with httpOnly, secure, and sameSite flags

### API Design
- **RESTful endpoints** following standard conventions
- **Consistent response format** across all endpoints
- **Proper HTTP status codes** for different scenarios
- **Comprehensive error handling** with user-friendly messages

## 🧪 Testing

### Authentication Testing

Run the comprehensive authentication test suite:

```bash
npm run test:full-auth
```

This tests the complete authentication flow:
- User registration with validation
- Login with credential verification
- Protected route access (`/auth/me`)
- Token refresh mechanism
- Logout functionality
- Cookie handling and security

### Manual Testing

Use the basic auth test for quick verification:

```bash
npm run test:auth
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example`):

```env
# Server
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=30d

# Database
DATABASE_URL=your-postgresql-url

# Redis
REDIS_URL=your-redis-url

# CORS
CLIENT_URL=http://localhost:3000
```

### Database Setup

The API uses Sequelize with automatic model synchronization:

1. Configure `DATABASE_URL` in your `.env` file
2. Run `npm run setup` to initialize the database
3. Models will be automatically synchronized

## 📝 API Documentation

### Protected Routes

Most API endpoints require authentication. The JWT token is automatically included via httpOnly cookies.

### Error Handling

The API provides detailed error messages for debugging and user feedback:

- **Validation errors** include field-specific details
- **Authentication errors** provide clear guidance
- **Server errors** are logged for debugging while returning safe messages to clients

### Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Limit**: 100 requests per 15-minute window per IP
- **Scope**: Applied to all `/api/` routes
- **Response**: HTTP 429 with retry information

## 🔒 Security Best Practices

This API implements several security best practices:

1. **JWT tokens in httpOnly cookies** - Prevents XSS token theft
2. **Secure cookie attributes** - httpOnly, secure (HTTPS), sameSite
3. **Token rotation** - Access tokens have short expiry with refresh mechanism
4. **Input validation** - All endpoints validate input data
5. **SQL injection prevention** - Using parameterized queries via Sequelize
6. **Rate limiting** - Prevents brute force and abuse
7. **Security headers** - Helmet.js applies comprehensive security headers
8. **CORS configuration** - Restricted to trusted origins

## 🚨 Important Notes

- **Never expose JWT secrets** in client-side code
- **Always use HTTPS in production** for secure cookie transmission
- **Regularly rotate JWT secrets** for enhanced security
- **Monitor rate limiting** to detect potential attacks
- **Keep dependencies updated** for security patches

## 💡 Development Tips

- Use `npm run dev` for development with hot reload
- Run `npm run test:full-auth` before deploying changes
- Check `npm run lint` and `npm run typecheck` for code quality
- Monitor server logs for authentication issues
- Use the `/health` endpoint for service monitoring