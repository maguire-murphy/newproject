import { Request, Response } from 'express';
import { AnalyticsEvent } from '../models/AnalyticsEvent';
import { Project } from '../models/Project';
import { Experiment, ExperimentStatus } from '../models/Experiment';
import { Variant } from '../models/Variant';
import { ExperimentResults } from '../models/ExperimentResults';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class TrackingController {
  static async track(req: Request, res: Response) {
    try {
      const { trackingId } = req.params;
      const { userId, eventType, properties, context } = req.body;

      // Find project by tracking ID
      const project = await Project.findOne({
        where: { trackingId, isActive: true },
      });

      if (!project) {
        return res.status(404).json({ error: 'Invalid tracking ID' });
      }

      // Get active experiments for this project
      const experiments = await Experiment.findAll({
        where: {
          projectId: project.id,
          status: ExperimentStatus.RUNNING,
        },
        include: [Variant],
      });

      // Determine variant assignments for each experiment
      const assignments: any = {};
      for (const experiment of experiments) {
        const variant = TrackingController.assignVariant(userId, experiment);
        if (variant) {
          assignments[experiment.id] = variant.id;
        }
      }

      // Store event
      const event = await AnalyticsEvent.create({
        organizationId: project.organizationId,
        projectId: project.id,
        userId,
        eventType,
        properties,
        context: {
          ...context,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          referrer: req.headers.referrer,
        },
        sessionId: req.body.sessionId || TrackingController.generateSessionId(userId),
        timestamp: new Date(),
      });

      // Update experiment results if this is a conversion event
      if (properties?.conversion) {
        for (const [experimentId, variantId] of Object.entries(assignments)) {
          await TrackingController.updateExperimentResults(
            experimentId as string,
            variantId as string,
            userId
          );
        }
      }

      // Return variant assignments for the tracker to apply
      res.json({
        success: true,
        eventId: event.id,
        assignments,
      });
    } catch (error) {
      logger.error('Event tracking error:', error);
      res.status(500).json({ error: 'Failed to track event' });
    }
  }

  static async batch(req: Request, res: Response) {
    try {
      const { trackingId } = req.params;
      const { events } = req.body;

      const project = await Project.findOne({
        where: { trackingId, isActive: true },
      });

      if (!project) {
        return res.status(404).json({ error: 'Invalid tracking ID' });
      }

      // Process events in batch
      const eventPromises = events.map((event: any) =>
        AnalyticsEvent.create({
          organizationId: project.organizationId,
          projectId: project.id,
          ...event,
          timestamp: new Date(event.timestamp || Date.now()),
        })
      );

      await Promise.all(eventPromises);

      res.json({ success: true, count: events.length });
    } catch (error) {
      logger.error('Batch tracking error:', error);
      res.status(500).json({ error: 'Failed to track batch events' });
    }
  }

  static async getAssignments(req: Request, res: Response) {
    try {
      const { trackingId } = req.params;
      const { userId } = req.body;

      const project = await Project.findOne({
        where: { trackingId, isActive: true },
      });

      if (!project) {
        return res.status(404).json({ error: 'Invalid tracking ID' });
      }

      // Get active experiments for this project
      const experiments = await Experiment.findAll({
        where: {
          projectId: project.id,
          status: ExperimentStatus.RUNNING,
        },
        include: [Variant],
      });

      // Determine variant assignments
      const assignments: any = {};
      const interventions: any = {};

      for (const experiment of experiments) {
        const variant = TrackingController.assignVariant(userId, experiment);
        if (variant) {
          assignments[experiment.id] = variant.id;
          interventions[experiment.id] = {
            variantId: variant.id,
            variantName: variant.name,
            interventionType: experiment.interventionType,
            configuration: variant.configuration,
          };
        }
      }

      res.json({ assignments, interventions });
    } catch (error) {
      logger.error('Get assignments error:', error);
      res.status(500).json({ error: 'Failed to get assignments' });
    }
  }

  static assignVariant(userId: string, experiment: Experiment): Variant | null {
    // Check traffic allocation
    const trafficHash = TrackingController.hash(`${experiment.id}-traffic-${userId}`);
    const trafficPercentage = (trafficHash % 100) + 1;
    
    if (trafficPercentage > experiment.trafficAllocation) {
      return null; // User not in experiment
    }

    // Deterministic variant assignment based on user ID
    const variantHash = TrackingController.hash(`${experiment.id}-variant-${userId}`);
    const variantPercentage = (variantHash % 100) + 1;

    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weightPercentage;
      if (variantPercentage <= cumulativeWeight) {
        return variant;
      }
    }

    return experiment.variants[0]; // Fallback to control
  }

  static hash(input: string): number {
    const hash = crypto.createHash('md5').update(input).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  static generateSessionId(userId: string): string {
    return crypto
      .createHash('sha256')
      .update(`${userId}-${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  static async updateExperimentResults(
    experimentId: string,
    variantId: string,
    userId: string
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Find or create today's results
    let results = await ExperimentResults.findOne({
      where: {
        experimentId,
        variantId,
        date: today,
      },
    });

    if (!results) {
      results = await ExperimentResults.create({
        id: crypto.randomUUID(),
        experimentId,
        variantId,
        date: today,
        uniqueUsers: 0,
        conversions: 0,
        conversionRate: 0,
      });
    }

    // Update metrics (in production, use atomic operations)
    await results.update({
      conversions: results.conversions + 1,
      conversionRate: (results.conversions + 1) / Math.max(results.uniqueUsers, 1),
    });
  }
}