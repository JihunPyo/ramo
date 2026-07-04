import { useEffect, useRef, useState } from 'react'
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea.js'
import {
  getBranchPath,
  getContextSectionsForNode,
  getMainPathNodeIds,
  getMergeSourceSummaries,
  getSessionByNodeId,
  isMergeNode,
} from '../features/branchGraph/branchGraphModel.js'
import { RichMessageContent } from './RichMessageContent.jsx'

export function ChatWorkspace({
  activeNode,
  graphState,
  nodeNavigationKey = 0,
  isBusy = false,
  isAwaitingResponse = false,
  pendingUserMessage = '',
  modelOptions = [],
  selectedModel,
  onChangeModel,
  onOpenModelComparison,
  onSendMessage,
  onCreateBranch,
  onRenameSession,
}) {
  const [draft, setDraft] = useState('')
  const [isRenamingSession, setIsRenamingSession] = useState(false)
  const [sessionNameDraft, setSessionNameDraft] = useState('')
  const [comparisonNodeId, setComparisonNodeId] = useState(null)
  const activeSectionRef = useRef(null)
  const activeStartMessageRef = useRef(null)
  const messageListRef = useRef(null)
  const previousConversationStateRef = useRef(null)
  const textareaRef = useAutoResizeTextarea(draft, { maxHeight: 180 })

  const branchPath = getBranchPath(graphState.nodes, activeNode?.id ?? '')
  const rootNode = branchPath[0]
  const mainPathNodeIds = getMainPathNodeIds(graphState, activeNode?.rootId ?? '')
  const contextSections = getContextSectionsForNode(graphState, activeNode?.id ?? '')
  const isActiveMergeNode = isMergeNode(activeNode)
  const mergeSourceSummaries = getMergeSourceSummaries(graphState, activeNode?.id ?? '')
  const shouldHideMergeResultMessage = isActiveMergeNode && mergeSourceSummaries.length > 0
  const comparisonNode = branchPath.find((node) => node.id === comparisonNodeId)
  const hasActiveStartMessage = contextSections.some(
    (section) => section.node.id === activeNode?.id && section.session.messages.length > 0,
  )
  const visibleMessageCount = contextSections.reduce(
    (count, section) => {
      const sectionMessages = section.session.messages.filter((message) =>
        isVisibleMessage(message, {
          hideMergeResult: shouldHideMergeResultMessage && section.node.id === activeNode?.id,
        }),
      )

      return count + sectionMessages.length
    },
    0,
  )

  useEffect(() => {
    if (nodeNavigationKey === 0) {
      return undefined
    }

    let scrollAnimationFrameId
    const renderAnimationFrameId = window.requestAnimationFrame(() => {
      scrollAnimationFrameId = window.requestAnimationFrame(() => {
        const scrollTarget = activeStartMessageRef.current ?? activeSectionRef.current

        scrollTarget?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        })
      })
    })

    return () => {
      window.cancelAnimationFrame(renderAnimationFrameId)
      window.cancelAnimationFrame(scrollAnimationFrameId)
    }
  }, [hasActiveStartMessage, nodeNavigationKey])

  useEffect(() => {
    const previousState = previousConversationStateRef.current
    const currentState = {
      nodeId: activeNode?.id,
      messageCount: visibleMessageCount,
      isAwaitingResponse,
    }

    previousConversationStateRef.current = currentState

    const shouldScrollToBottom =
      previousState?.nodeId === currentState.nodeId &&
      (currentState.messageCount > previousState.messageCount ||
        (!previousState.isAwaitingResponse && currentState.isAwaitingResponse))

    if (!shouldScrollToBottom) {
      return undefined
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      messageListRef.current?.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      })
    })

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [activeNode?.id, isAwaitingResponse, visibleMessageCount])

  const handleSubmit = (event) => {
    event.preventDefault()
    const messageText = draft.trim()

    if (!messageText) {
      return
    }

    onSendMessage(messageText)
    setDraft('')
  }

  const handleMessageKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const startRenamingSession = () => {
    setSessionNameDraft(rootNode?.title ?? '')
    setIsRenamingSession(true)
  }

  const submitSessionName = async () => {
    const nextName = sessionNameDraft.trim()

    if (!rootNode || !nextName) {
      return
    }

    await onRenameSession(rootNode.id, nextName)
    setIsRenamingSession(false)
  }

  const handleSessionNameKeyDown = (event) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submitSessionName()
    }

    if (event.key === 'Escape') {
      setIsRenamingSession(false)
    }
  }

  return (
    <section className="chat-workspace" aria-label="현재 노드 채팅 세션">
      <header className="chat-header">
        <div>
          {isRenamingSession ? (
            <div className="session-name-editor">
              <input
                value={sessionNameDraft}
                onChange={(event) => setSessionNameDraft(event.target.value)}
                onKeyDown={handleSessionNameKeyDown}
                aria-label="세션 이름"
                maxLength={60}
                autoFocus
              />
              <button type="button" onClick={() => void submitSessionName()} disabled={isBusy || !sessionNameDraft.trim()}>저장</button>
              <button type="button" onClick={() => setIsRenamingSession(false)}>취소</button>
            </div>
          ) : (
            <button type="button" className="session-name-button" onClick={startRenamingSession} disabled={isBusy}>
              <span>세션</span>
              <strong>{rootNode?.title}</strong>
              <span aria-hidden="true">✎</span>
            </button>
          )}
          <div className="path-line">
            {branchPath.map((node) => (
              <button
                key={node.id}
                type="button"
                className={[
                  mainPathNodeIds.has(node.id) ? 'main-path-pill' : '',
                  node.id === comparisonNodeId ? 'comparison-selected' : '',
                  node.id === activeNode?.id ? 'current-path-node' : '',
                ].filter(Boolean).join(' ')}
                aria-pressed={node.id === comparisonNodeId}
                title={node.id === activeNode?.id ? '비교 화면 닫기' : `${node.title} 노드와 비교`}
                onClick={() => setComparisonNodeId(node.id === activeNode?.id ? null : node.id)}
              >
                {node.title}
              </button>
            ))}
          </div>
        </div>
      </header>

      {comparisonNode ? (
        <NodeComparison
          activeNode={activeNode}
          activeSession={getSessionByNodeId(graphState, activeNode?.id ?? '')}
          comparisonNode={comparisonNode}
          comparisonSession={getSessionByNodeId(graphState, comparisonNode.id)}
          isAwaitingResponse={isAwaitingResponse}
          onClose={() => setComparisonNodeId(null)}
        />
      ) : (
      <section ref={messageListRef} className="message-list" aria-label="메시지 목록">
        {shouldHideMergeResultMessage ? (
          <MergeSummaryPanel summaries={mergeSourceSummaries} />
        ) : null}
        {contextSections.map((section) => {
          const visibleMessages = section.session.messages.filter((message) =>
            isVisibleMessage(message, {
              hideMergeResult: shouldHideMergeResultMessage && section.node.id === activeNode?.id,
            }),
          )

          return (
            <section
              key={section.node.id}
              ref={section.node.id === activeNode?.id ? activeSectionRef : undefined}
              className="context-section"
            >
              {visibleMessages.map((message, messageIndex) => (
                <article
                  key={message.id}
                  ref={
                    section.node.id === activeNode?.id && messageIndex === 0
                      ? activeStartMessageRef
                      : undefined
                  }
                  className={`message-row ${message.role}`}
                >
                  <div className="message-bubble">
                    <span className="message-role">{getMessageRoleLabel(message)}</span>
                    <RichMessageContent content={message.content} />
                    {message.role === 'assistant' ? (
                      <div className="message-actions">
                        <button
                          type="button"
                          onClick={() => onCreateBranch(message.id, section.node.id)}
                          disabled={isBusy}
                        >
                          브랜치 생성
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>
          )
        })}
        {isAwaitingResponse && pendingUserMessage ? (
          <article className="message-row user pending-user-message" aria-label="방금 보낸 질문">
            <div className="message-bubble">
              <span className="message-role">User</span>
              <RichMessageContent content={pendingUserMessage} />
            </div>
          </article>
        ) : null}
        {isAwaitingResponse ? <PendingAssistantMessage /> : null}
      </section>
      )}

      <form className="composer" onSubmit={handleSubmit}>
        <label htmlFor="message-input">메시지</label>
        <textarea
          ref={textareaRef}
          id="message-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleMessageKeyDown}
          disabled={isBusy}
          rows={1}
          placeholder="현재 대화에서 이어서 질문하세요."
        />
        <label className="composer-model-label" htmlFor="chat-model-select">현재 모델</label>
        <select
          id="chat-model-select"
          className="composer-model-select"
          value={selectedModel?.name ?? ''}
          onChange={(event) => {
            const nextModel = modelOptions.find((model) => model.name === event.target.value)
            if (nextModel) {
              onChangeModel?.(nextModel)
            }
          }}
          disabled={isBusy}
          aria-label="사용 모델 선택"
        >
          {modelOptions.map((model) => (
            <option key={`${model.provider}:${model.name}`} value={model.name}>
              {model.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="composer-compare-button"
          disabled={isBusy}
          onClick={() => onOpenModelComparison?.(draft.trim())}
        >
          모델 비교
        </button>
        <button type="submit" className="send-button" aria-label="메시지 전송" disabled={isBusy || !draft.trim()}>
          <span aria-hidden="true">↑</span>
        </button>
      </form>
    </section>
  )
}

function MergeSummaryPanel({ summaries }) {
  return (
    <section className="merge-summary-panel" aria-label="병합 대상 요약">
      <header className="merge-summary-header">
        <span>병합 요약</span>
        <strong>선택된 노드 요약</strong>
      </header>
      <div className="merge-summary-grid">
        {summaries.map((summary) => (
          <article key={summary.id} className="merge-summary-card">
            <span className="merge-source-label">대상 {summary.index}</span>
            <h2>{summary.title}</h2>
            <p>{summary.summary}</p>
            {summary.tags.length > 0 ? (
              <div className="merge-summary-tags" aria-label={`${summary.title} 태그`}>
                {summary.tags.slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function NodeComparison({
  activeNode,
  activeSession,
  comparisonNode,
  comparisonSession,
  isAwaitingResponse,
  onClose,
}) {
  return (
    <section className="node-comparison" aria-label="노드 답변 비교">
      <header className="node-comparison-header">
        <div>
          <strong>노드 답변 비교</strong>
          <span>두 흐름의 질문과 답변을 한 화면에서 확인합니다.</span>
        </div>
        <button type="button" onClick={onClose}>비교 닫기</button>
      </header>
      <div className="node-comparison-grid">
        <ComparisonColumn node={comparisonNode} session={comparisonSession} />
        <ComparisonColumn node={activeNode} session={activeSession} isCurrent isAwaitingResponse={isAwaitingResponse} />
      </div>
    </section>
  )
}

function ComparisonColumn({ node, session, isCurrent = false, isAwaitingResponse = false }) {
  const messages = session.messages.filter(isVisibleMessage)

  return (
    <article className={isCurrent ? 'comparison-column current' : 'comparison-column'}>
      <header>
        <span>{isCurrent ? '현재 노드' : '비교 노드'}</span>
        <h2>{node?.title}</h2>
      </header>
      <div className="comparison-messages">
        {messages.length > 0 ? messages.map((message) => (
          <div key={message.id} className={`comparison-message ${message.role}`}>
            <span>{getMessageRoleLabel(message)}</span>
            <RichMessageContent content={message.content} />
          </div>
        )) : <p className="comparison-empty">이 노드에는 아직 표시할 대화가 없습니다.</p>}
        {isCurrent && isAwaitingResponse ? <PendingAssistantMessage /> : null}
      </div>
    </article>
  )
}

function PendingAssistantMessage() {
  return (
    <article className="message-row assistant pending-response" aria-live="polite" aria-label="답변 생성 대기">
      <div className="message-bubble pending-response-bubble">
        <span className="message-role">Ramo</span>
        <div className="pending-response-card">
          <span className="pending-response-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div>
            <strong>답변을 구성하는 중이다.</strong>
            <p>현재 노드의 맥락과 선택한 모델 응답을 기다리고 있다.</p>
          </div>
        </div>
        <div className="pending-response-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </article>
  )
}

function isVisibleMessage(message, { hideMergeResult = false } = {}) {
  return !message.isHidden && message.role !== 'system' && !(hideMergeResult && message.kind === 'merge_result')
}

function getMessageRoleLabel(message) {
  if (message.role === 'user') {
    return 'User'
  }

  return message.modelName || message.modelProvider || 'Ramo'
}
