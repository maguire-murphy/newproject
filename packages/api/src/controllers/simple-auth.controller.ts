import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User, UserRole } from '../models/User';
import { Organization, PlanTier } from '../models/Organization';
import { logger } from '../utils/logger';

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
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}