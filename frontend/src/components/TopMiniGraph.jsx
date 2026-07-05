import { useCallback, useEffect, useRef, useState } from 'react'
import { MiniGraph } from './MiniGraph.jsx'
import { GraphNodeTooltip } from './GraphNodeTooltip.jsx'

const TOOLTIP_HIDE_DELAY = 180

export function TopMiniGraph({
  graphState,
  activeNode,
  onSelectNode,
  onSetMainTarget,
  onRenameNode,
  onToggleNodeCollapse,
  onSetNodePersona,
  onClearNodePersona,
  onStartNodeMerge,
  onMoveToTrash,
  onOpenFullscreen,
  onOpenSplitNode,
  onClose,
  layoutDirection,
  onToggleLayout,
}) {
  const tooltipHideTimerRef = useRef(null)
  const [externalTooltipNode, setExternalTooltipNode] = useState(null)
  const [isSplitNodeSelectionMode, setIsSplitNodeSelectionMode] = useState(false)
  const rootId = activeNode?.rootId ?? graphState.selectedRootNodeId
  const activeSession = graphState.apiSessions?.find((session) => (
    (session.id ?? session.session_id) === activeNode?.apiSessionId
  ))
  const rootNode = graphState.nodes.find((node) => node.id === rootId)
  const sessionTitle = activeSession?.title ?? rootNode?.title ?? '세션'

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

  useEffect(() => {
    return () => {
      window.clearTimeout(tooltipHideTimerRef.current)
    }
  }, [])

  return (
    <aside
      className={isSplitNodeSelectionMode ? 'top-graph-panel selecting-split-node' : 'top-graph-panel'}
      aria-label="브랜치 시각화 스플릿뷰"
    >
      <header className="top-graph-header">
        <div className="top-graph-heading">
          <p className="eyebrow">{sessionTitle}</p>
          <strong>{activeNode?.title}</strong>
        </div>
        <div className="top-graph-actions">
          <button
            type="button"
            className={isSplitNodeSelectionMode ? 'top-graph-new-tab-button active' : 'top-graph-new-tab-button'}
            aria-pressed={isSplitNodeSelectionMode}
            onClick={() => setIsSplitNodeSelectionMode((isSelecting) => !isSelecting)}
          >
            새 탭
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
        onSelectNode={(nodeId) => {
          if (isSplitNodeSelectionMode) {
            onOpenSplitNode?.(nodeId)
            setIsSplitNodeSelectionMode(false)
            return
          }

          onSelectNode(nodeId)
        }}
        onSetMainTarget={onSetMainTarget}
        onRenameNode={onRenameNode}
        onToggleNodeCollapse={onToggleNodeCollapse}
        onSetNodePersona={onSetNodePersona}
        onClearNodePersona={onClearNodePersona}
        onStartNodeMerge={onStartNodeMerge}
        onMoveToTrash={onMoveToTrash}
        autoFitOnResize
        allowLayoutToggle
        layoutDirection={layoutDirection}
        onToggleLayout={onToggleLayout}
        toolbarLeadingAction={(
          <button
            type="button"
            className="top-graph-fullscreen-button"
            aria-label="그래프 전체화면 열기"
            onClick={onOpenFullscreen}
          >
            전체화면
          </button>
        )}
        selectionActionLabel={isSplitNodeSelectionMode ? ' 스플릿뷰로 열기' : ''}
        isNodeSelectionDisabled={isSplitNodeSelectionMode
          ? (nodeId) => nodeId === activeNode?.id
          : undefined}
        highlightPathOnHover
        tooltipHideDelay={180}
        renderTooltip={false}
        onTooltipNodeChange={handleTooltipNodeChange}
      />

      {externalTooltipNode ? (
        <GraphNodeTooltip
          node={externalTooltipNode}
          className="top-graph-external-tooltip"
          showTags={false}
        />
      ) : null}
    </aside>
  )
}
