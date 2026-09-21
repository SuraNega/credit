import { Router } from 'express';
import * as paymentsController from './payments.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createPaymentSchema } from './payments.validation.js';

const router = Router();

router.use(authenticate);

// Nested under /api/customers/:id/payments
router.get('/customers/:id/payments', paymentsController.listPayments);
router.post('/customers/:id/payments', validate(createPaymentSchema), paymentsController.createPayment);

// Direct access by payment ID
router.delete('/payments/:id', paymentsController.deletePayment);

export default router;
