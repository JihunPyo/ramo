import {
  getNodesByRootId,
} from '../features/branchGraph/branchGraphModel.js'
import { MiniGraph } from './MiniGraph.jsx'

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

  return (
    <aside className="top-graph-panel" aria-label="브랜치 시각화 패널">
      <div className="top-graph-close-row">
        <button
          type="button"
          className="graph-close-button"
          aria-label="시각화 패널 닫기"
          aria-expanded="true"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="graph-panel-actions">
        <button
          type="button"
          className="primary-action"
          onClick={() => activeNode && onSetMainTarget(activeNode.id)}
        >
          main으로 지정
        </button>
        <button type="button" className="secondary-action" onClick={onOpenFullscreen}>
          전체 화면
        </button>
      </div>

      <div className="graph-panel-canvas">
        <MiniGraph
          graphState={graphState}
          rootId={rootId}
          onSelectNode={onSelectNode}
          onSetMainTarget={onSetMainTarget}
          onMoveToTrash={onMoveToTrash}
        />
      </div>

      {rootNodes.length >= MINI_GRAPH_NODE_LIMIT ? (
        <p className="graph-panel-hint">노드가 많습니다. 전체 화면에서 흐름을 자세히 확인하세요.</p>
      ) : null}
    </aside>
  )
}
