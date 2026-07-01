import { useState } from 'react'
import { MiniGraph } from './MiniGraph.jsx'

export function FullscreenGraphModal({
  graphState,
  onClose,
  onSelectNode,
  onSetMainTarget,
  onMoveToTrash,
  layoutDirection,
  onToggleLayout,
}) {
  const [tooltipNode, setTooltipNode] = useState(null)

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="graph-modal" role="dialog" aria-modal="true" aria-label="전체 그래프">
        <header className="graph-modal-header">
          <div>
            <p className="eyebrow">전체 그래프</p>
            <h2>현재 루트 흐름</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        <MiniGraph
          graphState={graphState}
          rootId={graphState.selectedRootNodeId}
          size="full"
          onSelectNode={onSelectNode}
          onSetMainTarget={onSetMainTarget}
          onMoveToTrash={onMoveToTrash}
          allowLayoutToggle
          layoutDirection={layoutDirection}
          onToggleLayout={onToggleLayout}
          highlightPathOnHover
          tooltipHideDelay={180}
          renderTooltip={false}
          onTooltipNodeChange={setTooltipNode}
        />

        <div className="fullscreen-graph-tooltip-slot" aria-live="polite" aria-atomic="true">
          {tooltipNode ? (
            <div className="graph-tooltip fullscreen-graph-tooltip" role="status">
              <strong>{tooltipNode.title}</strong>
              <p>{tooltipNode.description}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
