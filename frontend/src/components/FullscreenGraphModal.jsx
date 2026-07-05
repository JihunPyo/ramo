import { useState } from 'react'
import { MiniGraph } from './MiniGraph.jsx'
import { GraphNodeTooltip } from './GraphNodeTooltip.jsx'
import { canMergeNodes } from '../features/branchGraph/branchGraphModel.js'

export function FullscreenGraphModal({
  graphState,
  onClose,
  onSelectNode,
  onSetMainTarget,
  onRenameNode,
  onToggleNodeCollapse,
  onSetNodePersona,
  onClearNodePersona,
  onStartNodeMerge,
  onMoveToTrash,
  layoutDirection,
  onToggleLayout,
  mergeNodeIds = [],
  onSelectMergeNode,
  onConfirmMerge,
  isMerging = false,
  mergeRecommendation,
  isMergeRecommendationLoading = false,
  mergeRecommendationError = '',
}) {
  const [tooltipNode, setTooltipNode] = useState(null)
  const mergeNodes = mergeNodeIds
    .map((nodeId) => graphState.nodes.find((node) => node.id === nodeId))
    .filter(Boolean)
  const isMergeMode = mergeNodes.length > 0
  const sourceNode = mergeNodes[0]
  const recommendationNode = mergeRecommendation
    ? graphState.nodes.find((node) => node.id === mergeRecommendation.branchId)
    : null

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
            <p className="eyebrow">{isMergeMode ? '노드 합치기' : '전체 그래프'}</p>
            <h2>{isMergeMode ? `현재노드: ${sourceNode?.title ?? ''}` : '현재 루트 흐름'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        {isMergeMode ? (
          <div className="merge-mode-banner" role="status" aria-label="병합 노드 추천">
            <div className="merge-recommendation-copy">
              <span className="merge-recommendation-label">병합 노드 추천</span>
              <div className="merge-recommendation-nodes">
                <span>
                  <b>추천노드:</b>{' '}
                  {isMergeRecommendationLoading
                    ? '찾는 중...'
                    : recommendationNode?.title ?? '추천 노드 없음'}
                </span>
              </div>
              {!isMergeRecommendationLoading && recommendationNode ? (
                <span className="merge-recommendation-reason">{mergeRecommendation.reason}</span>
              ) : null}
              {!isMergeRecommendationLoading && !recommendationNode ? (
                <span className="merge-recommendation-reason">
                  {mergeRecommendationError || '추천할 수 있는 노드가 없습니다.'}
                </span>
              ) : null}
            </div>
            {recommendationNode && mergeNodes.length < 2 ? (
              <button type="button" onClick={() => onSelectMergeNode(recommendationNode.id)}>
                추천 노드 선택
              </button>
            ) : null}
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
          onSetNodePersona={onSetNodePersona}
          onClearNodePersona={onClearNodePersona}
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
          isNodeSelectionDisabled={isMergeMode
            ? (nodeId) => !canMergeNodes(graphState.nodes, sourceNode?.id, nodeId)
            : undefined}
        />

        <div className="fullscreen-graph-footer">
          <div className="fullscreen-graph-tooltip-slot" aria-live="polite" aria-atomic="true">
            {tooltipNode ? (
              <GraphNodeTooltip
                node={tooltipNode}
                className="fullscreen-graph-tooltip"
              />
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
