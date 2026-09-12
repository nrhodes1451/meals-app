ALTER TABLE "plan_slots" ADD COLUMN "skip_ingredients" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD COLUMN "skipped" boolean DEFAULT false NOT NULL;