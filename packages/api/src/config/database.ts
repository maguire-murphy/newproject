import { Sequelize } from 'sequelize-typescript';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Experiment } from '../models/Experiment';
import { Variant } from '../models/Variant';
import { BehavioralTemplate } from '../models/BehavioralTemplate';
import { AnalyticsEvent } from '../models/AnalyticsEvent';
import { ExperimentResults } from '../models/ExperimentResults';

// PostgreSQL connection with Supabase
export const sequelize = new Sequelize(process.env.DATABASE_URL || '', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  models: [Organization, User, Project, Experiment, Variant, BehavioralTemplate, AnalyticsEvent, ExperimentResults],
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Redis connection with Upstash
export const redis = process.env.UPSTASH_REDIS_URL 
  ? new Redis(process.env.UPSTASH_REDIS_URL)
  : null;

if (redis) {
  redis.on('connect', () => {
    logger.info('Redis (Upstash) connected successfully');
  });

  redis.on('error', (err) => {
    logger.error('Redis (Upstash) connection error:', err);
  });
}

// Test connections
export const testConnections = async () => {
  try {
    // Test PostgreSQL
    await sequelize.authenticate();
    logger.info('PostgreSQL (Supabase) connected successfully');
    
    // Test Redis if configured
    if (redis) {
      const redisStatus = await redis.ping();
      if (redisStatus === 'PONG') {
        logger.info('Redis (Upstash) connection verified');
      }
    } else {
      logger.warn('Redis not configured - using in-memory fallback for sessions');
    }
    
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// In-memory cache fallback if Redis is not available
class InMemoryCache {
  private store: Map<string, { value: string; expiry?: number }> = new Map();
  
  async set(key: string, value: string, mode?: string, duration?: number): Promise<void> {
    const expiry = duration ? Date.now() + (duration * 1000) : undefined;
    this.store.set(key, { value, expiry });
  }
  
  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Export cache interface that works with or without Redis
export const cache = redis || new InMemoryCache();

// Remove MongoDB connection - no longer needed