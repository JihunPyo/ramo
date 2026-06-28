import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildGraphLayout,
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
  onMoveToTrash,
}) {
  const viewportRef = useRef(null)
  const graphRef = useRef(null)
  const zoomRef = useRef(1)
  const pointersRef = useRef(new Map())
  const gestureRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const suppressClickRef = useRef(false)
  const [zoom, setZoom] = useState(1)
  const [activeTooltipNodeId, setActiveTooltipNodeId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const layout = useMemo(
    () => buildGraphLayout(graphState.nodes, rootId, size),
    [graphState.nodes, rootId, size],
  )
  const mainPathNodeIds = useMemo(
    () => getMainPathNodeIds(graphState, rootId),
    [graphState, rootId],
  )
  const activeTooltipNode = layout.nodes.find((node) => node.id === activeTooltipNodeId)
  const contextNode = layout.nodes.find((node) => node.id === contextMenu?.nodeId)

  const updateZoom = (nextZoom, clientX, clientY) => {
    const viewport = viewportRef.current
    const previousZoom = zoomRef.current
    const resolvedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))

    if (!viewport || resolvedZoom === previousZoom) {
      return
    }

    const rect = viewport.getBoundingClientRect()
    const anchorX = clientX === undefined ? rect.left + rect.width / 2 : clientX
    const anchorY = clientY === undefined ? rect.top + rect.height / 2 : clientY
    const contentX = (viewport.scrollLeft + anchorX - rect.left) / previousZoom
    const contentY = (viewport.scrollTop + anchorY - rect.top) / previousZoom

    zoomRef.current = resolvedZoom
    setZoom(resolvedZoom)

    window.requestAnimationFrame(() => {
      viewport.scrollLeft = contentX * resolvedZoom - (anchorX - rect.left)
      viewport.scrollTop = contentY * resolvedZoom - (anchorY - rect.top)
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
    window.requestAnimationFrame(() => {
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

  useEffect(() => () => window.clearTimeout(longPressTimerRef.current), [])

  const openContextMenu = (node, clientX, clientY) => {
    const graphRect = graphRef.current?.getBoundingClientRect()

    if (!graphRect) {
      return
    }

    setContextMenu({
      nodeId: node.id,
      x: Math.min(clientX - graphRect.left, graphRect.width - 176),
      y: Math.min(clientY - graphRect.top, graphRect.height - 122),
    })
    setActiveTooltipNodeId(null)
  }

  const handlePointerDown = (event) => {
    const viewport = viewportRef.current

    if (!viewport || event.button > 0) {
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

            return (
              <path
                key={`${edge.from.id}-${edge.to.id}`}
                d={`M ${edge.from.x} ${edge.from.y + 15} C ${edge.from.x} ${
                  edge.from.y + 52
                }, ${edge.to.x} ${edge.to.y - 52}, ${edge.to.x} ${edge.to.y - 15}`}
                className={isMainEdge ? 'graph-edge main' : 'graph-edge'}
              />
            )
          })}

          {layout.nodes.map((layoutNode) => {
            const isActive = layoutNode.id === graphState.activeNodeId
            const isMain = mainPathNodeIds.has(layoutNode.id)
            const nodeClass = [
              'graph-node',
              isActive ? 'active' : '',
              isMain ? 'main' : '',
              layoutNode.isActive ? '' : 'inactive',
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
                onMouseEnter={() => !contextMenu && setActiveTooltipNodeId(layoutNode.id)}
                onMouseLeave={() => setActiveTooltipNodeId(null)}
                onFocus={() => setActiveTooltipNodeId(layoutNode.id)}
                onBlur={() => setActiveTooltipNodeId(null)}
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

      {activeTooltipNode && !contextMenu ? (
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
