import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const PROVIDER_LABELS = {
  openai: 'OPENAI',
  chatkhu: 'CHATKHU',
  anthropic: 'CLAUDE',
  google: 'GEMINI',
  xai: 'X-AI',
  meta: 'META',
  perplexity: 'PERPLEXITY',
  deepseek: 'DEEPSEEK',
}

const PROVIDER_MARKS = {
  openai: '◎',
  chatkhu: 'K',
  anthropic: '✺',
  google: '◆',
  xai: '𝕏',
  meta: '∞',
  perplexity: '⌬',
  deepseek: 'D',
}

const POPOVER_GAP = 10
const POPOVER_MARGIN = 16
const POPOVER_MAX_WIDTH = 920
const POPOVER_MIN_WIDTH = 320
const POPOVER_MAX_HEIGHT = 680

function getModelKey(model) {
  return `${model.provider}:${model.name}`
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getPopoverPosition(triggerElement, preferredPlacement) {
  if (!triggerElement || typeof window === 'undefined') {
    return null
  }

  const rect = triggerElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const width = Math.min(POPOVER_MAX_WIDTH, Math.max(POPOVER_MIN_WIDTH, viewportWidth - POPOVER_MARGIN * 2))
  const spaceAbove = rect.top - POPOVER_MARGIN - POPOVER_GAP
  const spaceBelow = viewportHeight - rect.bottom - POPOVER_MARGIN - POPOVER_GAP
  const shouldOpenTop =
    preferredPlacement === 'top'
    || (preferredPlacement === 'bottom' && spaceBelow < 360 && spaceAbove > spaceBelow)
  const availableHeight = Math.max(220, shouldOpenTop ? spaceAbove : spaceBelow)
  const maxHeight = Math.min(POPOVER_MAX_HEIGHT, availableHeight)
  const left = clamp(rect.left, POPOVER_MARGIN, Math.max(POPOVER_MARGIN, viewportWidth - width - POPOVER_MARGIN))
  const top = shouldOpenTop
    ? Math.max(POPOVER_MARGIN, rect.top - POPOVER_GAP - maxHeight)
    : Math.min(rect.bottom + POPOVER_GAP, viewportHeight - POPOVER_MARGIN - maxHeight)

  return {
    left,
    top,
    width,
    maxHeight,
    placement: shouldOpenTop ? 'top' : 'bottom',
  }
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
  const [popoverPosition, setPopoverPosition] = useState(null)
  const rootRef = useRef(null)
  const popoverRef = useRef(null)
  const triggerRef = useRef(null)
  const selectedModelKey = selectedModel ? getModelKey(selectedModel) : ''
  const groupedModels = useMemo(() => groupModels(modelOptions), [modelOptions])

  const updatePopoverPosition = useCallback(() => {
    setPopoverPosition(getPopoverPosition(triggerRef.current, placement))
  }, [placement])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (
        !rootRef.current?.contains(event.target)
        && !popoverRef.current?.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleGeometryChange = () => {
      updatePopoverPosition()
    }

    updatePopoverPosition()

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleGeometryChange)
    window.addEventListener('scroll', handleGeometryChange, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleGeometryChange)
      window.removeEventListener('scroll', handleGeometryChange, true)
    }
  }, [isOpen, placement, updatePopoverPosition])

  useEffect(() => {
    if (isOpen) {
      updatePopoverPosition()
    }
  }, [groupedModels, isOpen, updatePopoverPosition])

  const handleSelectModel = (model) => {
    onChangeModel?.(model)
    setIsOpen(false)
  }

  const popover = isOpen && popoverPosition && typeof document !== 'undefined' ? createPortal(
    <section
      ref={popoverRef}
      className="model-selector-popover"
      data-placement={popoverPosition.placement}
      aria-label="모델 선택"
      style={{
        left: `${popoverPosition.left}px`,
        top: `${popoverPosition.top}px`,
        width: `${popoverPosition.width}px`,
        maxHeight: `${popoverPosition.maxHeight}px`,
      }}
    >
      <div className="model-selector-grid" role="listbox" aria-label="사용 모델">
        {groupedModels.map((group) => (
          <section className="model-selector-group" key={group.key} aria-label={group.label}>
            <h3>{group.label}</h3>
            <div className="model-selector-list">
              {group.models.map((model) => {
                const modelKey = getModelKey(model)
                const isSelected = modelKey === selectedModelKey
                const mark = model.mark ?? PROVIDER_MARKS[model.group] ?? PROVIDER_MARKS[model.provider] ?? '•'

                return (
                  <button
                    key={modelKey}
                    type="button"
                    className={isSelected ? 'model-selector-option selected' : 'model-selector-option'}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectModel(model)}
                  >
                    <span
                      className="model-selector-mark"
                      data-provider={model.group ?? model.provider}
                      aria-hidden="true"
                    >
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
    </section>,
    document.body,
  ) : null

  return (
    <div
      ref={rootRef}
      className={['model-selector', isOpen ? 'open' : '', className].filter(Boolean).join(' ')}
      data-placement={placement}
    >
      <button
        ref={triggerRef}
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

      {popover}
    </div>
  )
}
