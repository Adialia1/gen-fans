-- Add missing columns to reference_models table
ALTER TABLE reference_models ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]';
ALTER TABLE reference_models ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0;
ALTER TABLE reference_models ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add missing columns to custom_models table
ALTER TABLE custom_models ADD COLUMN IF NOT EXISTS model_url text;
ALTER TABLE custom_models ADD COLUMN IF NOT EXISTS training_metadata jsonb;
ALTER TABLE custom_models ADD COLUMN IF NOT EXISTS deleted_at timestamp;

-- Update jobs table columns
ALTER TABLE jobs RENAME COLUMN input_params TO input_data;
ALTER TABLE jobs RENAME COLUMN estimated_credit_cost TO estimated_credits;
ALTER TABLE jobs DROP COLUMN IF EXISTS actual_credit_cost;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS error jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS queued_at timestamp NOT NULL DEFAULT NOW();
ALTER TABLE jobs DROP COLUMN IF EXISTS error_details;
ALTER TABLE jobs DROP COLUMN IF EXISTS fal_job_id;

-- Update credit_transactions table
ALTER TABLE credit_transactions RENAME COLUMN type TO transaction_type;
