import { useState } from 'react'
import { MiniGraph } from './MiniGraph.jsx'

export function FullscreenGraphModal({
  graphState,
  onClose,
  onSelectNode,
  onSetMainTarget,
  onRenameNode,
  onToggleNodeCollapse,
  onStartNodeMerge,
  onMoveToTrash,
  layoutDirection,
  onToggleLayout,
  mergeNodeIds = [],
  onSelectMergeNode,
  onConfirmMerge,
  isMerging = false,
}) {
  const [tooltipNode, setTooltipNode] = useState(null)
  const mergeNodes = mergeNodeIds
    .map((nodeId) => graphState.nodes.find((node) => node.id === nodeId))
    .filter(Boolean)
  const isMergeMode = mergeNodes.length > 0

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className={isMergeMode ? 'graph-modal merge-mode' : 'graph-modal'}
        role="dialog"
        aria-modal="true"
        aria-label={isMergeMode ? '노드 합치기 전체 그래프' : '전체 그래프'}
      >
        <header className="graph-modal-header">
          <div>
            <p className="eyebrow">전체 그래프</p>
            <h2>현재 루트 흐름</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        {isMergeMode ? (
          <div className="merge-mode-banner" role="status">
            <div>
              <strong>노드 합치기</strong>
              <span>합칠 두 번째 노드를 그래프에서 선택하세요.</span>
            </div>
            <div className="merge-node-chips" aria-label="합치기 선택 노드">
              {mergeNodes.map((node, index) => (
                <span key={node.id}>{index + 1}. {node.title}</span>
              ))}
              {mergeNodes.length < 2 ? <span className="empty">2. 노드를 선택하세요</span> : null}
            </div>
          </div>
        ) : null}

        <MiniGraph
          graphState={graphState}
          rootId={graphState.selectedRootNodeId}
          size="full"
          onSelectNode={isMergeMode ? onSelectMergeNode : onSelectNode}
          onSetMainTarget={onSetMainTarget}
          onRenameNode={onRenameNode}
          onToggleNodeCollapse={onToggleNodeCollapse}
          onStartNodeMerge={onStartNodeMerge}
          onMoveToTrash={onMoveToTrash}
          allowLayoutToggle
          layoutDirection={layoutDirection}
          onToggleLayout={onToggleLayout}
          highlightPathOnHover
          tooltipHideDelay={180}
          renderTooltip={false}
          onTooltipNodeChange={setTooltipNode}
          mergeSelectedNodeIds={mergeNodeIds}
        />

        <div className="fullscreen-graph-footer">
          <div className="fullscreen-graph-tooltip-slot" aria-live="polite" aria-atomic="true">
            {tooltipNode ? (
              <div className="graph-tooltip fullscreen-graph-tooltip" role="status">
                <strong>{tooltipNode.title}</strong>
                <p>{tooltipNode.description}</p>
              </div>
            ) : null}
          </div>
          {isMergeMode ? (
            <button
              type="button"
              className="merge-confirm-button"
              disabled={mergeNodes.length !== 2 || isMerging}
              onClick={onConfirmMerge}
            >
              {isMerging ? '합치는 중' : '합치기'}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  )
}
