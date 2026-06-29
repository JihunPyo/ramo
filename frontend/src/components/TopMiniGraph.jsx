import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildGraphLayout,
  getNodesByRootId,
} from '../features/branchGraph/branchGraphModel.js'
import { MiniGraph } from './MiniGraph.jsx'

const MINI_GRAPH_WIDTH_LIMIT = 360
const MINI_GRAPH_NODE_LIMIT = 8
const DEFAULT_PANEL_SIZE = { width: 278, height: 300 }
const MIN_PANEL_WIDTH = 260
const MIN_PANEL_HEIGHT = 260
const RESIZE_STEP = 12

export function TopMiniGraph({
  graphState,
  activeNode,
  onSelectNode,
  onSetMainTarget,
  onMoveToTrash,
  onOpenFullscreen,
  onClose,
}) {
  const panelRef = useRef(null)
  const interactionRef = useRef(null)
  const [panelSize, setPanelSize] = useState(() => ({ ...DEFAULT_PANEL_SIZE }))
  const [panelPosition, setPanelPosition] = useState(null)
  const rootId = activeNode?.rootId ?? graphState.selectedRootNodeId
  const rootNodes = getNodesByRootId(graphState.nodes, rootId)
  const layout = useMemo(() => buildGraphLayout(graphState.nodes, rootId, 'mini'), [
    graphState.nodes,
    rootId,
  ])
  const shouldShowFullscreenAction =
    rootNodes.length >= MINI_GRAPH_NODE_LIMIT || layout.width > MINI_GRAPH_WIDTH_LIMIT

  const getPanelMetrics = () => {
    const panel = panelRef.current
    const container = panel?.offsetParent

    if (!panel || !container) {
      return null
    }

    const panelRect = panel.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    return {
      container,
      x: panelRect.left - containerRect.left,
      y: panelRect.top - containerRect.top,
      width: panel.offsetWidth,
      height: panel.offsetHeight,
    }
  }

  useEffect(() => {
    const handlePointerMove = (event) => {
      const interaction = interactionRef.current
      const panel = panelRef.current

      if (!interaction || interaction.pointerId !== event.pointerId || !panel) {
        return
      }

      event.preventDefault()

      if (interaction.type === 'drag') {
        const maxX = Math.max(0, interaction.container.clientWidth - panel.offsetWidth)
        const maxY = Math.max(0, interaction.container.clientHeight - panel.offsetHeight)

        setPanelPosition({
          x: Math.round(
            Math.min(maxX, Math.max(0, interaction.x + event.clientX - interaction.startX)),
          ),
          y: Math.round(
            Math.min(maxY, Math.max(0, interaction.y + event.clientY - interaction.startY)),
          ),
        })
        return
      }

      const nextWidth = Math.round(
        Math.min(
          interaction.rightEdge,
          Math.max(MIN_PANEL_WIDTH, interaction.width - (event.clientX - interaction.startX)),
        ),
      )
      const maxHeight = Math.max(
        MIN_PANEL_HEIGHT,
        interaction.container.clientHeight - interaction.y,
      )
      const nextHeight = Math.round(
        Math.min(
          maxHeight,
          Math.max(MIN_PANEL_HEIGHT, interaction.height + event.clientY - interaction.startY),
        ),
      )

      setPanelPosition({ x: Math.round(interaction.rightEdge - nextWidth), y: interaction.y })
      setPanelSize({ width: nextWidth, height: nextHeight })
    }

    const handlePointerEnd = (event) => {
      if (interactionRef.current?.pointerId === event.pointerId) {
        interactionRef.current = null
        document.body.classList.remove('graph-panel-interacting')
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
      document.body.classList.remove('graph-panel-interacting')
    }
  }, [])

  const handleDragStart = (event) => {
    if (event.button !== 0 || event.target.closest('button')) {
      return
    }

    const metrics = getPanelMetrics()

    if (!metrics) {
      return
    }

    event.preventDefault()
    setPanelPosition({ x: metrics.x, y: metrics.y })
    interactionRef.current = {
      type: 'drag',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: metrics.x,
      y: metrics.y,
      container: metrics.container,
    }
    document.body.classList.add('graph-panel-interacting')
  }

  const handleResizeStart = (event) => {
    if (event.button !== 0) {
      return
    }

    const metrics = getPanelMetrics()

    if (!metrics) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setPanelPosition({ x: metrics.x, y: metrics.y })
    interactionRef.current = {
      type: 'resize',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: metrics.width,
      height: metrics.height,
      rightEdge: metrics.x + metrics.width,
      y: metrics.y,
      container: metrics.container,
    }
    document.body.classList.add('graph-panel-interacting')
  }

  const handleResizeKeyDown = (event) => {
    const metrics = getPanelMetrics()

    if (!metrics) {
      return
    }

    const step = event.shiftKey ? RESIZE_STEP * 2 : RESIZE_STEP
    const sizeByKey = {
      ArrowLeft: [metrics.width + step, metrics.height],
      ArrowRight: [metrics.width - step, metrics.height],
      ArrowUp: [metrics.width, metrics.height - step],
      ArrowDown: [metrics.width, metrics.height + step],
    }[event.key]

    if (!sizeByKey) {
      return
    }

    event.preventDefault()
    const rightEdge = metrics.x + metrics.width
    const nextWidth = Math.min(rightEdge, Math.max(MIN_PANEL_WIDTH, sizeByKey[0]))
    const maxHeight = Math.max(MIN_PANEL_HEIGHT, metrics.container.clientHeight - metrics.y)
    const nextHeight = Math.min(maxHeight, Math.max(MIN_PANEL_HEIGHT, sizeByKey[1]))

    setPanelPosition({ x: rightEdge - nextWidth, y: metrics.y })
    setPanelSize({ width: nextWidth, height: nextHeight })
  }

  return (
    <aside
      ref={panelRef}
      className="top-graph-panel"
      aria-label="현재 흐름 미니 그래프"
      style={{
        width: `${panelSize.width}px`,
        height: `${panelSize.height}px`,
        ...(panelPosition
          ? { left: `${panelPosition.x}px`, top: `${panelPosition.y}px`, right: 'auto' }
          : {}),
      }}
    >
      <header className="top-graph-header" onPointerDown={handleDragStart}>
        <div className="top-graph-heading">
          <p className="eyebrow">흐름</p>
          <strong>{activeNode?.title}</strong>
        </div>
        <div className="top-graph-actions">
          {shouldShowFullscreenAction ? (
            <button type="button" className="secondary-action" onClick={onOpenFullscreen}>
              전체화면
            </button>
          ) : null}
          <button
            type="button"
            className="graph-close-button"
            aria-label="시각화 창 닫기"
            aria-expanded="true"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </header>

      <MiniGraph
        graphState={graphState}
        rootId={rootId}
        onSelectNode={onSelectNode}
        onSetMainTarget={onSetMainTarget}
        onMoveToTrash={onMoveToTrash}
      />

      <button
        type="button"
        className="graph-resize-handle"
        aria-label="시각화 창 크기 조절"
        title="드래그하여 시각화 창 크기 조절"
        onPointerDown={handleResizeStart}
        onKeyDown={handleResizeKeyDown}
      >
        <span aria-hidden="true">⌞</span>
      </button>
    </aside>
  )
}
