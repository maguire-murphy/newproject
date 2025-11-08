import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/database';
import { 
  Organization, 
  User, 
  Project, 
  Experiment, 
  Variant, 
  BehavioralTemplate,
  BehavioralInterventionType,
  ExperimentStatus,
  ExperimentType,
  PlanTier,
  UserRole
} from '../models';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Sync database
    await sequelize.sync({ alter: true });

    // Create sample organization
    const org = await Organization.create({
      id: uuidv4(),
      name: 'Demo Company',
      subdomain: 'demo',
      planTier: PlanTier.GROWTH,
      monthlyEventLimit: 100000,
      currentMonthEvents: 45231,
    });

    console.log('✅ Organization created');

    // Create sample user
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    const user = await User.create({
      id: uuidv4(),
      email: 'demo@example.com',
      passwordHash: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.OWNER,
      organizationId: org.id,
      emailVerified: true,
    });

    console.log('✅ User created (email: demo@example.com, password: demo123456)');

    // Create sample projects
    const project1 = await Project.create({
      id: uuidv4(),
      name: 'Main SaaS Application',
      domain: 'https://app.example.com',
      trackingId: Project.generateTrackingId(),
      organizationId: org.id,
      isActive: true,
    });

    const project2 = await Project.create({
      id: uuidv4(),
      name: 'Marketing Website',
      domain: 'https://www.example.com',
      trackingId: Project.generateTrackingId(),
      organizationId: org.id,
      isActive: true,
    });

    console.log('✅ Projects created');

    // Create behavioral templates
    const templates = [
      {
        interventionType: BehavioralInterventionType.LOSS_AVERSION,
        name: 'Trial Expiration Warning',
        description: 'Emphasize features users will lose when trial ends',
        effectivenessScore: 8.5,
      },
      {
        interventionType: BehavioralInterventionType.SOCIAL_PROOF,
        name: 'User Activity Feed',
        description: 'Show real-time activity of other users',
        effectivenessScore: 7.8,
      },
      {
        interventionType: BehavioralInterventionType.PROGRESS_INDICATORS,
        name: 'Onboarding Progress Bar',
        description: 'Visual progress through setup steps',
        effectivenessScore: 9.2,
      },
    ];

    for (const template of templates) {
      await BehavioralTemplate.create({
        id: uuidv4(),
        ...template,
        defaultConfiguration: {},
        bestPractices: {
          dos: ['Test with your audience', 'Measure impact'],
          donts: ['Overuse', 'Mislead users'],
        },
      });
    }

    console.log('✅ Behavioral templates created');

    // Create sample experiments with variants
    const experiment1 = await Experiment.create({
      id: uuidv4(),
      name: 'Onboarding Completion Rate Optimization',
      description: 'Testing progress indicators to improve onboarding completion',
      hypothesis: 'Adding a progress bar will increase onboarding completion by 25%',
      type: ExperimentType.AB_TEST,
      status: ExperimentStatus.RUNNING,
      interventionType: BehavioralInterventionType.PROGRESS_INDICATORS,
      projectId: project1.id,
      successMetrics: {
        primaryMetric: 'onboarding_completion_rate',
        secondaryMetrics: ['time_to_complete', 'feature_adoption'],
        minimumSampleSize: 1000,
        confidenceLevel: 0.95,
      },
      trafficAllocation: 100,
      targetingRules: {
        userSegments: ['new_users'],
      },
      createdBy: user.id,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
    });

    await Variant.create({
      id: uuidv4(),
      name: 'Control',
      description: 'No progress indicator',
      experimentId: experiment1.id,
      isControl: true,
      weightPercentage: 50,
      configuration: {},
    });

    await Variant.create({
      id: uuidv4(),
      name: 'Progress Bar',
      description: 'Shows visual progress through onboarding',
      experimentId: experiment1.id,
      isControl: false,
      weightPercentage: 50,
      configuration: {
        showProgressBar: true,
        showStepNumbers: true,
        showPercentage: true,
      },
    });

    const experiment2 = await Experiment.create({
      id: uuidv4(),
      name: 'Upgrade Prompt Optimization',
      description: 'Testing loss aversion messaging for plan upgrades',
      hypothesis: 'Loss aversion messaging will increase upgrade conversion by 15%',
      type: ExperimentType.AB_TEST,
      status: ExperimentStatus.RUNNING,
      interventionType: BehavioralInterventionType.LOSS_AVERSION,
      projectId: project1.id,
      successMetrics: {
        primaryMetric: 'upgrade_conversion_rate',
        minimumSampleSize: 500,
        confidenceLevel: 0.95,
      },
      trafficAllocation: 50,
      createdBy: user.id,
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    });

    await Variant.create({
      id: uuidv4(),
      name: 'Control',
      description: 'Standard upgrade messaging',
      experimentId: experiment2.id,
      isControl: true,
      weightPercentage: 50,
      configuration: {
        message: 'Upgrade to Pro for advanced features',
      },
    });

    await Variant.create({
      id: uuidv4(),
      name: 'Loss Aversion',
      description: 'Emphasizes what users will lose',
      experimentId: experiment2.id,
      isControl: false,
      weightPercentage: 50,
      configuration: {
        message: "Don't lose access to your analytics data - upgrade before trial ends",
        urgency: true,
      },
    });

    const experiment3 = await Experiment.create({
      id: uuidv4(),
      name: 'Social Proof in Signup Flow',
      description: 'Testing social proof to increase signup conversion',
      hypothesis: 'Showing company logos will increase signup rate by 20%',
      type: ExperimentType.AB_TEST,
      status: ExperimentStatus.DRAFT,
      interventionType: BehavioralInterventionType.SOCIAL_PROOF,
      projectId: project2.id,
      successMetrics: {
        primaryMetric: 'signup_conversion_rate',
        minimumSampleSize: 2000,
        confidenceLevel: 0.95,
      },
      trafficAllocation: 100,
      createdBy: user.id,
    });

    await Variant.create({
      id: uuidv4(),
      name: 'Control',
      description: 'No social proof',
      experimentId: experiment3.id,
      isControl: true,
      weightPercentage: 50,
      configuration: {},
    });

    await Variant.create({
      id: uuidv4(),
      name: 'Company Logos',
      description: 'Shows logos of companies using the product',
      experimentId: experiment3.id,
      isControl: false,
      weightPercentage: 50,
      configuration: {
        showLogos: true,
        companies: ['Google', 'Microsoft', 'Amazon', 'Apple'],
      },
    });

    console.log('✅ Experiments and variants created');

    console.log('\n========================================');
    console.log('🎉 Database seeded successfully!');
    console.log('========================================');
    console.log('\n📧 Login Credentials:');
    console.log('Email: demo@example.com');
    console.log('Password: demo123456');
    console.log('\n🚀 You can now test the complete system!');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedDatabase();