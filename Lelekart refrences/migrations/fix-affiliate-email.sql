-- Step 1: Add the column as nullable
ALTER TABLE affiliate_marketing ADD COLUMN email TEXT;

-- Step 2: Set a default email for all existing rows
UPDATE affiliate_marketing SET email = 'unknown@example.com' WHERE email IS NULL;

-- Step 3: Make the column NOT NULL
ALTER TABLE affiliate_marketing ALTER COLUMN email SET NOT NULL; 