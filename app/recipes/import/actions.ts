'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/db';
import { unitEnum } from '@/db/schema';
import { loadIngredients } from '@/lib/ingredients';
import { toDraft, type Draft } from '@/lib/recipe-import';
import { saveImportedRecipe, type ImportInput } from '@/lib/recipe-import-save';
import { extractRecipe, UnreadablePhoto } from '@/lib/vision';

/** The client shrinks photos to well under this. It is a backstop, not the normal path. */
const MAX_BYTES = 4 * 1024 * 1024;

export type ExtractResult = { ok: true; draft: Draft } | { ok: false; error: string };

export async function extractFromPhoto(formData: FormData): Promise<ExtractResult> {
  const photo = formData.get('photo');
  if (!(photo instanceof File) || photo.size === 0) {
    return { ok: false, error: 'No photo arrived. Take or choose one, then try again.' };
  }
  if (!photo.type.startsWith('image/')) {
    return { ok: false, error: 'That file is not an image. Choose a photo instead.' };
  }
  if (photo.size > MAX_BYTES) {
    return { ok: false, error: 'That photo is too large. Choose one under 4MB.' };
  }

  const db = await getDb();
  const known = await loadIngredients(db);
  const data = Buffer.from(await photo.arrayBuffer()).toString('base64');

  try {
    const model = await extractRecipe({ data, mimeType: photo.type }, known);
    return { ok: true, draft: toDraft(model, known, unitEnum.enumValues) };
  } catch (error) {
    if (error instanceof UnreadablePhoto) {
      return {
        ok: false,
        error: 'Could not read a recipe from that photo. Retake it with the whole page in frame.',
      };
    }
    console.error('Recipe import failed', error);
    return {
      ok: false,
      error:
        'Vertex AI refused or did not answer. Check the API is enabled and the server has Google Cloud credentials (see docs/deploy.md), then try again.',
    };
  }
}

export async function importRecipe(input: ImportInput): Promise<{ ok: false; error: string }> {
  const db = await getDb();
  const result = await saveImportedRecipe(db, input);
  if (!result.ok) return result;

  revalidatePath('/recipes');
  revalidatePath('/ingredients');
  revalidatePath('/plan', 'layout');
  redirect(`/recipes/${result.slug}`);
}
