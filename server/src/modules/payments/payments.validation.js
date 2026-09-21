import { z } from 'zod';

export const createPaymentSchema = z.object({
  credit_transaction_id: z.coerce.number().int().positive().optional().nullable(),
  amount_paid: z.coerce.number().positive('Payment amount must be greater than 0'),
  payment_date: z.string().datetime().optional(),
  notes: z.string().optional().nullable(),
});
