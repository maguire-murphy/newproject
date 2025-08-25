import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

const syncDatabase = async () => {
  try {
    const force = process.argv.includes('--force');
    
    logger.info(`Syncing database${force ? ' (force)' : ''}...`);
    
    await sequelize.sync({ force, alter: !force });
    
    logger.info('Database synced successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database sync failed:', error);
    process.exit(1);
  }
};

syncDatabase();