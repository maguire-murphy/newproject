import { Router } from 'express';
import { body, query } from 'express-validator';
import { ExperimentController } from '../controllers/experiment.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.OWNER),
  [
    body('projectId').isUUID(),
    body('name').notEmpty().trim(),
    body('hypothesis').notEmpty(),
    body('interventionType').notEmpty(),
    body('variants').isArray({ min: 2 }),
    body('successMetrics.primaryMetric').notEmpty(),
  ],
  ExperimentController.create
);

router.get('/', ExperimentController.list);
router.get('/stats/overview', ExperimentController.getStatsOverview);
router.get('/:id', ExperimentController.get);

router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.OWNER),
  ExperimentController.update
);

router.post(
  '/:id/start',
  authorize(UserRole.ADMIN, UserRole.OWNER),
  ExperimentController.start
);

router.post(
  '/:id/pause',
  authorize(UserRole.ADMIN, UserRole.OWNER),
  ExperimentController.pause
);

router.post(
  '/:id/complete',
  authorize(UserRole.ADMIN, UserRole.OWNER),
  ExperimentController.complete
);

router.get('/:id/results', ExperimentController.getResults);

export default router;