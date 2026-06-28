import { useMemo } from 'react'
import {
  buildGraphLayout,
  getNodesByRootId,
} from '../features/branchGraph/branchGraphModel.js'
import { MiniGraph } from './MiniGraph.jsx'

const MINI_GRAPH_WIDTH_LIMIT = 360
const MINI_GRAPH_NODE_LIMIT = 8

export function TopMiniGraph({
  graphState,
  activeNode,
  onSelectNode,
  onSetMainTarget,
  onMoveToTrash,
  onOpenFullscreen,
  onClose,
}) {
  const rootId = activeNode?.rootId ?? graphState.selectedRootNodeId
  const rootNodes = getNodesByRootId(graphState.nodes, rootId)
  const layout = useMemo(() => buildGraphLayout(graphState.nodes, rootId, 'mini'), [
    graphState.nodes,
    rootId,
  ])
  const shouldShowFullscreenAction =
    rootNodes.length >= MINI_GRAPH_NODE_LIMIT || layout.width > MINI_GRAPH_WIDTH_LIMIT

  return (
    <aside className="top-graph-panel" aria-label="현재 흐름 미니 그래프">
      <header>
        <div>
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
    </aside>
  )
}
