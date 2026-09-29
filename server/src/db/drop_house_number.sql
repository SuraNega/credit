-- Migration: Drop house_number column from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS house_number;
