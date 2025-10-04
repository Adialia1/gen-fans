-- Migration: AI Image Generation with Credit Management
-- Created: 2025-10-04
-- Description: Add 6 new tables for AI generation, custom models, jobs, and credit management

-- Table 1: reference_models (no FK dependencies)
CREATE TABLE IF NOT EXISTS "reference_models" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL,
  "category" varchar(50) NOT NULL,
  "description" text,
  "preview_images" text[] NOT NULL,
  "characteristics" jsonb NOT NULL,
  "complexity_factor" numeric(3, 2) DEFAULT '1.0' NOT NULL,
  "popularity_score" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_reference_models_category_active" ON "reference_models" ("category", "active");
CREATE INDEX IF NOT EXISTS "idx_reference_models_popularity" ON "reference_models" ("popularity_score" DESC) WHERE "active" = true;

-- Table 2: credit_pricing_config (no FK dependencies)
CREATE TABLE IF NOT EXISTS "credit_pricing_config" (
  "id" serial PRIMARY KEY NOT NULL,
  "operation_type" varchar(30) NOT NULL,
  "base_cost" numeric(10, 2) NOT NULL,
  "multipliers" jsonb NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_credit_pricing_operation" ON "credit_pricing_config" ("operation_type") WHERE "active" = true;

-- Table 3: custom_models (FK: teams, reference_models)
CREATE TABLE IF NOT EXISTS "custom_models" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "reference_model_id" integer NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "creation_prompt" text NOT NULL,
  "refinement_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "fal_lora_id" text,
  "version" integer DEFAULT 1 NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "last_used_at" timestamp,
  CONSTRAINT "custom_models_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE cascade,
  CONSTRAINT "custom_models_reference_model_id_reference_models_id_fk" FOREIGN KEY ("reference_model_id") REFERENCES "reference_models"("id")
);

CREATE INDEX IF NOT EXISTS "idx_custom_models_team_status" ON "custom_models" ("team_id", "status");
CREATE INDEX IF NOT EXISTS "idx_custom_models_team_updated" ON "custom_models" ("team_id", "updated_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_custom_models_fal_lora" ON "custom_models" ("fal_lora_id") WHERE "fal_lora_id" IS NOT NULL;

-- Table 4: jobs (FK: teams, users, custom_models)
CREATE TABLE IF NOT EXISTS "jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "job_type" varchar(30) NOT NULL,
  "custom_model_id" integer,
  "input_params" jsonb NOT NULL,
  "status" varchar(20) DEFAULT 'queued' NOT NULL,
  "priority" integer DEFAULT 10 NOT NULL,
  "estimated_credit_cost" numeric(10, 2) NOT NULL,
  "actual_credit_cost" numeric(10, 2),
  "result_data" jsonb,
  "error_details" jsonb,
  "fal_job_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "started_at" timestamp,
  "completed_at" timestamp,
  "expires_at" timestamp,
  CONSTRAINT "jobs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE cascade,
  CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  CONSTRAINT "jobs_custom_model_id_custom_models_id_fk" FOREIGN KEY ("custom_model_id") REFERENCES "custom_models"("id") ON DELETE set null
);

CREATE INDEX IF NOT EXISTS "idx_jobs_team_status_created" ON "jobs" ("team_id", "status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_jobs_status_priority" ON "jobs" ("status", "priority" ASC) WHERE "status" = 'queued';
CREATE INDEX IF NOT EXISTS "idx_jobs_custom_model" ON "jobs" ("custom_model_id") WHERE "custom_model_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_jobs_fal_job_id" ON "jobs" ("fal_job_id") WHERE "fal_job_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_jobs_expires_at" ON "jobs" ("expires_at") WHERE "expires_at" IS NOT NULL AND "status" = 'completed';

-- Table 5: credit_balances (FK: teams)
CREATE TABLE IF NOT EXISTS "credit_balances" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer UNIQUE NOT NULL,
  "available_credits" numeric(10, 2) DEFAULT '0' NOT NULL,
  "reserved_credits" numeric(10, 2) DEFAULT '0' NOT NULL,
  "bonus_credits" numeric(10, 2) DEFAULT '0' NOT NULL,
  "total_allocated" numeric(10, 2) DEFAULT '0' NOT NULL,
  "last_replenishment_at" timestamp DEFAULT now() NOT NULL,
  "next_replenishment_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "credit_balances_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_credit_balances_team" ON "credit_balances" ("team_id");
CREATE INDEX IF NOT EXISTS "idx_credit_balances_next_replenishment" ON "credit_balances" ("next_replenishment_at") WHERE "next_replenishment_at" <= NOW();

-- Table 6: credit_transactions (FK: teams, jobs)
CREATE TABLE IF NOT EXISTS "credit_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "job_id" uuid,
  "type" varchar(20) NOT NULL,
  "operation_type" varchar(30),
  "amount" numeric(10, 2) NOT NULL,
  "balance_before" numeric(10, 2) NOT NULL,
  "balance_after" numeric(10, 2) NOT NULL,
  "description" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "credit_transactions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE cascade,
  CONSTRAINT "credit_transactions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE set null
);

CREATE INDEX IF NOT EXISTS "idx_credit_transactions_team_created" ON "credit_transactions" ("team_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_credit_transactions_job" ON "credit_transactions" ("job_id") WHERE "job_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_credit_transactions_type" ON "credit_transactions" ("type");
