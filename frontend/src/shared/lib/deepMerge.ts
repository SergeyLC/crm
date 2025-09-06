// Small deep-merge utility used by i18n initialization.
// Merges source into target recursively, returning a new object.
export function deepMergeObjects(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const s = source[key];
    const t = out[key];
    if (
      s && typeof s === 'object' && !Array.isArray(s) &&
      t && typeof t === 'object' && !Array.isArray(t)
    ) {
      out[key] = deepMergeObjects(t as Record<string, unknown>, s as Record<string, unknown>);
    } else {
      out[key] = s;
    }
  }
  return out;
}

export default deepMergeObjects;
