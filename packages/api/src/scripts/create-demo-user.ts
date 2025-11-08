import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/database';
import { User, Organization, UserRole, PlanTier } from '../models';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const createDemoUser = async () => {
  try {
    console.log('🔍 Creating demo user...');

    await sequelize.sync();

    // Delete existing demo user if exists
    await User.destroy({
      where: { email: 'demo@example.com' }
    });

    // Find or create demo organization
    let org = await Organization.findOne({
      where: { subdomain: 'demo' }
    });

    if (!org) {
      org = await Organization.create({
        id: uuidv4(),
        name: 'Demo Company',
        subdomain: 'demo',
        planTier: PlanTier.GROWTH,
        monthlyEventLimit: 100000,
        currentMonthEvents: 45231,
      });
      console.log('✅ Organization created');
    } else {
      console.log('✅ Organization found');
    }

    // Create new demo user (let the BeforeCreate hook hash the password)
    const user = await User.create({
      id: uuidv4(),
      email: 'demo@example.com',
      passwordHash: 'demo123456', // Raw password - will be hashed by BeforeCreate hook
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.OWNER,
      organizationId: org.id,
      emailVerified: true,
    });
    
    console.log('🔑 Password hash stored:', user.passwordHash);

    console.log('✅ Demo user created');
    console.log('📧 Email: demo@example.com');
    console.log('🔑 Password: demo123456');
    console.log('🏢 Organization:', org.name);

    // Test password validation
    const isValid = await user.validatePassword('demo123456');
    console.log('🧪 Password validation test:', isValid ? '✅ PASS' : '❌ FAIL');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
};

createDemoUser();