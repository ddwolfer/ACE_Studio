/** 最終 prompt = 基底 + 額外（見 docs/FRONTEND-SPEC.md §9） */
export function composeCaption(base: string, extra: string): string {
  const b = base.trim().replace(/[,\s]+$/, '')
  const e = extra.trim().replace(/^[,\s]+/, '')
  if (!b) return e
  if (!e) return b
  return `${b}, ${e}`
}
