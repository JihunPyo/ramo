import { useEffect, useRef, useState } from 'react'
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea.js'
import {
  getBranchPath,
  getContextSectionsForNode,
  getMainPathNodeIds,
} from '../features/branchGraph/branchGraphModel.js'

export function ChatWorkspace({
  activeNode,
  graphState,
  nodeNavigationKey = 0,
  isBusy = false,
  onSendMessage,
  onCreateBranch,
  onRenameSession,
}) {
  const [draft, setDraft] = useState('')
  const [isRenamingSession, setIsRenamingSession] = useState(false)
  const [sessionNameDraft, setSessionNameDraft] = useState('')
  const activeSectionRef = useRef(null)
  const activeStartMessageRef = useRef(null)
  const textareaRef = useAutoResizeTextarea(draft, { maxHeight: 180 })

  const branchPath = getBranchPath(graphState.nodes, activeNode?.id ?? '')
  const rootNode = branchPath[0]
  const mainPathNodeIds = getMainPathNodeIds(graphState, activeNode?.rootId ?? '')
  const isActiveNodeOnMainPath = activeNode ? mainPathNodeIds.has(activeNode.id) : false
  const contextSections = getContextSectionsForNode(graphState, activeNode?.id ?? '')
  const hasActiveStartMessage = contextSections.some(
    (section) => section.node.id === activeNode?.id && section.session.messages.length > 0,
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
          <h1>{activeNode?.title}</h1>
          <div className="path-line">
            {branchPath.map((node) => (
              <span key={node.id} className={mainPathNodeIds.has(node.id) ? 'main-path-pill' : ''}>
                {node.title}
              </span>
            ))}
          </div>
        </div>
        <span className={isActiveNodeOnMainPath ? 'session-main-state included' : 'session-main-state'}>
          {isActiveNodeOnMainPath ? 'main 경로' : '분기 경로'}
        </span>
      </header>

      <section className="message-list" aria-label="메시지 목록">
        {contextSections.map((section, sectionIndex) => (
          <section
            key={section.node.id}
            ref={section.node.id === activeNode?.id ? activeSectionRef : undefined}
            className="context-section"
          >
            <header className="context-section-header">
              <span>{sectionIndex === contextSections.length - 1 ? '현재 노드' : '상위 노드'}</span>
              <strong>{section.node.title}</strong>
            </header>

            {section.session.messages.map((message, messageIndex) => (
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
                  <span className="message-role">{message.role === 'user' ? 'User' : 'AI'}</span>
                  <p>{message.content}</p>
                  <div className="message-actions">
                    <time>{message.createdAt}</time>
                    {message.role === 'assistant' ? (
                      <button
                        type="button"
                        onClick={() => onCreateBranch(message.id, section.node.id)}
                        disabled={isBusy}
                      >
                        브랜치 생성
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </section>
        ))}
      </section>

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
        <button type="submit" className="send-button" aria-label="메시지 전송" disabled={isBusy || !draft.trim()}>
          <span aria-hidden="true">↑</span>
        </button>
      </form>
    </section>
  )
}
