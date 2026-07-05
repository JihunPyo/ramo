import { useState } from 'react'
import { getSessionByNodeId } from '../features/branchGraph/branchGraphModel.js'
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea.js'
import { ModelSelector } from './ModelSelector.jsx'
import { RichMessageContent } from './RichMessageContent.jsx'
import { getMessageRoleLabel } from './messageRoleLabel.js'

export function SplitConversationPanel({
  graphState,
  node,
  isBusy = false,
  isAwaitingResponse = false,
  pendingUserMessage = '',
  modelOptions = [],
  selectedModel,
  onChangeModel,
  onOpenModelComparison,
  onSendMessage,
  onCreateBranch,
  onClose,
}) {
  const [draft, setDraft] = useState('')
  const textareaRef = useAutoResizeTextarea(draft, { maxHeight: 180 })
  const session = getSessionByNodeId(graphState, node?.id ?? '')
  const messages = session.messages.filter((message) => !message.isHidden && message.role !== 'system')
  const inputId = `split-message-${node?.id ?? 'node'}`

  const handleSubmit = (event) => {
    event.preventDefault()
    const messageText = draft.trim()

    if (!messageText) {
      return
    }

    onSendMessage?.(messageText)
    setDraft('')
  }

  return (
    <aside className="split-conversation-panel" aria-label={`${node?.title ?? '선택 노드'} 대화`}>
      <header>
        <div className="split-pane-heading">
          <h2>{node?.title}</h2>
        </div>
        <div className="split-conversation-header-actions">
          <button type="button" className="split-conversation-close" onClick={onClose} aria-label="선택 노드 대화창 닫기">×</button>
        </div>
      </header>

      <div className="message-list split-conversation-messages">
        {messages.length > 0 ? messages.map((message) => (
          <article key={message.id} className={`message-row ${message.role}`}>
            <div className="message-bubble">
              <span className="message-role">{getMessageRoleLabel(message, modelOptions)}</span>
              <RichMessageContent content={message.content} />
              {message.role === 'assistant' ? (
                <div className="message-actions">
                  <button
                    type="button"
                    onClick={() => onCreateBranch?.(message.id, node.id)}
                    disabled={isBusy}
                  >
                    브랜치 생성
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        )) : (
          <p className="split-conversation-empty">이 노드에는 아직 표시할 대화가 없습니다.</p>
        )}
        {isAwaitingResponse && pendingUserMessage ? (
          <article className="message-row user pending-user-message" aria-label="방금 보낸 질문">
            <div className="message-bubble">
              <RichMessageContent content={pendingUserMessage} />
            </div>
          </article>
        ) : null}
        {isAwaitingResponse ? (
          <article className="message-row assistant pending-response" aria-live="polite" aria-label="답변 생성 대기">
            <span className="pending-response-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </article>
        ) : null}
      </div>

      <form className="composer split-composer" onSubmit={handleSubmit}>
        <label htmlFor={inputId}>메시지</label>
        <textarea
          ref={textareaRef}
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          disabled={isBusy}
          rows={1}
          placeholder="이 노드에서 이어서 질문하세요."
        />
        <div className="composer-model-controls">
          <ModelSelector
            modelOptions={modelOptions}
            selectedModel={selectedModel}
            onChangeModel={onChangeModel}
            disabled={isBusy}
            placement="top"
            className="composer-model-selector"
          />
          <button
            type="button"
            className="composer-compare-button"
            disabled={isBusy}
            onClick={() => onOpenModelComparison?.(draft.trim())}
          >
            모델 비교
          </button>
        </div>
        <button type="submit" className="send-button" aria-label="선택 노드 메시지 전송" disabled={isBusy || !draft.trim()}>
          <span aria-hidden="true">↑</span>
        </button>
      </form>
    </aside>
  )
}
