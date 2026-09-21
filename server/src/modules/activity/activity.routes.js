import { Router } from 'express';
import * as activityController from './activity.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Activity log
router.get('/activity', activityController.listActivity);
router.get('/activity/customer/:id', activityController.listCustomerActivity);

// Dashboard
router.get('/dashboard/summary', activityController.getDashboardSummary);
router.get('/dashboard/top-debtors', activityController.getTopDebtors);

export default router;
