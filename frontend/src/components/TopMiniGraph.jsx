import { useCallback, useEffect, useRef, useState } from 'react'
import { MiniGraph } from './MiniGraph.jsx'

const DEFAULT_PANEL_SIZE = { width: 278, height: 300 }
const MIN_PANEL_WIDTH = 260
const MIN_PANEL_HEIGHT = 260
const RESIZE_STEP = 12
const TOOLTIP_HIDE_DELAY = 180

export function TopMiniGraph({
  graphState,
  activeNode,
  onSelectNode,
  onSetMainTarget,
  onRenameNode,
  onMoveToTrash,
  onOpenFullscreen,
  onClose,
  layoutDirection,
  onToggleLayout,
}) {
  const panelRef = useRef(null)
  const interactionRef = useRef(null)
  const tooltipHideTimerRef = useRef(null)
  const [panelSize, setPanelSize] = useState(() => ({ ...DEFAULT_PANEL_SIZE }))
  const [panelPosition, setPanelPosition] = useState(null)
  const [externalTooltipNode, setExternalTooltipNode] = useState(null)
  const rootId = activeNode?.rootId ?? graphState.selectedRootNodeId

  const handleTooltipNodeChange = useCallback((node) => {
    window.clearTimeout(tooltipHideTimerRef.current)

    if (node) {
      setExternalTooltipNode(node)
      return
    }

    tooltipHideTimerRef.current = window.setTimeout(() => {
      setExternalTooltipNode(null)
    }, TOOLTIP_HIDE_DELAY)
  }, [])

  const getPanelMetrics = () => {
    const panel = panelRef.current

    if (!panel) {
      return null
    }

    const panelRect = panel.getBoundingClientRect()

    return {
      x: panelRect.left,
      y: panelRect.top,
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
        const viewportRight = document.documentElement.getBoundingClientRect().right
        const maxX = Math.max(0, viewportRight - panel.offsetWidth)
        const maxY = Math.max(0, window.innerHeight - panel.offsetHeight)

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
        window.innerHeight - interaction.y,
      )
      const nextHeight = Math.round(
        Math.min(
          maxHeight,
          Math.max(MIN_PANEL_HEIGHT, interaction.height + event.clientY - interaction.startY),
        ),
      )

      setPanelPosition({ right: interaction.rightOffset, y: interaction.y })
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
      window.clearTimeout(tooltipHideTimerRef.current)
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
      rightOffset: Math.max(
        0,
        document.documentElement.getBoundingClientRect().right - metrics.x - metrics.width,
      ),
      y: metrics.y,
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
    const rightOffset = Math.max(
      0,
      document.documentElement.getBoundingClientRect().right - rightEdge,
    )
    const nextWidth = Math.min(rightEdge, Math.max(MIN_PANEL_WIDTH, sizeByKey[0]))
    const maxHeight = Math.max(MIN_PANEL_HEIGHT, window.innerHeight - metrics.y)
    const nextHeight = Math.min(maxHeight, Math.max(MIN_PANEL_HEIGHT, sizeByKey[1]))

    setPanelPosition({ right: rightOffset, y: metrics.y })
    setPanelSize({ width: nextWidth, height: nextHeight })
  }

  return (
    <aside
      ref={panelRef}
      className={`top-graph-panel ${panelPosition ? 'user-positioned' : ''}`}
      aria-label="현재 흐름 미니 그래프"
      style={{
        width: `${panelSize.width}px`,
        height: `${panelSize.height}px`,
        ...(panelPosition
          ? 'right' in panelPosition
            ? { right: `${panelPosition.right}px`, top: `${panelPosition.y}px`, left: 'auto' }
            : { left: `${panelPosition.x}px`, top: `${panelPosition.y}px`, right: 'auto' }
          : {}),
      }}
    >
      <header className="top-graph-header" onPointerDown={handleDragStart}>
        <div className="top-graph-heading">
          <p className="eyebrow">흐름</p>
          <strong>{activeNode?.title}</strong>
        </div>
        <div className="top-graph-actions">
          <button
            type="button"
            className="top-graph-fullscreen-button"
            aria-label="그래프 전체화면 열기"
            onClick={onOpenFullscreen}
          >
            전체화면
          </button>
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
        onRenameNode={onRenameNode}
        onMoveToTrash={onMoveToTrash}
        autoFitOnResize
        allowLayoutToggle
        layoutDirection={layoutDirection}
        onToggleLayout={onToggleLayout}
        highlightPathOnHover
        tooltipHideDelay={180}
        renderTooltip={false}
        onTooltipNodeChange={handleTooltipNodeChange}
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

      {externalTooltipNode ? (
        <div className="graph-tooltip top-graph-external-tooltip" role="status">
          <strong>{externalTooltipNode.title}</strong>
          <p>{externalTooltipNode.description}</p>
        </div>
      ) : null}
    </aside>
  )
}
