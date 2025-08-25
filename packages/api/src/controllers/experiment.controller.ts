import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Experiment, ExperimentStatus, BehavioralInterventionType } from '../models/Experiment';
import { Variant } from '../models/Variant';
import { Project } from '../models/Project';
import { AnalyticsEvent } from '../models/AnalyticsEvent';
import { ExperimentResults } from '../models/ExperimentResults';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { calculateStatistics } from '../utils/statistics';
import { behavioralInterventions } from '../config/behavioral-interventions';
import { v4 as uuidv4 } from 'uuid';

export class ExperimentController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        projectId,
        name,
        description,
        hypothesis,
        type,
        interventionType,
        successMetrics,
        variants,
        trafficAllocation = 100,
        targetingRules = {},
      } = req.body;

      // Verify project belongs to user's organization
      const project = await Project.findOne({
        where: {
          id: projectId,
          organizationId: req.organization!.id,
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Create experiment
      const experiment = await Experiment.create({
        name,
        description,
        hypothesis,
        type,
        interventionType,
        projectId,
        successMetrics,
        trafficAllocation,
        targetingRules,
        createdBy: req.user!.id,
      });

      // Create variants
      const variantPromises = variants.map((v: any, index: number) => {
        // Apply default configuration from behavioral intervention
        const defaultConfig = behavioralInterventions[interventionType as BehavioralInterventionType]?.defaultConfig || {};
        
        return Variant.create({
          experimentId: experiment.id,
          name: v.name || (index === 0 ? 'Control' : `Variant ${index}`),
          description: v.description,
          isControl: index === 0,
          weightPercentage: v.weightPercentage || (100 / variants.length),
          configuration: {
            ...defaultConfig,
            ...v.configuration,
          },
        });
      });

      const createdVariants = await Promise.all(variantPromises);

      res.status(201).json({
        experiment,
        variants: createdVariants,
      });
    } catch (error) {
      logger.error('Create experiment error:', error);
      res.status(500).json({ error: 'Failed to create experiment' });
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      const { projectId, status } = req.query;

      const whereClause: any = {};
      
      if (projectId) {
        whereClause.projectId = projectId;
      }
      
      if (status) {
        whereClause.status = status;
      }

      const experiments = await Experiment.findAll({
        where: whereClause,
        include: [
          {
            model: Project,
            where: { organizationId: req.organization!.id },
            required: true,
          },
          {
            model: Variant,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json(experiments);
    } catch (error) {
      logger.error('List experiments error:', error);
      res.status(500).json({ error: 'Failed to list experiments' });
    }
  }

  static async get(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const experiment = await Experiment.findOne({
        where: { id },
        include: [
          {
            model: Project,
            where: { organizationId: req.organization!.id },
            required: true,
          },
          {
            model: Variant,
          },
        ],
      });

      if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      res.json(experiment);
    } catch (error) {
      logger.error('Get experiment error:', error);
      res.status(500).json({ error: 'Failed to get experiment' });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const experiment = await Experiment.findOne({
        where: { id },
        include: [{
          model: Project,
          where: { organizationId: req.organization!.id },
          required: true,
        }],
      });

      if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      // Can't update running experiments
      if (experiment.status === ExperimentStatus.RUNNING) {
        return res.status(400).json({ error: 'Cannot update running experiment' });
      }

      await experiment.update(req.body);
      res.json(experiment);
    } catch (error) {
      logger.error('Update experiment error:', error);
      res.status(500).json({ error: 'Failed to update experiment' });
    }
  }

  static async start(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const experiment = await Experiment.findOne({
        where: { id },
        include: [
          {
            model: Project,
            where: { organizationId: req.organization!.id },
            required: true,
          },
          {
            model: Variant,
          },
        ],
      });

      if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      if (experiment.status !== ExperimentStatus.DRAFT && experiment.status !== ExperimentStatus.PAUSED) {
        return res.status(400).json({ error: 'Experiment must be in draft or paused status to start' });
      }

      // Verify variants total 100%
      const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weightPercentage, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        return res.status(400).json({ error: 'Variant weights must total 100%' });
      }

      await experiment.update({
        status: ExperimentStatus.RUNNING,
        startedAt: new Date(),
      });

      res.json({ message: 'Experiment started', experiment });
    } catch (error) {
      logger.error('Start experiment error:', error);
      res.status(500).json({ error: 'Failed to start experiment' });
    }
  }

  static async pause(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const experiment = await Experiment.findOne({
        where: { 
          id,
          status: ExperimentStatus.RUNNING,
        },
        include: [{
          model: Project,
          where: { organizationId: req.organization!.id },
          required: true,
        }],
      });

      if (!experiment) {
        return res.status(404).json({ error: 'Running experiment not found' });
      }

      await experiment.update({ status: ExperimentStatus.PAUSED });
      res.json({ message: 'Experiment paused', experiment });
    } catch (error) {
      logger.error('Pause experiment error:', error);
      res.status(500).json({ error: 'Failed to pause experiment' });
    }
  }

  static async complete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const experiment = await Experiment.findOne({
        where: { id },
        include: [{
          model: Project,
          where: { organizationId: req.organization!.id },
          required: true,
        }],
      });

      if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      await experiment.update({
        status: ExperimentStatus.COMPLETED,
        completedAt: new Date(),
      });

      res.json({ message: 'Experiment completed', experiment });
    } catch (error) {
      logger.error('Complete experiment error:', error);
      res.status(500).json({ error: 'Failed to complete experiment' });
    }
  }

  static async getResults(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      // Verify experiment belongs to organization
      const experiment = await Experiment.findOne({
        where: { id },
        include: [
          {
            model: Project,
            where: { organizationId: req.organization!.id },
            required: true,
          },
          {
            model: Variant,
          },
        ],
      });

      if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      // Get aggregated results
      const results = await ExperimentResults.findAll({
        where: {
          experimentId: id,
          ...(startDate && { date: { $gte: startDate } }),
          ...(endDate && { date: { $lte: endDate } }),
        },
        order: [['date', 'DESC']],
      });

      // Calculate statistical significance
      const statistics = await calculateStatistics(experiment, results);

      res.json({
        experiment,
        results,
        statistics,
      });
    } catch (error) {
      logger.error('Get experiment results error:', error);
      res.status(500).json({ error: 'Failed to get experiment results' });
    }
  }
}