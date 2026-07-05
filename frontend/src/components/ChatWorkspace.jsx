import { Fragment, useEffect, useRef, useState } from 'react'
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea.js'
import {
  getBranchPath,
  getContextSectionsForNode,
  getMainPathNodeIds,
  getMergeSourceSummaries,
  getSessionByNodeId,
  isMergeNode,
} from '../features/branchGraph/branchGraphModel.js'
import { ModelSelector } from './ModelSelector.jsx'
import { RichMessageContent } from './RichMessageContent.jsx'
import { getMessageRoleLabel } from './messageRoleLabel.js'

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
  isSplitViewOpen = false,
  onSendMessage,
  onCreateBranch,
  onRenameSession,
}) {
  const [draft, setDraft] = useState('')
  const [isRenamingSession, setIsRenamingSession] = useState(false)
  const [sessionNameDraft, setSessionNameDraft] = useState('')
  const [comparisonNodeId, setComparisonNodeId] = useState(null)
  const [previousContextState, setPreviousContextState] = useState({ nodeId: null, revealedCount: 0 })
  const activeSectionRef = useRef(null)
  const activeStartMessageRef = useRef(null)
  const messageListRef = useRef(null)
  const previousConversationStateRef = useRef(null)
  const previousContextAnchorTopRef = useRef(null)
  const textareaRef = useAutoResizeTextarea(draft, { maxHeight: 180 })

  const branchPath = getBranchPath(graphState.nodes, activeNode?.id ?? '')
  const rootNode = branchPath[0]
  const mainPathNodeIds = getMainPathNodeIds(graphState, activeNode?.rootId ?? '')
  const contextSections = getContextSectionsForNode(graphState, activeNode?.id ?? '')
  const isActiveMergeNode = isMergeNode(activeNode)
  const mergeSourceSummaries = getMergeSourceSummaries(graphState, activeNode?.id ?? '')
  const shouldHideMergeResultMessage = isActiveMergeNode && mergeSourceSummaries.length > 0
  const comparisonNode = branchPath.find((node) => node.id === comparisonNodeId)
  const revealedPreviousContextCount = previousContextState.nodeId === activeNode?.id
    ? previousContextState.revealedCount
    : 0
  const isPreviousContextOpen = revealedPreviousContextCount > 0
  const contextSectionsWithMessages = contextSections.map((section) => ({
    ...section,
    visibleMessages: section.session.messages.filter((message) =>
      isVisibleMessage(message, {
        hideMergeSeed: shouldHideMergeResultMessage && section.node.id === activeNode?.id,
        sectionMessages: section.session.messages,
      }),
    ),
  }))
  const activeSectionIndex = contextSectionsWithMessages.findIndex((section) => section.node.id === activeNode?.id)
  const previousContextSections = activeSectionIndex > 0
    ? contextSectionsWithMessages.slice(0, activeSectionIndex)
    : []
  const visiblePreviousContextSections = revealedPreviousContextCount > 0
    ? previousContextSections.slice(Math.max(0, previousContextSections.length - revealedPreviousContextCount))
    : []
  const hasHiddenPreviousContext = previousContextSections.length > visiblePreviousContextSections.length
  const currentContextSections = activeSectionIndex >= 0
    ? contextSectionsWithMessages.slice(activeSectionIndex)
    : contextSectionsWithMessages
  const renderedContextSections = isPreviousContextOpen
    ? [...visiblePreviousContextSections, ...currentContextSections]
    : currentContextSections
  const hasActiveStartMessage = contextSectionsWithMessages.some(
    (section) => section.node.id === activeNode?.id && section.visibleMessages.length > 0,
  )
  const visibleMessageCount = renderedContextSections.reduce(
    (count, section) => count + section.visibleMessages.length,
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
    if (!isSplitViewOpen) {
      return undefined
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      messageListRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    })

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [activeNode?.id, isSplitViewOpen])

  useEffect(() => {
    const previousState = previousConversationStateRef.current
    const currentState = {
      nodeId: activeNode?.id,
      messageCount: visibleMessageCount,
      isAwaitingResponse,
    }

    previousConversationStateRef.current = currentState

    if (previousContextAnchorTopRef.current !== null) {
      const anchorTop = previousContextAnchorTopRef.current
      previousContextAnchorTopRef.current = null

      const animationFrameId = window.requestAnimationFrame(() => {
        const scrollTarget = activeStartMessageRef.current ?? activeSectionRef.current
        const messageList = messageListRef.current

        if (!scrollTarget || !messageList) {
          return
        }

        const nextAnchorTop = scrollTarget.getBoundingClientRect().top
        messageList.scrollTop += nextAnchorTop - anchorTop
      })

      return () => window.cancelAnimationFrame(animationFrameId)
    }

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

    const wasRenamed = await onRenameSession(rootNode.id, nextName)

    if (wasRenamed) {
      setIsRenamingSession(false)
    }
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
    <section
      className={isSplitViewOpen ? 'chat-workspace with-chat-header split-conversation-panel' : 'chat-workspace'}
      aria-label="현재 노드 채팅 세션"
    >
      <header className="chat-header">
        <div className="chat-header-context">
          {isSplitViewOpen ? (
            <div className="split-pane-heading">
              <h2>{activeNode?.title}</h2>
            </div>
          ) : isRenamingSession ? (
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
          {!isSplitViewOpen ? (
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
          ) : null}
        </div>
      </header>

      {comparisonNode && !isSplitViewOpen ? (
        <NodeComparison
          activeNode={activeNode}
          activeSession={getSessionByNodeId(graphState, activeNode?.id ?? '')}
          comparisonNode={comparisonNode}
          comparisonSession={getSessionByNodeId(graphState, comparisonNode.id)}
          isAwaitingResponse={isAwaitingResponse}
          modelOptions={modelOptions}
          selectedModel={selectedModel}
          onClose={() => setComparisonNodeId(null)}
        />
      ) : (
      <section ref={messageListRef} className="message-list" aria-label="메시지 목록">
        {hasHiddenPreviousContext ? (
          <button
            type="button"
            className={isPreviousContextOpen ? 'previous-context-toggle active' : 'previous-context-toggle'}
            aria-expanded={isPreviousContextOpen}
            aria-label={isPreviousContextOpen ? '이전 대화 숨기기' : '이전 대화 보기'}
            onClick={() => {
              setPreviousContextState((currentState) => {
                const currentRevealedCount = currentState.nodeId === activeNode?.id
                  ? currentState.revealedCount
                  : 0
                const nextRevealedCount = Math.min(previousContextSections.length, currentRevealedCount + 1)

                const scrollTarget = activeStartMessageRef.current ?? activeSectionRef.current
                previousContextAnchorTopRef.current = scrollTarget?.getBoundingClientRect().top ?? null

                return {
                  nodeId: activeNode?.id ?? null,
                  revealedCount: nextRevealedCount,
                }
              })
            }}
          >
            <span aria-hidden="true">↑</span>
          </button>
        ) : null}
        {renderedContextSections.map((section) => {
          return (
            <Fragment key={section.node.id}>
              {shouldHideMergeResultMessage && section.node.id === activeNode?.id ? (
                <MergeSummaryPanel summaries={mergeSourceSummaries} />
              ) : null}
              <section
                ref={section.node.id === activeNode?.id ? activeSectionRef : undefined}
                className={section.node.id === activeNode?.id ? 'context-section current' : 'context-section previous'}
              >
                {section.visibleMessages.map((message, messageIndex) => (
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
                      <span className="message-role">{getMessageRoleLabel(message, modelOptions)}</span>
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
            </Fragment>
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
        {isAwaitingResponse ? (
          <PendingAssistantMessage modelOptions={modelOptions} selectedModel={selectedModel} />
        ) : null}
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
            <div className="merge-summary-message">
              <RichMessageContent content={summary.summary} />
            </div>
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
  modelOptions,
  selectedModel,
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
        <ComparisonColumn node={comparisonNode} session={comparisonSession} modelOptions={modelOptions} />
        <ComparisonColumn
          node={activeNode}
          session={activeSession}
          isCurrent
          isAwaitingResponse={isAwaitingResponse}
          modelOptions={modelOptions}
          selectedModel={selectedModel}
        />
      </div>
    </section>
  )
}

function ComparisonColumn({
  node,
  session,
  isCurrent = false,
  isAwaitingResponse = false,
  modelOptions = [],
  selectedModel,
}) {
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
            <span>{getMessageRoleLabel(message, modelOptions)}</span>
            <RichMessageContent content={message.content} />
          </div>
        )) : <p className="comparison-empty">이 노드에는 아직 표시할 대화가 없습니다.</p>}
        {isCurrent && isAwaitingResponse ? (
          <PendingAssistantMessage modelOptions={modelOptions} selectedModel={selectedModel} />
        ) : null}
      </div>
    </article>
  )
}

function PendingAssistantMessage() {
  return (
    <article className="message-row assistant pending-response" aria-live="polite" aria-label="답변 생성 대기">
      <span className="pending-response-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </article>
  )
}

function isVisibleMessage(message, { hideMergeSeed = false, sectionMessages = [] } = {}) {
  return (
    !message.isHidden &&
    message.role !== 'system' &&
    !(hideMergeSeed && isInitialMergeSeedMessage(message, sectionMessages))
  )
}

function isInitialMergeSeedMessage(message, sectionMessages) {
  return getInitialMergeSeedMessageIds(sectionMessages).has(message.id)
}

function getInitialMergeSeedMessageIds(messages) {
  const seedMessageIds = new Set()
  let hasBranchSummarySeed = false

  for (const message of messages) {
    if (message.isHidden || message.role === 'system') {
      continue
    }

    if (isBranchSummarySeedMessage(message)) {
      seedMessageIds.add(message.id)
      hasBranchSummarySeed = true
      continue
    }

    if (isMergeResultSeedMessage(message) || (hasBranchSummarySeed && isMergeSeedAckMessage(message))) {
      seedMessageIds.add(message.id)
      continue
    }

    break
  }

  return seedMessageIds
}

function isBranchSummarySeedMessage(message) {
  return /^\s*\[브랜치[^\]]*요약[^\]]*\]/u.test(String(message.content ?? ''))
}

function isMergeSeedAckMessage(message) {
  return message.role === 'assistant' && String(message.content ?? '').trim() === '확인했습니다.'
}

function isMergeResultSeedMessage(message) {
  return message.kind === 'merge_result'
}
