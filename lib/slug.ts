/**
 * Slugs match the ones the migration produced: lower case, non-alphanumerics collapsed to a single
 * hyphen. The seed contains `goat-s-cheese`, so an apostrophe becomes a separator rather than being
 * dropped, and that is kept for consistency.
 */
export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled';
}

/** Appends -2, -3 and so on until the slug is free. */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
