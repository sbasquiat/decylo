-- Migration: Fix decisions_category_check constraint
-- This ensures the constraint matches the current category values in the code

-- Step 1: Drop the existing constraint if it exists
ALTER TABLE decisions
  DROP CONSTRAINT IF EXISTS decisions_category_check;

-- Step 2: Add the correct constraint with all valid categories
ALTER TABLE decisions
  ADD CONSTRAINT decisions_category_check 
  CHECK (category IN ('career', 'money', 'health', 'relationships', 'life_lifestyle', 'growth_learning', 'time_priorities', 'other'));

-- Step 3: Verify the constraint is in place
-- This query should return the constraint name
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'decisions'::regclass
  AND conname = 'decisions_category_check';

-- Step 4: Check for any invalid categories (should return 0 rows)
SELECT category, COUNT(*) 
FROM decisions 
WHERE category NOT IN ('career', 'money', 'health', 'relationships', 'life_lifestyle', 'growth_learning', 'time_priorities', 'other')
GROUP BY category;

-- Step 5: Update comment for clarity
COMMENT ON COLUMN decisions.category IS 'Life domain category: career, money, health, relationships, life_lifestyle, growth_learning, time_priorities, other';

