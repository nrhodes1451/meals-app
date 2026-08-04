CREATE TYPE "public"."unit" AS ENUM('g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'bag', 'tin', 'tub', 'pack', 'stalk', 'rasher', 'breast', 'slice', 'portion', 'bulb', 'punnet');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ingredient_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_id" integer NOT NULL,
	"alias" text NOT NULL,
	CONSTRAINT "ingredient_aliases_alias_unique" UNIQUE("alias")
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category_id" integer NOT NULL,
	"frozen" boolean DEFAULT false NOT NULL,
	"pantry_staple" boolean DEFAULT false NOT NULL,
	"pack_size" numeric(10, 2),
	"pack_unit" "unit",
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ingredients_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "plan_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"position" integer NOT NULL,
	"recipe_id" integer,
	"locked" boolean DEFAULT false NOT NULL,
	"eaten" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_starting" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_week_starting_unique" UNIQUE("week_starting")
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"amount" numeric(10, 2),
	"unit" "unit",
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"servings" integer DEFAULT 2 NOT NULL,
	"vegetarian" boolean DEFAULT true NOT NULL,
	"keto" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"time_hours" numeric(4, 2),
	"method" text,
	"source_url" text,
	"supertype" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "shopping_list_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"ingredient_id" integer,
	"free_text" text,
	"checked" boolean DEFAULT false NOT NULL,
	"manual" boolean DEFAULT false NOT NULL,
	"staple_override" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ingredient_aliases" ADD CONSTRAINT "ingredient_aliases_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_slots" ADD CONSTRAINT "plan_slots_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_slots" ADD CONSTRAINT "plan_slots_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ingredients_name_frozen_idx" ON "ingredients" USING btree ("name","frozen");--> statement-breakpoint
CREATE INDEX "ingredients_category_idx" ON "ingredients" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_slots_plan_position_idx" ON "plan_slots" USING btree ("plan_id","position");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_recipe_idx" ON "recipe_ingredients" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_ingredient_idx" ON "recipe_ingredients" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX "recipes_archived_idx" ON "recipes" USING btree ("archived");--> statement-breakpoint
CREATE INDEX "shopping_list_items_plan_idx" ON "shopping_list_items" USING btree ("plan_id");