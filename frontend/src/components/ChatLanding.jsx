import { useEffect, useRef, useState } from 'react'

const webSearchOptions = [
  {
    value: 'off',
    label: '사용 안 함',
    description: '필요한 내용은 모델이 알고 있는 정보만으로 답합니다.',
  },
  {
    value: 'always',
    label: '항상 웹검색',
    description: '모든 질문에 웹검색을 사용해 최신 정보를 확인합니다.',
  },
]

const thinkingOptions = [
  { value: 'low', label: '낮음', description: '빠르고 간단한 답변에 적합합니다.' },
  { value: 'medium', label: '중간', description: '속도와 답변 품질의 균형을 맞춥니다.' },
  { value: 'high', label: '높음', description: '복잡한 문제를 더 꼼꼼하게 검토합니다.' },
  { value: 'very-high', label: '매우 높음', description: '시간을 더 사용해 여러 가능성을 깊게 분석합니다.' },
]

const comparisonModelGroups = [
  {
    provider: 'OpenAI',
    mark: '◎',
    models: [
      { id: 'chatgpt-auto', name: 'ChatGPT-Auto' },
      { id: 'gpt-5-5', name: 'GPT-5.5' },
      { id: 'gpt-5-4', name: 'GPT-5.4' },
      { id: 'gpt-5-4-mini', name: 'GPT-5.4 mini' },
      { id: 'gpt-5-4-nano', name: 'GPT-5.4 nano' },
      { id: 'gpt-5-2-chat', name: 'GPT-5.2 Chat' },
      { id: 'gpt-5-2', name: 'GPT-5.2' },
      { id: 'gpt-5-1-chat', name: 'GPT-5.1 Chat' },
      { id: 'gpt-5-1', name: 'GPT-5.1' },
      { id: 'gpt-5-chat', name: 'GPT-5 Chat' },
      { id: 'gpt-5-thinking', name: 'GPT-5 Thinking' },
      { id: 'gpt-5-mini', name: 'GPT-5 mini' },
    ],
  },
  {
    provider: 'Anthropic',
    mark: 'A',
    models: [
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5' },
    ],
  },
  {
    provider: 'Google',
    mark: '✦',
    models: [
      { id: 'gemini-3-1-pro', name: 'Gemini 3.1 Pro' },
      { id: 'gemini-3-flash', name: 'Gemini 3 Flash' },
      { id: 'gemini-2-5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2-5-flash', name: 'Gemini 2.5 Flash' },
    ],
  },
  {
    provider: 'xAI',
    mark: 'X',
    models: [
      { id: 'grok-4-1', name: 'Grok 4.1' },
      { id: 'grok-4', name: 'Grok 4' },
      { id: 'grok-3-mini', name: 'Grok 3 mini' },
    ],
  },
  {
    provider: 'DeepSeek',
    mark: 'D',
    models: [
      { id: 'deepseek-v3-2', name: 'DeepSeek V3.2' },
      { id: 'deepseek-r1', name: 'DeepSeek R1' },
    ],
  },
  {
    provider: 'Perplexity',
    mark: 'P',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro' },
      { id: 'sonar', name: 'Sonar' },
    ],
  },
  {
    provider: 'Mistral AI',
    mark: 'M',
    models: [
      { id: 'mistral-large-3', name: 'Mistral Large 3' },
      { id: 'mistral-medium-3-1', name: 'Mistral Medium 3.1' },
      { id: 'mistral-small-3-2', name: 'Mistral Small 3.2' },
    ],
  },
]

function getOptionLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? ''
}

export function ChatLanding({ activeNode, isBusy = false, onSendMessage }) {
  const [draft, setDraft] = useState('')
  const [activeMenu, setActiveMenu] = useState(null)
  const [webSearch, setWebSearch] = useState('off')
  const [thinkingLevel, setThinkingLevel] = useState('medium')
  const [selectedModels, setSelectedModels] = useState(['chatgpt-auto', 'claude-sonnet-4-6'])
  const optionAreaRef = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!optionAreaRef.current?.contains(event.target)) {
        setActiveMenu(null)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveMenu(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    const messageText = draft.trim()

    if (!messageText) {
      return
    }

    onSendMessage(messageText, {
      webSearch,
      thinkingLevel,
      comparisonModels: selectedModels,
    })
    setDraft('')
    setActiveMenu(null)
  }

  const handleMessageKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const toggleMenu = (menuName) => {
    setActiveMenu((currentMenu) => (currentMenu === menuName ? null : menuName))
  }

  const toggleModel = (modelId) => {
    setSelectedModels((currentModels) => {
      if (currentModels.includes(modelId)) {
        return currentModels.length > 1
          ? currentModels.filter((selectedModel) => selectedModel !== modelId)
          : currentModels
      }

      return [...currentModels, modelId]
    })
  }

  return (
    <section className="chat-landing" aria-label="채팅 시작">
      <div className="landing-mark" aria-hidden="true">
        ✣
      </div>
      <p className="landing-model">{activeNode?.title ?? 'Branch Chat'}</p>
      <h1>무엇을 도와드릴까요?</h1>

      <form className="landing-composer" onSubmit={handleSubmit}>
        <label htmlFor="landing-message">메시지</label>
        <div className="landing-input-row">
          <span aria-hidden="true">＋</span>
          <textarea
            id="landing-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleMessageKeyDown}
            disabled={isBusy}
            rows={3}
            placeholder="메시지를 입력하세요."
          />
          <button type="submit" aria-label="메시지 전송" disabled={isBusy || !draft.trim()}>
            ➤
          </button>
        </div>

        <div className="composer-option-area" ref={optionAreaRef}>
          <div className="prompt-chip-row" aria-label="답변 옵션">
            <button
              type="button"
              className={webSearch === 'always' || activeMenu === 'web' ? 'option-chip active' : 'option-chip'}
              aria-expanded={activeMenu === 'web'}
              aria-controls="web-search-options"
              onClick={() => toggleMenu('web')}
            >
              <span>웹검색</span>
              <small>{getOptionLabel(webSearchOptions, webSearch)}</small>
              <span aria-hidden="true">⌄</span>
            </button>
            <button
              type="button"
              className={thinkingLevel !== 'medium' || activeMenu === 'thinking' ? 'option-chip active' : 'option-chip'}
              aria-expanded={activeMenu === 'thinking'}
              aria-controls="thinking-options"
              onClick={() => toggleMenu('thinking')}
            >
              <span>심층 사고</span>
              <small>{getOptionLabel(thinkingOptions, thinkingLevel)}</small>
              <span aria-hidden="true">⌄</span>
            </button>
            <button
              type="button"
              className={activeMenu === 'models' ? 'option-chip active' : 'option-chip'}
              aria-expanded={activeMenu === 'models'}
              aria-controls="model-comparison-options"
              onClick={() => toggleMenu('models')}
            >
              <span>챗봇 비교</span>
              <small>{selectedModels.length}개 모델</small>
              <span aria-hidden="true">⌄</span>
            </button>
          </div>

          {activeMenu === 'web' ? (
            <section className="composer-option-popover" id="web-search-options" aria-label="웹검색 설정">
              <header>
                <strong>웹검색</strong>
                <p>답변할 때 웹에서 최신 정보를 확인할지 선택하세요.</p>
              </header>
              <div className="option-choice-list" role="radiogroup" aria-label="웹검색 사용 방식">
                {webSearchOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={webSearch === option.value}
                    className={webSearch === option.value ? 'selected' : ''}
                    onClick={() => {
                      setWebSearch(option.value)
                      setActiveMenu(null)
                    }}
                  >
                    <span className="option-check" aria-hidden="true">{webSearch === option.value ? '✓' : ''}</span>
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {activeMenu === 'thinking' ? (
            <section className="composer-option-popover" id="thinking-options" aria-label="심층 사고 설정">
              <header>
                <strong>심층 사고 수준</strong>
                <p>어려운 문제에 사용할 사고 시간과 깊이를 정하세요.</p>
              </header>
              <div className="option-choice-list" role="radiogroup" aria-label="심층 사고 수준">
                {thinkingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={thinkingLevel === option.value}
                    className={thinkingLevel === option.value ? 'selected' : ''}
                    onClick={() => {
                      setThinkingLevel(option.value)
                      setActiveMenu(null)
                    }}
                  >
                    <span className="option-check" aria-hidden="true">{thinkingLevel === option.value ? '✓' : ''}</span>
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {activeMenu === 'models' ? (
            <section
              className="composer-option-popover model-comparison-popover"
              id="model-comparison-options"
              aria-label="챗봇 비교 모델 선택"
            >
              <header>
                <strong>챗봇 비교</strong>
                <p>같은 질문의 답변을 비교할 모델을 선택하세요. 최소 1개가 필요합니다.</p>
              </header>
              <div className="model-provider-list">
                {comparisonModelGroups.map((group) => (
                  <section className="model-provider-group" key={group.provider} aria-label={group.provider}>
                    <h3>{group.provider}</h3>
                    <div className="model-choice-list">
                      {group.models.map((model) => {
                        const isSelected = selectedModels.includes(model.id)

                        return (
                          <label key={model.id} className={isSelected ? 'selected' : ''}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleModel(model.id)}
                            />
                            <span className="model-mark" aria-hidden="true">{group.mark}</span>
                            <strong>{model.name}</strong>
                            <span className="model-selected-check" aria-hidden="true">{isSelected ? '✓' : ''}</span>
                          </label>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
              <footer>
                <span>{selectedModels.length}개 모델 선택됨</span>
                <button type="button" onClick={() => setActiveMenu(null)}>완료</button>
              </footer>
            </section>
          ) : null}
        </div>
      </form>
    </section>
  )
}
