const ASSISTANT_BRAND_NAME = 'Ramo'
const DEFAULT_PERSONA_NAME = 'Ramo'
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
  return [
    ASSISTANT_BRAND_NAME,
    normalizeLabel(personaName) || DEFAULT_PERSONA_NAME,
    resolveModelDisplayName({ modelProvider, modelName, modelLabel, modelOptions }),
  ].join(' · ')
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
