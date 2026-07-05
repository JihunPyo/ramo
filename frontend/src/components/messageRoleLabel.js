const UNKNOWN_MODEL_LABEL = '모델 미상'

export function getMessageRoleLabel(message, modelOptions = []) {
  if (message.role === 'user') {
    return 'User'
  }

  return formatAssistantRoleLabel({
    personaName: message.personaName,
    modelProvider: message.modelProvider,
    modelName: message.modelName,
    modelOptions,
  })
}

export function getPendingAssistantRoleLabel(selectedModel, modelOptions = []) {
  return formatAssistantRoleLabel({
    personaName: selectedModel?.personaName,
    modelProvider: selectedModel?.provider,
    modelName: selectedModel?.name,
    modelLabel: selectedModel?.label,
    modelOptions,
  })
}

function formatAssistantRoleLabel({
  personaName,
  modelProvider,
  modelName,
  modelLabel,
  modelOptions,
}) {
  return dedupeLabelParts([
    resolveModelDisplayName({ modelProvider, modelName, modelLabel, modelOptions }),
    normalizeLabel(personaName),
  ]).join(' · ')
}

function resolveModelDisplayName({ modelProvider, modelName, modelLabel, modelOptions = [] }) {
  const normalizedModelLabel = normalizeLabel(modelLabel)

  if (normalizedModelLabel) {
    return normalizedModelLabel
  }

  const matchingModel = modelOptions.find((model) => (
    model.name === modelName && (!modelProvider || model.provider === modelProvider)
  )) ?? modelOptions.find((model) => model.name === modelName)

  return (
    normalizeLabel(matchingModel?.label) ||
    normalizeLabel(modelName) ||
    normalizeLabel(modelProvider) ||
    UNKNOWN_MODEL_LABEL
  )
}

function normalizeLabel(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function dedupeLabelParts(parts) {
  const seen = new Set()

  return parts.filter((part) => {
    const normalizedPart = normalizeLabel(part)
    const normalizedKey = normalizedPart.toLocaleLowerCase()

    if (!normalizedPart || seen.has(normalizedKey)) {
      return false
    }

    seen.add(normalizedKey)
    return true
  })
}
