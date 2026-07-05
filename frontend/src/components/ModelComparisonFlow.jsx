import { useMemo, useState } from 'react'
import { RichMessageContent } from './RichMessageContent.jsx'

export function ModelComparisonFlow({
  prompt,
  modelOptions,
  comparison,
  analysis,
  isMinimized = false,
  isBusy = false,
  onStartComparison,
  onAnalyze,
  onSelectAnswer,
  onMerge,
  onToggleMinimize,
  onClose,
}) {
  const sortedModelOptions = useMemo(() => sortModelsByProvider(modelOptions), [modelOptions])
  const defaultModelKeys = useMemo(() => {
    const openAiModel = sortedModelOptions.find((model) => model.provider === 'openai')
    const anthropicModel = sortedModelOptions.find((model) => model.provider === 'anthropic')
    return [openAiModel, anthropicModel].filter(Boolean).map(getModelKey).slice(0, 2)
  }, [sortedModelOptions])
  const [promptDraft, setPromptDraft] = useState(prompt)
  const [selectedModelKeys, setSelectedModelKeys] = useState(defaultModelKeys)
  const [sidePanel, setSidePanel] = useState(null)
  const [mergeInstruction, setMergeInstruction] = useState('')
  const selectedModels = selectedModelKeys
    .map((key) => sortedModelOptions.find((model) => getModelKey(model) === key))
    .filter(Boolean)

  if (!comparison) {
    return (
      <div className="model-flow-backdrop" role="presentation">
        <section className="model-picker-modal" role="dialog" aria-modal="true" aria-label="비교 모델 선택">
          <header className="model-flow-header">
            <div>
              <span>모델 비교</span>
              <h2>비교할 모델 2개를 선택하세요</h2>
              <p>같은 질문에 대한 두 모델의 답변을 나란히 확인합니다.</p>
            </div>
            <button type="button" className="model-flow-close" onClick={onClose} aria-label="모델 선택 창 닫기">×</button>
          </header>

          <label className="comparison-prompt-input" htmlFor="comparison-prompt">
            <span>비교할 질문</span>
            <textarea
              id="comparison-prompt"
              value={promptDraft}
              onChange={(event) => setPromptDraft(event.target.value)}
              disabled={isBusy}
              rows={4}
              autoFocus
              placeholder="두 모델에게 물어볼 질문을 입력하세요."
            />
          </label>

          <div className="model-picker-heading">
            <span>모델 선택</span>
          </div>
          <div className="model-picker-grid" role="group" aria-label="비교할 모델">
            {sortedModelOptions.map((model) => {
              const modelKey = getModelKey(model)
              const selectionIndex = selectedModelKeys.indexOf(modelKey)
              const isSelected = selectionIndex >= 0

              return (
                <button
                  key={modelKey}
                  type="button"
                  className={isSelected ? 'model-picker-card selected' : 'model-picker-card'}
                  aria-pressed={isSelected}
                  disabled={isBusy}
                  onClick={() => {
                    setSelectedModelKeys((currentKeys) => {
                      if (currentKeys.includes(modelKey)) {
                        return currentKeys.filter((key) => key !== modelKey)
                      }

                      return currentKeys.length < 2 ? [...currentKeys, modelKey] : [currentKeys[1], modelKey]
                    })
                  }}
                >
                  <span className="model-picker-order">{isSelected ? selectionIndex + 1 : ''}</span>
                  <span className="model-picker-provider">{model.groupLabel ?? getProviderLabel(model.provider)}</span>
                  <strong>{model.label}</strong>
                </button>
              )
            })}
          </div>

          <footer className="model-picker-footer">
            <span>{selectedModels.length}/2 선택됨</span>
            <button
              type="button"
              className="model-flow-primary"
              disabled={!promptDraft.trim() || selectedModels.length !== 2 || isBusy}
              onClick={() => onStartComparison(promptDraft.trim(), selectedModels)}
            >
              {isBusy ? '답변 생성 중...' : '두 모델로 답변 받기'}
            </button>
          </footer>
        </section>
      </div>
    )
  }

  const showAnalysis = sidePanel === 'analysis'
  const showMerge = sidePanel === 'merge'

  if (isMinimized) {
    return (
      <section className="model-comparison-minimized-bar" role="status" aria-label="최소화된 모델 답변 비교">
        <div>
          <span>모델 비교</span>
          <strong>답변 비교창이 접혀 있습니다</strong>
        </div>
        <button type="button" onClick={onToggleMinimize} aria-label="모델 답변 비교 창 다시 펼치기">
          다시 펼치기
        </button>
      </section>
    )
  }

  return (
    <div className="model-flow-backdrop" role="presentation">
      <div className={sidePanel ? 'model-comparison-shell with-side-panel' : 'model-comparison-shell'}>
        <section className="model-comparison-modal" role="dialog" aria-modal="true" aria-label="모델 답변 비교">
          <header className="model-flow-header">
            <div>
              <span>모델 비교</span>
              <h2>모델 답변 비교</h2>
            </div>
            <div className="model-flow-window-actions">
              <button
                type="button"
                className="model-flow-minimize"
                onClick={onToggleMinimize}
                disabled={isBusy}
                aria-label="모델 답변 비교 창 최소화"
              >
                −
              </button>
              <button type="button" className="model-flow-close" onClick={onClose} aria-label="모델 답변 비교 창 닫기">×</button>
            </div>
          </header>

          <div className="model-answer-grid">
            <ModelAnswerCard
              label="답변 A"
              model={comparison.modelA}
              content={comparison.responseA}
              disabled={isBusy}
              onSelect={() => onSelectAnswer('a', comparison.modelA)}
            />
            <ModelAnswerCard
              label="답변 B"
              model={comparison.modelB}
              content={comparison.responseB}
              disabled={isBusy}
              onSelect={() => onSelectAnswer('b', comparison.modelB)}
            />
          </div>

          <footer className="model-comparison-actions">
            <button
              type="button"
              className={showAnalysis ? 'active' : ''}
              disabled={isBusy}
              onClick={() => {
                setSidePanel('analysis')
                if (!analysis) {
                  onAnalyze()
                }
              }}
            >
              답변 분석
            </button>
            <button
              type="button"
              className={showMerge ? 'active' : ''}
              disabled={isBusy}
              onClick={() => setSidePanel('merge')}
            >
              답변 융합
            </button>
          </footer>
        </section>

        {showAnalysis ? (
          <aside className="comparison-side-panel" aria-label="답변 분석">
            <header>
              <div>
                <span>분석</span>
                <h2>답변 분석</h2>
              </div>
              <button type="button" onClick={() => setSidePanel(null)} aria-label="답변 분석 닫기">×</button>
            </header>
            {analysis ? (
              <div className="comparison-analysis-content">
                <section>
                  <h3>유사한 부분</h3>
                  <RichMessageContent content={normalizeAnalysisText(analysis.similarities)} />
                </section>
                <section>
                  <h3>다른 부분</h3>
                  <RichMessageContent content={normalizeAnalysisText(analysis.differences)} />
                </section>
              </div>
            ) : (
              <p className="comparison-side-loading">두 답변의 차이를 분석하고 있습니다.</p>
            )}
          </aside>
        ) : null}

        {showMerge ? (
          <aside className="comparison-side-panel merge-panel" aria-label="답변 융합">
            <header>
              <div>
                <span>사용자 지시</span>
                <h2>답변 융합</h2>
              </div>
              <button type="button" onClick={() => setSidePanel(null)} aria-label="답변 융합 닫기">×</button>
            </header>
            <div className="merge-panel-guide">
              <strong>두 답변에서 살릴 부분을 자유롭게 알려주세요.</strong>
              <p>예: A의 문제 1 판단과 B의 문제 2 근거를 중심으로 하나의 답변을 만들어줘.</p>
            </div>
            <form
              className="merge-instruction-composer"
              onSubmit={(event) => {
                event.preventDefault()
                const instruction = mergeInstruction.trim()
                if (instruction) {
                  onMerge(instruction)
                }
              }}
            >
              <label htmlFor="merge-instruction">융합 방식</label>
              <textarea
                id="merge-instruction"
                value={mergeInstruction}
                onChange={(event) => setMergeInstruction(event.target.value)}
                disabled={isBusy}
                rows={5}
                placeholder="원하는 융합 방식과 이유를 입력하세요."
              />
              <button type="submit" disabled={isBusy || !mergeInstruction.trim()} aria-label="융합 답변 대화로 보내기">
                {isBusy ? '융합 중...' : '대화로 보내기'}
              </button>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  )
}

function ModelAnswerCard({ label, model, content, disabled, onSelect }) {
  return (
    <article className="model-answer-card">
      <header>
        <span>{label}</span>
        <strong>{model.label}</strong>
      </header>
      <div className="model-answer-content">
        <RichMessageContent content={content} />
      </div>
      <footer>
        <button type="button" disabled={disabled} onClick={onSelect}>모델 선택</button>
      </footer>
    </article>
  )
}

function getModelKey(model) {
  return `${model.provider}:${model.name}`
}

function getProviderLabel(provider) {
  const labels = {
    anthropic: 'Anthropic',
    chatkhu: 'ChatKHU',
    deepseek: 'DeepSeek',
    google: 'Google',
    openai: 'OpenAI',
  }

  return labels[provider] ?? provider
}

function sortModelsByProvider(models) {
  const providerOrder = new Map()
  models.forEach((model) => {
    if (!providerOrder.has(model.provider)) {
      providerOrder.set(model.provider, providerOrder.size)
    }
  })

  return models
    .map((model, index) => ({ model, index }))
    .sort((a, b) => (
      providerOrder.get(a.model.provider) - providerOrder.get(b.model.provider)
      || a.index - b.index
    ))
    .map(({ model }) => model)
}

function normalizeAnalysisText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => `- ${item}`).join('\n')
  }

  return String(value ?? '분석 결과가 없습니다.')
}
