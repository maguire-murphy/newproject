import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/simple-auth.controller';
// import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('organizationName').notEmpty().trim(),
  ],
  AuthController.signup
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  AuthController.login
);

router.post('/logout', AuthController.logout);

export default router;