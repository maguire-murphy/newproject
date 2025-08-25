import { Router } from 'express';
import { TrackingController } from '../controllers/tracking.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

// Higher rate limit for tracking endpoints
const trackingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
});

router.use(trackingLimiter);

router.post('/:trackingId/track', TrackingController.track);
router.post('/:trackingId/batch', TrackingController.batch);
router.post('/:trackingId/assignments', TrackingController.getAssignments);

export default router;