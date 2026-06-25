export function normalizeFragmentTags(tags?: string[] | null): string[] {
  if (!Array.isArray(tags)) return [];
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    )
  ).slice(0, 12);
}

export function parseFragmentTagInput(input: string): string[] {
  return normalizeFragmentTags(input.split(/[\s,，、#]+/g));
}

export function formatFragmentTagsInput(tags?: string[] | null): string {
  return normalizeFragmentTags(tags).join(' ');
}
