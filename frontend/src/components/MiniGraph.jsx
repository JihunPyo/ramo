import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildGraphLayout,
  getBranchPath,
  getMainPathNodeIds,
} from '../features/branchGraph/branchGraphModel.js'

const MIN_ZOOM = 0.45
const MAX_ZOOM = 2.5

export function MiniGraph({
  graphState,
  rootId,
  size = 'mini',
  onSelectNode,
  onSetMainTarget,
  onRenameNode,
  onMoveToTrash,
  autoFitOnResize = false,
  allowLayoutToggle = false,
  layoutDirection = 'vertical',
  onToggleLayout,
  highlightPathOnHover = false,
  tooltipHideDelay = 0,
  renderTooltip = true,
  onTooltipNodeChange,
}) {
  const viewportRef = useRef(null)
  const graphRef = useRef(null)
  const zoomRef = useRef(1)
  const pointersRef = useRef(new Map())
  const gestureRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const tooltipHideTimerRef = useRef(null)
  const suppressClickRef = useRef(false)
  const viewAdjustmentFrameRef = useRef(0)
  const [zoom, setZoom] = useState(1)
  const [activeTooltipNodeId, setActiveTooltipNodeId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [renameValue, setRenameValue] = useState(null)
  const [renameError, setRenameError] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const layout = useMemo(
    () => buildGraphLayout(graphState.nodes, rootId, size, layoutDirection),
    [graphState.nodes, layoutDirection, rootId, size],
  )
  const mainPathNodeIds = useMemo(
    () => getMainPathNodeIds(graphState, rootId),
    [graphState, rootId],
  )
  const hoveredPathNodeIds = useMemo(() => {
    if (!highlightPathOnHover || !activeTooltipNodeId) {
      return null
    }

    return new Set(
      getBranchPath(graphState.nodes, activeTooltipNodeId).map((pathNode) => pathNode.id),
    )
  }, [activeTooltipNodeId, graphState.nodes, highlightPathOnHover])
  const activeTooltipNode = layout.nodes.find((node) => node.id === activeTooltipNodeId)
  const contextNode = layout.nodes.find((node) => node.id === contextMenu?.nodeId)

  const showTooltipNode = (nodeId) => {
    window.clearTimeout(tooltipHideTimerRef.current)
    setActiveTooltipNodeId(nodeId)
  }

  const hideTooltipNode = () => {
    window.clearTimeout(tooltipHideTimerRef.current)

    if (tooltipHideDelay <= 0) {
      setActiveTooltipNodeId(null)
      return
    }

    tooltipHideTimerRef.current = window.setTimeout(() => {
      setActiveTooltipNodeId(null)
    }, tooltipHideDelay)
  }

  useEffect(() => {
    onTooltipNodeChange?.(activeTooltipNode ?? null)
  }, [activeTooltipNode, onTooltipNodeChange])

  const updateZoom = (nextZoom, clientX, clientY) => {
    const viewport = viewportRef.current
    const svg = graphRef.current?.querySelector('svg')
    const previousZoom = zoomRef.current
    const resolvedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))

    if (!viewport || !svg || resolvedZoom === previousZoom) {
      return
    }

    const rect = viewport.getBoundingClientRect()
    const svgRect = svg.getBoundingClientRect()
    const renderedZoom = svgRect.width / layout.width
    const anchorX = clientX === undefined ? rect.left + rect.width / 2 : clientX
    const anchorY = clientY === undefined ? rect.top + rect.height / 2 : clientY
    const contentX = (anchorX - svgRect.left) / renderedZoom
    const contentY = (anchorY - svgRect.top) / renderedZoom

    zoomRef.current = resolvedZoom
    setZoom(resolvedZoom)

    window.cancelAnimationFrame(viewAdjustmentFrameRef.current)
    viewAdjustmentFrameRef.current = window.requestAnimationFrame(() => {
      const nextSvgRect = svg.getBoundingClientRect()
      const nextAnchorX = nextSvgRect.left + contentX * resolvedZoom
      const nextAnchorY = nextSvgRect.top + contentY * resolvedZoom

      viewport.scrollLeft += nextAnchorX - anchorX
      viewport.scrollTop += nextAnchorY - anchorY
    })
  }

  const fitGraph = useCallback(() => {
    const viewport = viewportRef.current

    if (!viewport || layout.nodes.length === 0) {
      return
    }

    const horizontalPadding = 28
    const verticalPadding = 28
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(
        MIN_ZOOM,
        Math.min(
          (viewport.clientWidth - horizontalPadding) / layout.width,
          (viewport.clientHeight - verticalPadding) / layout.height,
        ),
      ),
    )

    zoomRef.current = nextZoom
    setZoom(nextZoom)
    window.cancelAnimationFrame(viewAdjustmentFrameRef.current)
    viewAdjustmentFrameRef.current = window.requestAnimationFrame(() => {
      viewport.scrollLeft = Math.max(0, (layout.width * nextZoom - viewport.clientWidth) / 2)
      viewport.scrollTop = Math.max(0, (layout.height * nextZoom - viewport.clientHeight) / 2)
    })
  }, [layout.height, layout.nodes.length, layout.width])

  const focusCurrentNode = () => {
    const viewport = viewportRef.current
    const activeNode = layout.nodes.find((node) => node.id === graphState.activeNodeId)

    if (!viewport || !activeNode) {
      return
    }

    viewport.scrollTo({
      left: Math.max(0, activeNode.x * zoomRef.current - viewport.clientWidth / 2),
      top: Math.max(0, activeNode.y * zoomRef.current - viewport.clientHeight / 2),
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    fitGraph()
  }, [fitGraph, rootId])

  useEffect(() => {
    const viewport = viewportRef.current
    const resizeTarget = graphRef.current?.closest('.top-graph-panel')

    if (!autoFitOnResize || !viewport || !resizeTarget || typeof ResizeObserver === 'undefined') {
      return undefined
    }

    let animationFrameId = 0
    const resizeObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(animationFrameId)
      animationFrameId = window.requestAnimationFrame(fitGraph)
    })

    resizeObserver.observe(resizeTarget)

    return () => {
      resizeObserver.disconnect()
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [autoFitOnResize, fitGraph])

  useEffect(
    () => () => {
      window.clearTimeout(longPressTimerRef.current)
      window.clearTimeout(tooltipHideTimerRef.current)
      window.cancelAnimationFrame(viewAdjustmentFrameRef.current)
    },
    [],
  )

  const openContextMenu = (node, clientX, clientY) => {
    const graphRect = graphRef.current?.getBoundingClientRect()

    if (!graphRect) {
      return
    }

    setContextMenu({
      nodeId: node.id,
      x: Math.max(8, Math.min(clientX - graphRect.left, graphRect.width - 184)),
      y: Math.max(8, Math.min(clientY - graphRect.top, graphRect.height - 176)),
    })
    setRenameValue(null)
    setRenameError('')
    setActiveTooltipNodeId(null)
  }

  const handleRenameSubmit = async (event) => {
    event.preventDefault()
    const normalizedTitle = renameValue.trim()

    if (!normalizedTitle) {
      setRenameError('노드 이름을 입력해 주세요.')
      return
    }

    if (normalizedTitle === contextNode.title) {
      setContextMenu(null)
      return
    }

    setIsRenaming(true)
    setRenameError('')

    try {
      await onRenameNode(contextNode.id, normalizedTitle)
      setContextMenu(null)
      setRenameValue(null)
    } catch (error) {
      setRenameError(error?.message ?? '노드 이름을 수정하지 못했습니다.')
    } finally {
      setIsRenaming(false)
    }
  }

  const handlePointerDown = (event) => {
    const viewport = viewportRef.current

    if (!viewport || event.button > 0) {
      return
    }

    // 노드를 누르는 동작과 그래프를 끌어 이동하는 동작을 분리한다.
    // 포인터 캡처가 노드 클릭을 가로채지 않아 실제 마우스/터치에서도
    // 선택 콜백이 안정적으로 실행된다.
    if (event.target.closest?.('.graph-node')) {
      suppressClickRef.current = false
      setContextMenu(null)
      return
    }

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    viewport.setPointerCapture(event.pointerId)
    suppressClickRef.current = false
    setContextMenu(null)

    if (pointersRef.current.size === 1) {
      gestureRef.current = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
      }
    } else if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values())
      gestureRef.current = {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
      }
    }
  }

  const handlePointerMove = (event) => {
    const viewport = viewportRef.current

    if (!viewport || !pointersRef.current.has(event.pointerId)) {
      return
    }

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values())
      const distance = Math.hypot(second.x - first.x, second.y - first.y)
      const previousDistance = gestureRef.current?.distance

      if (previousDistance) {
        updateZoom(
          zoomRef.current * (distance / previousDistance),
          (first.x + second.x) / 2,
          (first.y + second.y) / 2,
        )
      }

      gestureRef.current = { distance }
      suppressClickRef.current = true
      window.clearTimeout(longPressTimerRef.current)
      return
    }

    const gesture = gestureRef.current

    if (!gesture || gesture.scrollLeft === undefined) {
      return
    }

    const deltaX = event.clientX - gesture.x
    const deltaY = event.clientY - gesture.y

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      suppressClickRef.current = true
      window.clearTimeout(longPressTimerRef.current)
    }

    viewport.scrollLeft = gesture.scrollLeft - deltaX
    viewport.scrollTop = gesture.scrollTop - deltaY
  }

  const handlePointerEnd = (event) => {
    pointersRef.current.delete(event.pointerId)
    window.clearTimeout(longPressTimerRef.current)

    if (pointersRef.current.size === 0) {
      gestureRef.current = null
    }
  }

  return (
    <div ref={graphRef} className={`mini-graph ${size}`}>
      <div className="graph-toolbar" aria-label="그래프 보기 도구">
        <button type="button" onClick={() => updateZoom(zoomRef.current - 0.15)} aria-label="축소">
          −
        </button>
        <output aria-label="확대 비율">{Math.round(zoom * 100)}%</output>
        <button type="button" onClick={() => updateZoom(zoomRef.current + 0.15)} aria-label="확대">
          +
        </button>
        <button type="button" onClick={fitGraph}>화면 맞춤</button>
        <button type="button" onClick={focusCurrentNode}>현재 노드</button>
        {allowLayoutToggle ? (
          <button
            type="button"
            aria-label={`맵 변경: 현재 ${layoutDirection === 'vertical' ? '세로' : '가로'} 방향`}
            title={`${layoutDirection === 'vertical' ? '가로' : '세로'} 방향으로 변경`}
            onClick={() => {
              setActiveTooltipNodeId(null)
              setContextMenu(null)
              onToggleLayout?.()
            }}
          >
            맵 변경
          </button>
        ) : null}
      </div>

      <div
        ref={viewportRef}
        className="graph-viewport"
        onWheel={(event) => {
          event.preventDefault()
          updateZoom(zoomRef.current * (event.deltaY < 0 ? 1.12 : 0.89), event.clientX, event.clientY)
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={() => setContextMenu(null)}
      >
        <div className="graph-canvas">
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            width={layout.width * zoom}
            height={layout.height * zoom}
            role="img"
            aria-label="노드 관계 그래프"
            preserveAspectRatio="xMidYMid meet"
          >
          {layout.edges.map((edge) => {
            const isMainEdge = mainPathNodeIds.has(edge.from.id) && mainPathNodeIds.has(edge.to.id)
            const isHoveredPathEdge =
              hoveredPathNodeIds?.has(edge.from.id) && hoveredPathNodeIds.has(edge.to.id)
            const edgeClass = [
              'graph-edge',
              isMainEdge ? 'main' : '',
              isHoveredPathEdge ? 'hover-path' : '',
              hoveredPathNodeIds && !isHoveredPathEdge ? 'path-muted' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <path
                key={`${edge.from.id}-${edge.to.id}`}
                d={
                  layoutDirection === 'horizontal'
                    ? `M ${edge.from.x + 15} ${edge.from.y} C ${edge.from.x + 52} ${
                        edge.from.y
                      }, ${edge.to.x - 52} ${edge.to.y}, ${edge.to.x - 15} ${edge.to.y}`
                    : `M ${edge.from.x} ${edge.from.y + 15} C ${edge.from.x} ${
                        edge.from.y + 52
                      }, ${edge.to.x} ${edge.to.y - 52}, ${edge.to.x} ${edge.to.y - 15}`
                }
                className={edgeClass}
              />
            )
          })}

          {layout.nodes.map((layoutNode) => {
            const isActive = layoutNode.id === graphState.activeNodeId
            const isMain = mainPathNodeIds.has(layoutNode.id)
            const isHoveredPathNode = hoveredPathNodeIds?.has(layoutNode.id)
            const nodeClass = [
              'graph-node',
              isActive ? 'active' : '',
              isMain ? 'main' : '',
              layoutNode.isActive ? '' : 'inactive',
              isHoveredPathNode ? 'hover-path' : '',
              hoveredPathNodeIds && !isHoveredPathNode ? 'path-muted' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <g
                key={layoutNode.id}
                className={nodeClass}
                tabIndex="0"
                role="button"
                aria-label={`${layoutNode.title} 노드로 이동`}
                onMouseEnter={() => !contextMenu && showTooltipNode(layoutNode.id)}
                onMouseLeave={hideTooltipNode}
                onFocus={() => showTooltipNode(layoutNode.id)}
                onBlur={hideTooltipNode}
                onContextMenu={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  openContextMenu(layoutNode, event.clientX, event.clientY)
                }}
                onPointerDown={(event) => {
                  if (event.pointerType === 'touch') {
                    window.clearTimeout(longPressTimerRef.current)
                    longPressTimerRef.current = window.setTimeout(() => {
                      openContextMenu(layoutNode, event.clientX, event.clientY)
                      suppressClickRef.current = true
                    }, 550)
                  }
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false
                    return
                  }
                  onSelectNode(layoutNode.id)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                    event.preventDefault()
                    const rect = event.currentTarget.getBoundingClientRect()
                    openContextMenu(layoutNode, rect.left + rect.width / 2, rect.top + rect.height / 2)
                    return
                  }

                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectNode(layoutNode.id)
                  }
                }}
              >
                <circle cx={layoutNode.x} cy={layoutNode.y} r={size === 'full' ? 18 : 12} />
                <text x={layoutNode.x} y={layoutNode.y + (size === 'full' ? 34 : 28)}>
                  {layoutNode.shortTitle}
                </text>
              </g>
            )
          })}
          </svg>
        </div>
      </div>

      {renderTooltip && activeTooltipNode && !contextMenu ? (
        <div className="graph-tooltip" role="status">
          <strong>{activeTooltipNode.title}</strong>
          <p>{activeTooltipNode.description}</p>
        </div>
      ) : null}

      {contextNode ? (
        <div
          className="graph-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          onClick={(event) => event.stopPropagation()}
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
              노드 이름 수정
            </button>
          ) : (
            <form className="graph-node-rename-form" onSubmit={handleRenameSubmit}>
              <label htmlFor={`node-name-${contextNode.id}`}>노드 이름</label>
              <input
                id={`node-name-${contextNode.id}`}
                value={renameValue}
                maxLength={100}
                autoFocus
                disabled={isRenaming}
                onChange={(event) => {
                  setRenameValue(event.target.value)
                  setRenameError('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    setRenameValue(null)
                    setRenameError('')
                  }
                }}
              />
              {renameError ? <small role="alert">{renameError}</small> : null}
              <div className="graph-node-rename-actions">
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
          <button type="button" role="menuitem" onClick={() => onSetMainTarget(contextNode.id)}>
            main 지정
          </button>
          {contextNode.parentId !== null && onMoveToTrash ? (
            <button
              type="button"
              role="menuitem"
              className="danger-menu-item"
              onClick={() => {
                setContextMenu(null)
                onMoveToTrash(contextNode.id)
              }}
            >
              휴지통으로 이동
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
