-- Migration: Update decision categories to new model
-- Run this in your Supabase SQL editor

-- Step 1: Migrate existing data
-- Map old categories to new ones
UPDATE decisions
SET category = 'career'
WHERE category = 'work';

UPDATE decisions
SET category = 'relationships'
WHERE category = 'relationship';

-- Step 2: Update the CHECK constraint to allow new categories
ALTER TABLE decisions
  DROP CONSTRAINT IF EXISTS decisions_category_check;

ALTER TABLE decisions
  ADD CONSTRAINT decisions_category_check 
  CHECK (category IN ('career', 'money', 'health', 'relationships', 'life_lifestyle', 'growth_learning', 'time_priorities', 'other'));

-- Step 3: Verify migration
-- Check for any decisions that still have old categories (should return 0 rows)
SELECT category, COUNT(*) 
FROM decisions 
WHERE category NOT IN ('career', 'money', 'health', 'relationships', 'life_lifestyle', 'growth_learning', 'time_priorities', 'other')
GROUP BY category;

-- Add comment for clarity
COMMENT ON COLUMN decisions.category IS 'Life domain category: career, money, health, relationships, life_lifestyle, growth_learning, time_priorities, other';


