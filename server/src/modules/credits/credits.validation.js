import { z } from 'zod';

export const createCreditSchema = z.object({
  item: z.string().min(1, 'Item name is required').max(200),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  credit_date: z.string().datetime().optional(),
  due_date: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCreditSchema = z.object({
  item: z.string().min(1).max(200).optional(),
  amount: z.coerce.number().positive('Amount must be greater than 0').optional(),
  due_date: z.string().datetime().optional().nullable(),
  status: z.enum(['unpaid', 'partial', 'paid']).optional(),
  notes: z.string().optional().nullable(),
});
