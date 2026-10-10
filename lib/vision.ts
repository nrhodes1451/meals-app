/**
 * Reading a recipe off a photo with Gemini on Vertex AI. Server only.
 *
 * Auth is Application Default Credentials: the Cloud Run service account in production
 * (`roles/aiplatform.user`), `gcloud auth application-default login` locally. No keys in the app.
 *
 * The library's ingredient list goes into the prompt so the model can propose a match for each
 * line. Those proposals are checked afterwards in `lib/recipe-import.ts`, never trusted as-is.
 */
import { GoogleGenAI } from '@google/genai';
import { unitEnum } from '@/db/schema';
import { parseModelRecipe, type KnownIngredient, type ModelRecipe } from './recipe-import';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT ?? 'meals-492311';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION ?? 'global';
const MODEL = process.env.RECIPE_IMPORT_MODEL ?? 'gemini-3.8-flash';

let client: GoogleGenAI | null = null;
function vertex(): GoogleGenAI {
  client ??= new GoogleGenAI({ vertexai: true, project: PROJECT, location: LOCATION });
  return client;
}

const SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Recipe title, sentence case.' },
    servings: { type: ['integer', 'null'] },
    minutes: { type: ['integer', 'null'], description: 'Total cook time in minutes.' },
    vegetarian: { type: 'boolean', description: 'False if any meat or fish is used.' },
    method: {
      type: 'string',
      description:
        'The printed method, numbered steps on new lines, then any handwritten notes under a Notes heading.',
    },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          raw: { type: 'string', description: 'The ingredient line exactly as printed.' },
          name: { type: 'string' },
          amount: { type: ['number', 'null'] },
          unit: { type: ['string', 'null'], enum: [...unitEnum.enumValues, null] },
          frozen: { type: 'boolean' },
          matchId: { type: ['integer', 'null'] },
        },
        required: ['raw', 'name', 'amount', 'unit', 'frozen', 'matchId'],
      },
    },
  },
  required: ['name', 'servings', 'minutes', 'vegetarian', 'method', 'ingredients'],
};

function prompt(known: KnownIngredient[]): string {
  const library = known
    .map((row) => {
      const aliases = row.aliases.length ? ` [also: ${row.aliases.join(', ')}]` : '';
      return `${row.id}: ${row.name}${row.frozen ? ' (frozen)' : ''}${aliases}`;
    })
    .join('\n');

  return `This photo is of a recipe, from a cookbook, a printout or a screen. Read it and return it as JSON.

Rules:
- British English throughout (courgette, aubergine, yoghurt).
- Ingredients come from the printed recipe only. Handwritten notes never change the ingredient list or quantities.
- Ingredient names are lower case, plural for countables ("carrots", "onions") and singular for mass nouns ("spinach", "rice"). Drop preparation words and "fresh": "2 carrots, finely diced" is name "carrots", amount 2; "fresh tarragon" is "tarragon". Fresh is assumed; only frozen is ever marked.
- Where a line offers a choice ("rocket or spinach", "thyme and/or rosemary"), name one ingredient: the first option that is in the library below, or the first option if none is.
- Leave out lines that are not bought separately, such as oil from a jar of another ingredient, water, or reserved cooking liquid.
- For a range ("1-2 tsp", "2-3 sprigs"), use the larger number.
- unit must be one of: ${unitEnum.enumValues.join(', ')}, or null. A bare count ("2 onions") has unit null. Convert where the meaning is exact ("1 can" is tin, "1 packet" is pack). If the quantity fits none of these units ("a handful", "1 cup"), set amount and unit to null.
- amount is null when no quantity is given ("salt and pepper").
- frozen is true only when the recipe asks for the frozen product.
- matchId is the id of the ingredient below that is the same thing you would buy, or null if none is. Fresh and frozen are different things.
- vegetarian is false if the recipe uses meat, fish or seafood.
- method is the printed instructions as written. If the page is a reference only, transcribe what is there.
- Handwritten notes (sticky notes, margin notes, crossings out) are the cook's own changes. Transcribe them after the method, under a line reading "Notes", one note per line starting "- ", keeping their quantities and wording. Where handwriting is unclear, write your best reading followed by "(?)". Leave the Notes section out when there is no handwriting.
- If the photo is not a recipe, return an empty name and no ingredients.

Ingredients already in the library (id: name):
${library}`;
}

export class UnreadablePhoto extends Error {}

export async function extractRecipe(
  image: { data: string; mimeType: string },
  known: KnownIngredient[],
): Promise<ModelRecipe> {
  const response = await vertex().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ inlineData: image }, { text: prompt(known) }],
      },
    ],
    config: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseJsonSchema: SCHEMA,
    },
  });

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(response.text ?? '');
  } catch {
    throw new UnreadablePhoto();
  }
  const recipe = parseModelRecipe(parsed);
  if (!recipe) throw new UnreadablePhoto();
  return recipe;
}
