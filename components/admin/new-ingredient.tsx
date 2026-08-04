'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { Button, Input, Select } from '@/components/penrose';
import { createIngredient } from '@/app/ingredients/actions';
import type { CategoryRow } from '@/lib/ingredients';

/**
 * The design has no way to add an ingredient, but the recipe editor can only pick from this list,
 * so without it a new recipe cannot name anything the 2014 sheet did not already contain.
 */
export function NewIngredient({ categories }: { categories: CategoryRow[] }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(String(categories[0]?.id ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createIngredient(name, Number(categoryId));
      if (result.ok) setName('');
      else setError(result.error);
    });
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1">
          <span className="font-display text-label font-bold uppercase tracking-label">
            New ingredient
          </span>
          <Input
            value={name}
            placeholder="Name, plural for countables"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        </label>

        <Select
          className="w-[170px]"
          aria-label="Category for the new ingredient"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Button variant="secondary" disabled={!name.trim() || pending} onClick={submit}>
          <Plus size={20} aria-hidden />
          Add
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
