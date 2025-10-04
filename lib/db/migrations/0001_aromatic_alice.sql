CREATE TABLE "credit_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"available_credits" numeric(10, 2) DEFAULT '0' NOT NULL,
	"reserved_credits" numeric(10, 2) DEFAULT '0' NOT NULL,
	"bonus_credits" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_allocated" numeric(10, 2) DEFAULT '0' NOT NULL,
	"last_replenishment_at" timestamp DEFAULT now() NOT NULL,
	"next_replenishment_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_balances_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "credit_pricing_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"operation_type" varchar(30) NOT NULL,
	"base_cost" numeric(10, 2) NOT NULL,
	"multipliers" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_pricing_config_operation_type_unique" UNIQUE("operation_type")
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
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
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_models" (
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
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "jobs" (
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
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reference_models" (
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
--> statement-breakpoint
ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_models" ADD CONSTRAINT "custom_models_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_models" ADD CONSTRAINT "custom_models_reference_model_id_reference_models_id_fk" FOREIGN KEY ("reference_model_id") REFERENCES "public"."reference_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_custom_model_id_custom_models_id_fk" FOREIGN KEY ("custom_model_id") REFERENCES "public"."custom_models"("id") ON DELETE set null ON UPDATE no action;