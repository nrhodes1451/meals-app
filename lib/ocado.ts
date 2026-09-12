/**
 * Shopping-list Ocado links. A stored product URL wins; otherwise search by the name the list
 * already prints, including the "(frozen)" suffix.
 */
export function ocadoHref(name: string, ocadoUrl: string | null): string {
  const stored = ocadoUrl?.trim();
  if (stored) return stored;
  return `https://www.ocado.com/search?q=${encodeURIComponent(name)}`;
}
