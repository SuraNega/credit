import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).optional().nullable(),
  block: z.string().max(50).optional().nullable(),
  house_number: z.string().max(20).optional().nullable(),
  language: z.string().max(10).default('am'),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  block: z.string().max(50).optional().nullable(),
  house_number: z.string().max(20).optional().nullable(),
  language: z.string().max(10).optional(),
  notes: z.string().optional().nullable(),
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
