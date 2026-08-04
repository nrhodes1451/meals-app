import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  date,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

/**
 * Quantities only sum within a dimension:
 *   mass   -> g, kg
 *   volume -> ml, l, tsp, tbsp
 *   count  -> everything else, each unit its own bucket
 * `null` unit means a bare count ("2 onions"). See aggregation rule in CLAUDE.md.
 */
export const unitEnum = pgEnum('unit', [
  'g', 'kg', 'ml', 'l', 'tsp', 'tbsp',
  'bag', 'tin', 'tub', 'pack', 'stalk', 'rasher',
  'breast', 'slice', 'portion', 'bulb', 'punnet',
]);

/* ------------------------------------------------------------------ */
/* Store layout                                                        */
/* ------------------------------------------------------------------ */

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  /** Physical aisle order. Reorderable; drives shopping list grouping. */
  position: integer('position').notNull(),
});

/* ------------------------------------------------------------------ */
/* Ingredients                                                         */
/* ------------------------------------------------------------------ */

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  /** Canonical display name. Plural for countables, singular for mass nouns. */
  name: text('name').notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  /** Fresh is the default. Frozen variants are separate rows sharing a name. */
  frozen: boolean('frozen').notNull().default(false),
  /** Suppressed from the shopping list; restocked as it runs out. */
  pantryStaple: boolean('pantry_staple').notNull().default(false),
  /** Nullable until observed. Feeds future waste-minimising meal selection. */
  packSize: numeric('pack_size', { precision: 10, scale: 2 }),
  packUnit: unitEnum('pack_unit'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  nameFrozenIdx: uniqueIndex('ingredients_name_frozen_idx').on(t.name, t.frozen),
  categoryIdx: index('ingredients_category_idx').on(t.categoryId),
}));

/** Absorbs the source sheet's typos and variants: broccoli -> broccol, etc. */
export const ingredientAliases = pgTable('ingredient_aliases', {
  id: serial('id').primaryKey(),
  ingredientId: integer('ingredient_id').notNull()
    .references(() => ingredients.id, { onDelete: 'cascade' }),
  alias: text('alias').notNull().unique(),
});

/* ------------------------------------------------------------------ */
/* Recipes                                                             */
/* ------------------------------------------------------------------ */

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  servings: integer('servings').notNull().default(2),
  vegetarian: boolean('vegetarian').notNull().default(true),
  keto: boolean('keto').notNull().default(false),
  /** Excluded from the random pool and from library default view. */
  archived: boolean('archived').notNull().default(false),
  timeHours: numeric('time_hours', { precision: 4, scale: 2 }),
  /** Free text: instructions, or a book and page reference. */
  method: text('method'),
  sourceUrl: text('source_url'),
  /** Coarse grouping ("Salad", "Bolognaise") for variety constraints. Mostly null. */
  supertype: text('supertype'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  archivedIdx: index('recipes_archived_idx').on(t.archived),
}));

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id),
  /** Null means "some" - quantity unspecified in the source. */
  amount: numeric('amount', { precision: 10, scale: 2 }),
  /** Null with a non-null amount means a bare count. */
  unit: unitEnum('unit'),
  position: integer('position').notNull().default(0),
}, (t) => ({
  recipeIdx: index('recipe_ingredients_recipe_idx').on(t.recipeId),
  ingredientIdx: index('recipe_ingredients_ingredient_idx').on(t.ingredientId),
}));

/* ------------------------------------------------------------------ */
/* Weekly plans                                                        */
/* ------------------------------------------------------------------ */

export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  /** Monday of the planned week. */
  weekStarting: date('week_starting').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const planSlots = pgTable('plan_slots', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  /** Contiguous from 0. Number of slots varies by week; not a weekday. */
  position: integer('position').notNull(),
  recipeId: integer('recipe_id').references(() => recipes.id),
  /** Held fixed when re-rolling the rest of the week. */
  locked: boolean('locked').notNull().default(false),
  /** Ticked off as the meal is cooked. Also the basis of "last eaten". */
  eaten: boolean('eaten').notNull().default(false),
}, (t) => ({
  planPositionIdx: uniqueIndex('plan_slots_plan_position_idx').on(t.planId, t.position),
}));

/* ------------------------------------------------------------------ */
/* Shopping list                                                       */
/* ------------------------------------------------------------------ */

/**
 * Quantities are derived from the plan on read, not stored. This table holds
 * only per-shop state: what has been ticked off, what was added by hand, and
 * which suppressed staples were pulled back in.
 */
export const shoppingListItems = pgTable('shopping_list_items', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').references(() => ingredients.id),
  /** For one-off items with no ingredient record ("batteries"). */
  freeText: text('free_text'),
  checked: boolean('checked').notNull().default(false),
  /** True when added by hand rather than derived from the plan. */
  manual: boolean('manual').notNull().default(false),
  /** True when a pantry staple was explicitly restored to the list. */
  stapleOverride: boolean('staple_override').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  planIdx: index('shopping_list_items_plan_idx').on(t.planId),
}));

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const categoriesRelations = relations(categories, ({ many }) => ({
  ingredients: many(ingredients),
}));

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  category: one(categories, {
    fields: [ingredients.categoryId],
    references: [categories.id],
  }),
  aliases: many(ingredientAliases),
  recipeIngredients: many(recipeIngredients),
}));

export const ingredientAliasesRelations = relations(ingredientAliases, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [ingredientAliases.ingredientId],
    references: [ingredients.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  planSlots: many(planSlots),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  slots: many(planSlots),
  shoppingListItems: many(shoppingListItems),
}));

export const planSlotsRelations = relations(planSlots, ({ one }) => ({
  plan: one(plans, { fields: [planSlots.planId], references: [plans.id] }),
  recipe: one(recipes, { fields: [planSlots.recipeId], references: [recipes.id] }),
}));

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
  plan: one(plans, { fields: [shoppingListItems.planId], references: [plans.id] }),
  ingredient: one(ingredients, {
    fields: [shoppingListItems.ingredientId],
    references: [ingredients.id],
  }),
}));
