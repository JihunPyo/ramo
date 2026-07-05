const DEFAULT_PERSONA_LABELS = new Set(['ramo'])

export function normalizePersonaLabel(value) {
  const normalizedLabel = typeof value === 'string' ? value.trim() : ''

  if (DEFAULT_PERSONA_LABELS.has(normalizedLabel.toLocaleLowerCase())) {
    return ''
  }

  return normalizedLabel
}
