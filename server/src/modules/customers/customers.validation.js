import { z } from 'zod';
import { isValidEthiopianPhone, normalizeEthiopianPhone } from '../../utils/phone.js';

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(1, 'Phone number is required')
    .refine((val) => isValidEthiopianPhone(val), {
      message: 'Invalid Ethiopian phone number. Must start with 9 (Ethio Telecom) or 7 (Safaricom) with 9 digits (e.g. +251 9... / 7...).',
    })
    .transform((val) => normalizeEthiopianPhone(val)),
  block: z.string().trim().max(50).optional().nullable(),
  house_number: z.string().trim().max(20).optional().nullable(),
  language: z.string().max(10).default('am'),
  notes: z.string().trim().optional().nullable(),
});

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((val) => !val || isValidEthiopianPhone(val), {
      message: 'Invalid Ethiopian phone number. Must start with 9 (Ethio Telecom) or 7 (Safaricom) with 9 digits.',
    })
    .transform((val) => (val ? normalizeEthiopianPhone(val) : null)),
  block: z.string().trim().max(50).optional().nullable(),
  house_number: z.string().trim().max(20).optional().nullable(),
  language: z.string().max(10).optional(),
  notes: z.string().trim().optional().nullable(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['active', 'blacklisted']),
  blacklist_reason: z.string().optional().nullable(),
});

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'blacklisted', 'all']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
});
