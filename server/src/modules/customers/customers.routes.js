import { Router } from 'express';
import * as customersController from './customers.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  updateStatusSchema,
  customerQuerySchema,
} from './customers.validation.js';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

router.get('/', validate(customerQuerySchema, 'query'), customersController.listCustomers);
router.get('/:id', customersController.getCustomer);
router.post('/', validate(createCustomerSchema), customersController.createCustomer);
router.put('/:id', validate(updateCustomerSchema), customersController.updateCustomer);
router.patch('/:id/status', validate(updateStatusSchema), customersController.updateStatus);
router.delete('/:id', customersController.deleteCustomer);

export default router;
