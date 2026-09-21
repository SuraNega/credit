import { Router } from 'express';
import * as creditsController from './credits.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createCreditSchema, updateCreditSchema } from './credits.validation.js';

const router = Router();

router.use(authenticate);

// Nested under /api/customers/:id/credits
router.get('/customers/:id/credits', creditsController.listCredits);
router.post('/customers/:id/credits', validate(createCreditSchema), creditsController.createCredit);

// Direct access by credit ID
router.put('/credits/:id', validate(updateCreditSchema), creditsController.updateCredit);
router.delete('/credits/:id', creditsController.deleteCredit);

export default router;
