import { useMemo, useState } from 'react'
import {
  buildGraphLayout,
  getMainPathNodeIds,
} from '../features/branchGraph/branchGraphModel.js'

export function MiniGraph({
  graphState,
  rootId,
  size = 'mini',
  onSelectNode,
  onSetMainTarget,
}) {
  const [activeTooltipNodeId, setActiveTooltipNodeId] = useState(null)
  const layout = useMemo(
    () => buildGraphLayout(graphState.nodes, rootId, size),
    [graphState.nodes, rootId, size],
  )
  const mainPathNodeIds = useMemo(
    () => getMainPathNodeIds(graphState, rootId),
    [graphState, rootId],
  )
  const activeTooltipNode = layout.nodes.find((node) => node.id === activeTooltipNodeId)

  const closeTooltip = () => {
    setActiveTooltipNodeId(null)
  }

  return (
    <div
      className={`mini-graph ${size}`}
      onMouseLeave={closeTooltip}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          closeTooltip()
        }
      }}
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
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
              onMouseEnter={() => setActiveTooltipNodeId(layoutNode.id)}
              onFocus={() => setActiveTooltipNodeId(layoutNode.id)}
              onClick={() => onSelectNode(layoutNode.id)}
              onKeyDown={(event) => {
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

      {activeTooltipNode ? (
        <div
          className="graph-tooltip"
          role="group"
          aria-label={`${activeTooltipNode.title} 노드 정보`}
          onClick={(event) => event.stopPropagation()}
        >
          <strong>{activeTooltipNode.title}</strong>
          <p>{activeTooltipNode.description}</p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onSetMainTarget(activeTooltipNode.id)
            }}
          >
            main 지정
          </button>
        </div>
      ) : null}
    </div>
  )
}
