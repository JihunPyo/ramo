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
  const [hoveredNodeId, setHoveredNodeId] = useState(null)
  const layout = useMemo(
    () => buildGraphLayout(graphState.nodes, rootId, size),
    [graphState.nodes, rootId, size],
  )
  const mainPathNodeIds = useMemo(
    () => getMainPathNodeIds(graphState, rootId),
    [graphState, rootId],
  )
  const hoveredLayoutNode = layout.nodes.find((node) => node.id === hoveredNodeId)

  return (
    <div className={`mini-graph ${size}`}>
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
              onMouseEnter={() => setHoveredNodeId(layoutNode.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onFocus={() => setHoveredNodeId(layoutNode.id)}
              onBlur={() => setHoveredNodeId(null)}
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

      {hoveredLayoutNode ? (
        <div className="graph-tooltip">
          <strong>{hoveredLayoutNode.title}</strong>
          <p>{hoveredLayoutNode.description}</p>
          <button type="button" onClick={() => onSetMainTarget(hoveredLayoutNode.id)}>
            main 지정
          </button>
        </div>
      ) : null}
    </div>
  )
}
