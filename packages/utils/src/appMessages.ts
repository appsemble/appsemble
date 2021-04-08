/**
 * Recursively find `string.format` remapper message IDs.
 *
 * @param obj - The object to search.
 * @returns All message IDs found
 */
export function findMessageIds(obj: unknown): string[] {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => findMessageIds(item));
  }
  const entries = Object.entries(obj);
  // Remappers throw if multiple keys are defined, so this means it’s not a remapper.
  if (entries.length === 1) {
    const [[key, value]] = entries;
    if (key === 'string.format' && typeof value?.messageId === 'string') {
      return [value.messageId];
    }
  }
  return entries.flatMap(([, value]) => findMessageIds(value));
}
