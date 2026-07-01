import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  onOpenHome,
  onNewChat,
  onSelectRoot,
  onMoveSessionToTrash,
  onRestoreFromTrash,
  onDeleteForever,
}) {
  const [contextMenu, setContextMenu] = useState(null)
  const [toggleTooltip, setToggleTooltip] = useState(null)
  const contextMenuRef = useRef(null)
  const toggleButtonRef = useRef(null)
  const trashNodes = graphState.trashNodes ?? []
  const trashNodeIds = new Set(trashNodes.map((node) => node.id))
  const trashRoots = trashNodes.filter((node) => {
    const parentIds = node.parentIds?.length ? node.parentIds : [node.parentId]

    return !parentIds.some((parentId) => trashNodeIds.has(parentId))
  })
  const rootNodeById = useMemo(
    () => new Map(rootNodes.map((node) => [node.id, node])),
    [rootNodes],
  )
  const isDrawerHidden = isDrawerMode && !isMobileDrawerOpen
  const isContentVisible = isDrawerMode ? isMobileDrawerOpen : !isCollapsed
  const contextNode = contextMenu ? rootNodeById.get(contextMenu.nodeId) : null
  const toggleLabel = isDrawerMode
    ? isMobileDrawerOpen
      ? '사이드바 닫기'
      : '사이드바 열기'
    : isCollapsed
      ? '사이드바 열기'
      : '사이드바 접기'

  const getToggleTooltipPosition = useCallback(() => {
    const buttonRect = toggleButtonRef.current?.getBoundingClientRect()

    if (!buttonRect) {
      return null
    }

    const tooltipWidth = 132
    const gap = 12
    const shouldPlaceRight = isCollapsed && !isDrawerMode
    const sidebarRight = toggleButtonRef.current
      ?.closest('.start-sidebar')
      ?.getBoundingClientRect()
      .right
    const preferredLeft = shouldPlaceRight
      ? Math.max(buttonRect.right + gap, (sidebarRight ?? buttonRect.right) + 8)
      : buttonRect.left - tooltipWidth - gap
    const fallbackLeft = buttonRect.right + gap

    return {
      label: toggleLabel,
      left: Math.max(8, preferredLeft < 8 ? fallbackLeft : preferredLeft),
      top: buttonRect.top + buttonRect.height / 2,
    }
  }, [isCollapsed, isDrawerMode, toggleLabel])

  useEffect(() => {
    if (!contextMenu) {
      return undefined
    }

    const closeContextMenu = () => {
      setContextMenu(null)
    }

    const handlePointerDown = (event) => {
      if (!contextMenuRef.current?.contains(event.target)) {
        closeContextMenu()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeContextMenu()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', closeContextMenu)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', closeContextMenu)
    }
  }, [contextMenu])

  useEffect(() => {
    if (isContentVisible || !contextMenu) {
      return undefined
    }

    const timerId = window.setTimeout(() => {
      setContextMenu(null)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [contextMenu, isContentVisible])

  useEffect(() => {
    if (!toggleTooltip) {
      return undefined
    }

    const updateToggleTooltip = () => {
      setToggleTooltip(getToggleTooltipPosition())
    }
    const timerId = window.setTimeout(updateToggleTooltip, 0)

    window.addEventListener('resize', updateToggleTooltip)
    window.addEventListener('scroll', updateToggleTooltip, true)

    return () => {
      window.clearTimeout(timerId)
      window.removeEventListener('resize', updateToggleTooltip)
      window.removeEventListener('scroll', updateToggleTooltip, true)
    }
  }, [getToggleTooltipPosition, toggleTooltip])

  const showToggleTooltip = () => {
    setToggleTooltip(getToggleTooltipPosition())
  }

  const hideToggleTooltip = () => {
    setToggleTooltip(null)
  }

  const openContextMenu = (event, nodeId) => {
    event.preventDefault()

    if (isBusy) {
      return
    }

    const menuWidth = 176
    const menuHeight = 88

    setContextMenu({
      nodeId,
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8)),
    })
  }

  const handleSelectRoot = (nodeId) => {
    setContextMenu(null)
    onSelectRoot(nodeId)
  }

  const handleMoveSessionToTrash = () => {
    if (!contextNode) {
      return
    }

    const nodeId = contextNode.id
    setContextMenu(null)
    onMoveSessionToTrash?.(nodeId)
  }

  return (
    <aside
      className={isCollapsed ? 'start-sidebar collapsed' : 'start-sidebar'}
      aria-hidden={isDrawerHidden}
      aria-label="시작 노드"
      inert={isDrawerHidden}
    >
      <header className="sidebar-header">
        <button type="button" className="sidebar-title sidebar-home-button" onClick={onOpenHome} aria-label="RAMO 홈으로 이동">
          <h2>RAMO</h2>
        </button>
        <button
          ref={toggleButtonRef}
          type="button"
          className="sidebar-toggle-button"
          aria-label={toggleLabel}
          aria-expanded={isContentVisible}
          onBlur={hideToggleTooltip}
          onClick={onToggleCollapse}
          onFocus={showToggleTooltip}
          onMouseEnter={showToggleTooltip}
          onMouseLeave={hideToggleTooltip}
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
                aria-haspopup="menu"
                onClick={() => handleSelectRoot(node.id)}
                onContextMenu={(event) => openContextMenu(event, node.id)}
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

      {contextNode && typeof document !== 'undefined' ? createPortal(
        <div
          ref={contextMenuRef}
          className="sidebar-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
        >
          <strong>{contextNode.title}</strong>
          <button
            type="button"
            role="menuitem"
            className="danger-menu-item"
            onClick={handleMoveSessionToTrash}
          >
            세션 삭제
          </button>
        </div>,
        document.body,
      ) : null}
      {toggleTooltip && typeof document !== 'undefined' ? createPortal(
        <div
          className="sidebar-toggle-tooltip"
          style={{ left: toggleTooltip.left, top: toggleTooltip.top }}
          role="tooltip"
        >
          {toggleTooltip.label}
        </div>,
        document.body,
      ) : null}
    </aside>
  )
}
