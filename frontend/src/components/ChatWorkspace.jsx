import { useState } from 'react'
import {
  getBranchPath,
  getChildrenByNodeId,
  getContextSectionsForNode,
  getMainPathNodeIds,
} from '../features/branchGraph/branchGraphModel.js'

export function ChatWorkspace({
  activeNode,
  session,
  graphState,
  isBusy = false,
  onSendMessage,
  onCreateBranch,
  onSetMainTarget,
}) {
  const [draft, setDraft] = useState('')

  const branchPath = getBranchPath(graphState.nodes, activeNode?.id ?? '')
  const mainPathNodeIds = getMainPathNodeIds(graphState, activeNode?.rootId ?? '')
  const childNodes = getChildrenByNodeId(graphState.nodes, activeNode?.id ?? '')
  const isActiveNodeOnMainPath = activeNode ? mainPathNodeIds.has(activeNode.id) : false
  const contextSections = getContextSectionsForNode(graphState, activeNode?.id ?? '')

  const handleSubmit = (event) => {
    event.preventDefault()
    const messageText = draft.trim()

    if (!messageText) {
      return
    }

    onSendMessage(messageText)
    setDraft('')
  }

  return (
    <section className="chat-workspace" aria-label="현재 노드 채팅 세션">
      <header className="chat-header">
        <div>
          <p className="eyebrow">현재 세션</p>
          <h1>{activeNode?.title}</h1>
          <div className="path-line">
            {branchPath.map((node) => (
              <span key={node.id} className={mainPathNodeIds.has(node.id) ? 'main-path-pill' : ''}>
                {node.title}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="primary-action"
          onClick={() => onSetMainTarget(activeNode.id)}
          disabled={isBusy}
        >
          main 지정
        </button>
      </header>

      <section className="node-summary" aria-label="노드 상태">
        <div>
          <span>main 경로</span>
          <strong>{isActiveNodeOnMainPath ? '포함' : '미포함'}</strong>
        </div>
        <div>
          <span>하위 노드</span>
          <strong>{childNodes.length}</strong>
        </div>
        <div>
          <span>포함 노드</span>
          <strong>{contextSections.length}</strong>
        </div>
        <div>
          <span>현재 세션</span>
          <strong>{session?.id}</strong>
        </div>
      </section>

      <section className="message-list" aria-label="메시지 목록">
        {contextSections.map((section, sectionIndex) => (
          <section key={section.node.id} className="context-section">
            <header className="context-section-header">
              <span>{sectionIndex === contextSections.length - 1 ? '현재 노드' : '상위 노드'}</span>
              <strong>{section.node.title}</strong>
            </header>

            {section.session.messages.map((message) => (
              <article key={message.id} className={`message-row ${message.role}`}>
                <div className="message-bubble">
                  <span className="message-role">{message.role === 'user' ? 'User' : 'AI'}</span>
                  <p>{message.content}</p>
                  <div className="message-actions">
                    <time>{message.createdAt}</time>
                    <button
                      type="button"
                      onClick={() => onCreateBranch(message.id, section.node.id)}
                      disabled={isBusy}
                    >
                      브랜치 생성
                    </button>
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
          id="message-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={isBusy}
          rows={3}
          placeholder="현재 노드에서 이어서 질문한다."
        />
        <button type="submit" className="send-button" disabled={isBusy}>
          전송
        </button>
      </form>
    </section>
  )
}
