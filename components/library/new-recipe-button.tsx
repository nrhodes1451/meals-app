'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Camera, Plus } from 'lucide-react';
import { Button } from '@/components/penrose';
import { createRecipe } from '@/app/recipes/actions';

/**
 * Creates the recipe immediately and opens it, rather than asking for a name first. There is no
 * blank-form step: the editor is the form.
 */
export function NewRecipeButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => createRecipe())}
    >
      <Plus size={18} aria-hidden />
      New recipe
    </Button>
  );
}

/** The other way in: read the recipe off a photo, then check it step by step before saving. */
export function ImportRecipeButton() {
  return (
    <Button variant="secondary" asChild>
      <Link href="/recipes/import">
        <Camera size={18} aria-hidden />
        From photo
      </Link>
    </Button>
  );
}
