import { Router, Response } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { Project } from '../models/Project';
import { UserRole } from '../models/User';
import { validationResult } from 'express-validator';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.OWNER),
  [
    body('name').notEmpty().trim(),
    body('domain').isURL(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const project = await Project.create({
        ...req.body,
        organizationId: req.organization!.id,
        trackingId: Project.generateTrackingId(),
      });

      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const projects = await Project.findAll({
      where: { organizationId: req.organization!.id },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        organizationId: req.organization!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Temporary endpoint to create default projects for existing organizations
router.post('/setup-defaults', authorize(UserRole.OWNER), async (req: AuthRequest, res) => {
  try {
    const org = req.organization!;
    
    // Check if organization already has projects
    const existingProjects = await Project.findAll({
      where: { organizationId: org.id }
    });

    if (existingProjects.length === 0) {
      const { v4: uuidv4 } = require('uuid');
      
      const project = await Project.create({
        id: uuidv4(),
        name: 'Default Project',
        domain: org.subdomain + '.com',
        organizationId: org.id,
        trackingId: `track_${uuidv4().slice(0, 8)}`,
        isActive: true,
      });

      res.json({ 
        message: 'Default project created successfully',
        project 
      });
    } else {
      res.json({ 
        message: 'Organization already has projects',
        projects: existingProjects 
      });
    }
  } catch (error) {
    console.error('Setup defaults error:', error);
    res.status(500).json({ error: 'Failed to setup default project' });
  }
});

export default router;