/** Relationship values may be IDs, populated docs, or join holes. */
export function normalizeVariantOptionIds(options: unknown): string[] {
  if (!Array.isArray(options)) return []

  return options
    .map((option) => {
      if (typeof option === 'string') return option
      if (option && typeof option === 'object' && 'id' in option && option.id) {
        return String(option.id)
      }
      return null
    })
    .filter((id): id is string => Boolean(id))
}
