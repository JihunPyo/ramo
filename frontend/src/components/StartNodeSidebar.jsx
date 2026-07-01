import { getSubtreeNodeIds } from '../features/branchGraph/branchGraphModel.js'

const MOCK_USER_AVATAR_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#5b9df8"/><circle cx="40" cy="31" r="14" fill="#fff"/><path d="M17 70c4-15 14-23 23-23s19 8 23 23" fill="#fff"/></svg>',
)}`

const DEFAULT_SIDEBAR_USER_PROFILE = {
  avatarUrl: MOCK_USER_AVATAR_URL,
  name: 'name',
}

export function StartNodeSidebar({
  graphState,
  rootNodes,
  userProfile = DEFAULT_SIDEBAR_USER_PROFILE,
  isCollapsed = false,
  isDrawerMode = false,
  isMobileDrawerOpen = false,
  isBusy = false,
  onToggleCollapse,
  onNewChat,
  onSelectRoot,
  onRestoreFromTrash,
  onDeleteForever,
}) {
  const trashNodes = graphState.trashNodes ?? []
  const trashNodeIds = new Set(trashNodes.map((node) => node.id))
  const trashRoots = trashNodes.filter((node) => !trashNodeIds.has(node.parentId))
  const isDrawerHidden = isDrawerMode && !isMobileDrawerOpen
  const isContentVisible = isDrawerMode ? isMobileDrawerOpen : !isCollapsed
  const toggleLabel = isDrawerMode
    ? isMobileDrawerOpen
      ? '사이드바 닫기'
      : '사이드바 열기'
    : isCollapsed
      ? '사이드바 열기'
      : '사이드바 접기'

  return (
    <aside
      className={isCollapsed ? 'start-sidebar collapsed' : 'start-sidebar'}
      aria-hidden={isDrawerHidden}
      aria-label="시작 노드"
      inert={isDrawerHidden}
    >
      <header className="sidebar-header">
        <div className="sidebar-title">
          <h2>RAMO</h2>
        </div>
        <button
          type="button"
          className="sidebar-toggle-button"
          aria-label={toggleLabel}
          aria-expanded={isContentVisible}
          data-tooltip={toggleLabel}
          title={toggleLabel}
          onClick={onToggleCollapse}
        >
          <span className="sidebar-toggle-icon" aria-hidden="true" />
        </button>
      </header>

      <div className="sidebar-content">
        <button type="button" className="new-chat-button" onClick={onNewChat} disabled={isBusy}>
          새 채팅
        </button>

        <div className="sidebar-scroll-area" aria-hidden={!isContentVisible}>
          <nav className="root-list" aria-label="루트 노드 목록">
            {rootNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                className={node.id === graphState.selectedRootNodeId ? 'root-card selected' : 'root-card'}
                onClick={() => onSelectRoot(node.id)}
                disabled={isBusy}
              >
                <span>{node.title}</span>
                <small>{node.description}</small>
              </button>
            ))}
          </nav>

          <details className="trash-panel">
            <summary>
              <span>휴지통</span>
              <strong>{trashNodes.length}</strong>
            </summary>
            {trashRoots.length > 0 ? (
              <div className="trash-list">
                {trashRoots.map((node) => {
                  const branchCount = getSubtreeNodeIds(trashNodes, node.id).length

                  return (
                    <article key={node.id} className="trash-card">
                      <div>
                        <strong>{node.title}</strong>
                        <small>{branchCount}개 항목</small>
                      </div>
                      <div className="trash-actions">
                        <button
                          type="button"
                          onClick={() => onRestoreFromTrash(node.id)}
                          disabled={isBusy}
                        >
                          복구
                        </button>
                        <button
                          type="button"
                          className="danger-text-button"
                          onClick={() => onDeleteForever(node.id)}
                          disabled={isBusy}
                        >
                          영구 삭제
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="trash-empty">삭제한 항목이 없습니다.</p>
            )}
          </details>
        </div>

        <footer className="sidebar-account" aria-label="사용자 정보">
          <img className="sidebar-account-avatar" src={userProfile.avatarUrl} alt="" aria-hidden="true" />
          <div className="sidebar-account-copy">
            <strong>{userProfile.name}</strong>
          </div>
        </footer>
      </div>
    </aside>
  )
}
