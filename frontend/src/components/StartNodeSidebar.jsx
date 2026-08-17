import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getSubtreeNodeIds } from '../features/branchGraph/branchGraphModel.js'
import malangiAvatarUrl from '../assets/malangi-avatar.jpg'
import { AiUsageReport } from './AiUsageReport.jsx'
import { RamoLogo } from './RamoLogo.jsx'

const DEFAULT_SIDEBAR_USER_PROFILE = {
  avatarUrl: malangiAvatarUrl,
  name: '말랑이',
}

export function StartNodeSidebar({
  graphState,
  rootNodes,
  userProfile = DEFAULT_SIDEBAR_USER_PROFILE,
  isCollapsed = false,
  isDrawerMode = false,
  isMobileDrawerOpen = false,
  isLandingActive = false,
  isBusy = false,
  onToggleCollapse,
  onOpenHome,
  onNewChat,
  onSelectRoot,
  onRenameSession,
  onMoveSessionToTrash,
  onRestoreFromTrash,
  onDeleteForever,
}) {
  const [contextMenu, setContextMenu] = useState(null)
  const [renameValue, setRenameValue] = useState(null)
  const [renameError, setRenameError] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [toggleTooltip, setToggleTooltip] = useState(null)
  const contextMenuRef = useRef(null)
  const trashMenuRef = useRef(null)
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
    if (!isReportOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsReportOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isReportOpen])

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
    if (!isTrashOpen) {
      return undefined
    }

    const closeTrashMenu = () => {
      setIsTrashOpen(false)
    }

    const handlePointerDown = (event) => {
      if (!trashMenuRef.current?.contains(event.target)) {
        closeTrashMenu()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeTrashMenu()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isTrashOpen])

  useEffect(() => {
    if (!toggleTooltip) {
      return undefined
    }

    const updateToggleTooltip = () => {
      setToggleTooltip(getToggleTooltipPosition())
    }
    const closeToggleTooltip = () => {
      setToggleTooltip(null)
    }
    const closeToggleTooltipWhenOutside = (event) => {
      const buttonRect = toggleButtonRef.current?.getBoundingClientRect()

      if (!buttonRect) {
        closeToggleTooltip()
        return
      }

      const isInsideButton =
        event.clientX >= buttonRect.left &&
        event.clientX <= buttonRect.right &&
        event.clientY >= buttonRect.top &&
        event.clientY <= buttonRect.bottom

      if (!isInsideButton) {
        closeToggleTooltip()
      }
    }
    const timerId = window.setTimeout(updateToggleTooltip, 0)

    window.addEventListener('resize', updateToggleTooltip)
    window.addEventListener('scroll', closeToggleTooltip, true)
    window.addEventListener('blur', closeToggleTooltip)
    document.addEventListener('pointermove', closeToggleTooltipWhenOutside)
    document.addEventListener('pointerdown', closeToggleTooltip)

    return () => {
      window.clearTimeout(timerId)
      window.removeEventListener('resize', updateToggleTooltip)
      window.removeEventListener('scroll', closeToggleTooltip, true)
      window.removeEventListener('blur', closeToggleTooltip)
      document.removeEventListener('pointermove', closeToggleTooltipWhenOutside)
      document.removeEventListener('pointerdown', closeToggleTooltip)
    }
  }, [getToggleTooltipPosition, toggleTooltip])

  const showToggleTooltip = () => {
    setToggleTooltip(getToggleTooltipPosition())
  }

  const hideToggleTooltip = () => {
    setToggleTooltip(null)
  }

  const showToggleTooltipOnFocus = (event) => {
    if (event.currentTarget.matches(':focus-visible')) {
      showToggleTooltip()
    }
  }

  const handleToggleCollapse = () => {
    hideToggleTooltip()
    toggleButtonRef.current?.blur()
    onToggleCollapse()
  }

  const openContextMenu = (event, nodeId) => {
    event.preventDefault()

    if (isBusy) {
      return
    }

    const menuWidth = 176
    const menuHeight = 126

    setContextMenu({
      nodeId,
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8)),
    })
    setRenameValue(null)
    setRenameError('')
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

  const handleRenameSession = async (event) => {
    event.preventDefault()
    const normalizedTitle = renameValue.trim()

    if (!normalizedTitle) {
      setRenameError('세션 이름을 입력해 주세요.')
      return
    }

    if (normalizedTitle === contextNode.title) {
      setContextMenu(null)
      return
    }

    setIsRenaming(true)
    setRenameError('')

    try {
      const wasRenamed = await onRenameSession?.(contextNode.id, normalizedTitle)

      if (!wasRenamed) {
        setRenameError('세션 이름을 수정하지 못했습니다.')
        return
      }

      setContextMenu(null)
      setRenameValue(null)
    } catch (error) {
      setRenameError(error?.message ?? '세션 이름을 수정하지 못했습니다.')
    } finally {
      setIsRenaming(false)
    }
  }

  const getTrashItemMeta = (node) => {
    const subtreeCount = getSubtreeNodeIds(trashNodes, node.id).length
    const isSession = node.trashType === 'session' || node.parentId === null
    const childBranchCount = Math.max(0, subtreeCount - 1)

    if (isSession) {
      return {
        typeClassName: 'session',
        typeLabel: '세션',
        detail: childBranchCount > 0
          ? `하위 브랜치 ${childBranchCount}개 포함`
          : '세션 단독 항목',
      }
    }

    return {
      typeClassName: 'branch',
      typeLabel: '브랜치',
      detail: subtreeCount > 1
        ? `하위 브랜치 ${subtreeCount - 1}개 포함`
        : '브랜치 단독 항목',
    }
  }

  const renderTrashCard = (node) => {
    const itemMeta = getTrashItemMeta(node)

    return (
      <article key={node.id} className={`trash-card ${itemMeta.typeClassName}`}>
        <div>
          <span className={`trash-type-badge ${itemMeta.typeClassName}`}>{itemMeta.typeLabel}</span>
          <strong>{node.title}</strong>
          <small>{itemMeta.detail}</small>
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
          <h2><RamoLogo compact /></h2>
        </button>
        <button
          ref={toggleButtonRef}
          type="button"
          className="sidebar-toggle-button"
          aria-label={toggleLabel}
          aria-expanded={isContentVisible}
          onBlur={hideToggleTooltip}
          onClick={handleToggleCollapse}
          onPointerDown={hideToggleTooltip}
          onFocus={showToggleTooltipOnFocus}
          onMouseEnter={showToggleTooltip}
          onMouseLeave={hideToggleTooltip}
        >
          <span className="sidebar-toggle-icon" aria-hidden="true" />
        </button>
      </header>

      <div className="sidebar-content">
        <button
          type="button"
          className={isLandingActive ? 'new-chat-button selected' : 'new-chat-button'}
          aria-current={isLandingActive ? 'page' : undefined}
          onClick={onNewChat}
          disabled={isBusy}
        >
          <span className="new-chat-icon" aria-hidden="true" />
          새 채팅
        </button>

        <div className="sidebar-trash" ref={trashMenuRef}>
          <button
            type="button"
            className="sidebar-trash-button"
            aria-label={`휴지통 ${trashNodes.length}개`}
            aria-expanded={isTrashOpen}
            aria-haspopup="menu"
            onClick={() => setIsTrashOpen((current) => !current)}
          >
            <span className="sidebar-trash-icon" aria-hidden="true" />
            <span className="sidebar-trash-label">휴지통</span>
          </button>
          {isTrashOpen ? (
            <section className="trash-popover" aria-label="휴지통">
              {trashRoots.length > 0 ? (
                <div className="trash-list">
                  {trashRoots.map(renderTrashCard)}
                </div>
              ) : (
                <p className="trash-empty">삭제한 항목이 없습니다.</p>
              )}
            </section>
          ) : null}
        </div>

        <div className="sidebar-scroll-area" aria-hidden={!isContentVisible}>
          <nav className="root-list" aria-label="루트 노드 목록">
            {rootNodes.map((node) => {
              const isSelected = !isLandingActive && node.id === graphState.selectedRootNodeId

              return (
                <button
                  key={node.id}
                  type="button"
                  className={isSelected ? 'root-card selected' : 'root-card'}
                  aria-current={isSelected ? 'page' : undefined}
                  aria-haspopup="menu"
                  onClick={() => handleSelectRoot(node.id)}
                  onContextMenu={(event) => openContextMenu(event, node.id)}
                  disabled={isBusy}
                >
                  <span>{node.title}</span>
                </button>
              )
            })}
          </nav>

          <details className="trash-panel">
            <summary>
              <span>휴지통</span>
              <strong>{trashNodes.length}</strong>
            </summary>
            {trashRoots.length > 0 ? (
              <div className="trash-list">
                {trashRoots.map(renderTrashCard)}
              </div>
            ) : (
              <p className="trash-empty">삭제한 항목이 없습니다.</p>
            )}
          </details>
        </div>

        <button
          type="button"
          className="sidebar-report-button"
          onClick={() => setIsReportOpen(true)}
        >
          <svg className="sidebar-report-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 4v10" />
            <path d="m8 10 4 4 4-4" />
            <path d="M5 19h14" />
          </svg>
          <span>AI 활용 리포트</span>
        </button>

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
          {renameValue === null ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setRenameValue(contextNode.title)
                setRenameError('')
              }}
            >
              세션 이름 수정
            </button>
          ) : (
            <form className="sidebar-session-rename-form" onSubmit={handleRenameSession}>
              <label htmlFor={`session-name-${contextNode.id}`}>세션 이름</label>
              <input
                id={`session-name-${contextNode.id}`}
                value={renameValue}
                maxLength={60}
                autoFocus
                disabled={isRenaming}
                onChange={(event) => {
                  setRenameValue(event.target.value)
                  setRenameError('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    event.stopPropagation()
                    setRenameValue(null)
                    setRenameError('')
                  }
                }}
              />
              {renameError ? <small role="alert">{renameError}</small> : null}
              <div className="sidebar-session-rename-actions">
                <button type="submit" disabled={isRenaming}>
                  {isRenaming ? '저장 중' : '저장'}
                </button>
                <button
                  type="button"
                  disabled={isRenaming}
                  onClick={() => {
                    setRenameValue(null)
                    setRenameError('')
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          )}
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
      {isReportOpen && typeof document !== 'undefined' ? createPortal(
        <div
          className="report-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsReportOpen(false)
            }
          }}
        >
          <section className="report-modal" role="dialog" aria-modal="true" aria-label="AI 활용 리포트">
            <button type="button" className="report-modal-close" aria-label="AI 활용 리포트 닫기" onClick={() => setIsReportOpen(false)}>
              <span aria-hidden="true">×</span>
            </button>
            <AiUsageReport />
          </section>
        </div>,
        document.body,
      ) : null}
    </aside>
  )
}
