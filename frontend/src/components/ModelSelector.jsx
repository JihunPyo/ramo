import { useEffect, useMemo, useRef, useState } from 'react'

const PROVIDER_LABELS = {
  openai: 'OPENAI',
  anthropic: 'CLAUDE',
  google: 'GEMINI',
  xai: 'X-AI',
  meta: 'META',
  perplexity: 'PERPLEXITY',
  deepseek: 'DEEPSEEK',
}

const PROVIDER_MARKS = {
  openai: '◎',
  anthropic: '✺',
  google: '◆',
  xai: '𝕏',
  meta: '∞',
  perplexity: '⌬',
  deepseek: 'D',
}

function getModelKey(model) {
  return `${model.provider}:${model.name}`
}

function groupModels(modelOptions) {
  const groups = []
  const groupMap = new Map()

  modelOptions.forEach((model) => {
    const groupKey = model.group ?? model.provider
    const groupLabel = model.groupLabel ?? PROVIDER_LABELS[groupKey] ?? groupKey.toUpperCase()

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        key: groupKey,
        label: groupLabel,
        models: [],
      })
      groups.push(groupMap.get(groupKey))
    }

    groupMap.get(groupKey).models.push(model)
  })

  return groups
}

export function ModelSelector({
  modelOptions = [],
  selectedModel,
  onChangeModel,
  disabled = false,
  placement = 'top',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)
  const selectedModelKey = selectedModel ? getModelKey(selectedModel) : ''
  const groupedModels = useMemo(() => groupModels(modelOptions), [modelOptions])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelectModel = (model) => {
    onChangeModel?.(model)
    setIsOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className={['model-selector', className].filter(Boolean).join(' ')}
      data-placement={placement}
    >
      <button
        type="button"
        className="model-selector-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="사용 모델 선택"
        disabled={disabled || modelOptions.length === 0}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="model-selector-current">{selectedModel?.label ?? '모델 선택'}</span>
        <span className="model-selector-chevron" aria-hidden="true">⌄</span>
      </button>

      {isOpen ? (
        <section className="model-selector-popover" aria-label="모델 선택">
          <div className="model-selector-grid" role="listbox" aria-label="사용 모델">
            {groupedModels.map((group) => (
              <section className="model-selector-group" key={group.key} aria-label={group.label}>
                <h3>{group.label}</h3>
                <div className="model-selector-list">
                  {group.models.map((model) => {
                    const modelKey = getModelKey(model)
                    const isSelected = modelKey === selectedModelKey
                    const mark = model.mark ?? PROVIDER_MARKS[model.provider] ?? '•'

                    return (
                      <button
                        key={modelKey}
                        type="button"
                        className={isSelected ? 'model-selector-option selected' : 'model-selector-option'}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectModel(model)}
                      >
                        <span className="model-selector-mark" data-provider={model.provider} aria-hidden="true">
                          {mark}
                        </span>
                        <span className="model-selector-name">{model.label}</span>
                        {model.badge ? <span className="model-selector-badge">{model.badge}</span> : null}
                        {isSelected ? <span className="model-selector-more" aria-hidden="true">•••</span> : null}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
