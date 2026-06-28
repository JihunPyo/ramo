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
        {shouldShowFullscreenAction ? (
          <button type="button" className="secondary-action" onClick={onOpenFullscreen}>
            전체화면
          </button>
        ) : null}
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
