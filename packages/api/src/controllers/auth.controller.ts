import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { Organization, PlanTier } from '../models/Organization';
import { logger } from '../utils/logger';
import { cache } from '../config/database';

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName, organizationName } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create organization
      const subdomain = organizationName.toLowerCase().replace(/\s+/g, '-');
      const organization = await Organization.create({
        name: organizationName,
        subdomain,
        planTier: PlanTier.FREE,
      });

      // Create user
      const user = await User.create({
        email,
        passwordHash: password, // Will be hashed by beforeCreate hook
        firstName,
        lastName,
        role: UserRole.OWNER,
        organizationId: organization.id,
      });

      // Generate tokens
      const token = jwt.sign(
        { userId: user.id, organizationId: organization.id },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, organizationId: organization.id },
        process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
      );

      // Store refresh token in cache
      await cache.set(
        `refresh_token:${user.id}`,
        refreshToken,
        'EX',
        30 * 24 * 60 * 60 // 30 days
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
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
    } catch (error) {
      logger.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
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
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate tokens
      const token = jwt.sign(
        { userId: user.id, organizationId: user.organizationId },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, organizationId: user.organizationId },
        process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
      );

      // Store refresh token in cache
      await cache.set(
        `refresh_token:${user.id}`,
        refreshToken,
        'EX',
        30 * 24 * 60 * 60
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
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
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const token = req.cookies?.refreshToken;
      if (token) {
        const decoded = jwt.decode(token) as any;
        if (decoded?.userId) {
          await cache.del(`refresh_token:${decoded.userId}`);
        }
      }

      res.clearCookie('token');
      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret') as any;
      
      // Verify refresh token exists in cache
      const storedToken = await cache.get(`refresh_token:${decoded.userId}`);
      if (storedToken !== refreshToken) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Generate new access token
      const token = jwt.sign(
        { userId: decoded.userId, organizationId: decoded.organizationId },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }
}