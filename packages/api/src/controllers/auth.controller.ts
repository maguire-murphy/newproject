import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../models/User';
import { Organization, PlanTier } from '../models/Organization';
import { Project } from '../models/Project';
import { logger } from '../utils/logger';
import { cache } from '../config/database';

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Please check your input and try again',
          details: errors.array().map((err: any) => ({
            field: err.param || err.path,
            message: err.msg,
            value: err.value
          }))
        });
      }

      const { email, password, firstName, lastName, organizationName } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          error: 'Email already registered',
          message: 'An account with this email address already exists. Please use a different email or try signing in.'
        });
      }

      // Create organization
      const subdomain = organizationName.toLowerCase().replace(/\s+/g, '-');
      const organization = await Organization.create({
        id: uuidv4(),
        name: organizationName,
        subdomain,
        planTier: PlanTier.FREE,
      });

      // Create default project for the organization
      await Project.create({
        id: uuidv4(),
        name: 'Default Project',
        domain: organization.subdomain + '.com',
        organizationId: organization.id,
        trackingId: `track_${uuidv4().slice(0, 8)}`,
        isActive: true,
      });

      // Create user
      const user = await User.create({
        id: uuidv4(),
        email,
        passwordHash: password, // Will be hashed by beforeCreate hook
        firstName,
        lastName,
        role: UserRole.OWNER,
        organizationId: organization.id,
      });

      // Generate tokens
      const token = (jwt.sign as any)(
        { userId: user.id, organizationId: organization.id },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
      );

      const refreshToken = (jwt.sign as any)(
        { userId: user.id, organizationId: organization.id },
        process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
      );

      // Store refresh token in cache (with fallback for Redis failures)
      try {
        await cache.set(
          `refresh_token:${user.id}`,
          refreshToken,
          'EX',
          30 * 24 * 60 * 60 // 30 days
        );
      } catch (error) {
        logger.warn('Redis cache unavailable for refresh token storage:', error);
        // Continue without Redis - authentication still works with cookies
      }

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.status(201).json({
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          subdomain: organization.subdomain,
          planTier: organization.planTier,
        },
      });
    } catch (error: any) {
      logger.error('Signup error:', error);
      
      // Handle specific database errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          error: 'Account creation failed',
          message: 'An account with this email already exists.'
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while creating your account. Please try again.'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email },
        include: [Organization],
      });

      if (!user || !(await user.validatePassword(password))) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'The email or password you entered is incorrect. Please check your credentials and try again.'
        });
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate tokens
      const token = (jwt.sign as any)(
        { userId: user.id, organizationId: user.organizationId },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
      );

      const refreshToken = (jwt.sign as any)(
        { userId: user.id, organizationId: user.organizationId },
        process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
      );

      // Store refresh token in cache (with fallback for Redis failures)
      try {
        await cache.set(
          `refresh_token:${user.id}`,
          refreshToken,
          'EX',
          30 * 24 * 60 * 60
        );
      } catch (error) {
        logger.warn('Redis cache unavailable for refresh token storage:', error);
        // Continue without Redis - authentication still works with cookies
      }

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        organization: user.organization,
        token: token, // Include token for testing
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while signing you in. Please try again.'
      });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const token = req.cookies?.refreshToken;
      if (token) {
        const decoded = jwt.decode(token) as any;
        if (decoded?.userId) {
          try {
            await cache.del(`refresh_token:${decoded.userId}`);
          } catch (error) {
            logger.warn('Redis cache unavailable for token cleanup:', error);
            // Continue without Redis - logout still works by clearing cookies
          }
        }
      }

      res.clearCookie('token');
      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while signing you out. Please try again.'
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'Refresh token required',
          message: 'Your session has expired. Please sign in again.'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret') as any;
      
      // Verify refresh token exists in cache (skip if Redis unavailable)
      try {
        const storedToken = await cache.get(`refresh_token:${decoded.userId}`);
        if (storedToken !== refreshToken) {
          return res.status(401).json({
            error: 'Invalid refresh token',
            message: 'Your session has expired. Please sign in again.'
          });
        }
      } catch (error) {
        logger.warn('Redis cache unavailable for token verification, skipping cache check:', error);
        // Continue without Redis verification - rely on JWT signature validation only
      }

      // Generate new access token
      const token = (jwt.sign as any)(
        { userId: decoded.userId, organizationId: decoded.organizationId },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Your session has expired. Please sign in again.'
      });
    }
  }

  static async getCurrentUser(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({
          error: 'User not authenticated',
          message: 'Please sign in to access this resource.'
        });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        organization: user.organization,
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while retrieving your account information. Please try again.'
      });
    }
  }
}