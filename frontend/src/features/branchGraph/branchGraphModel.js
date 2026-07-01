const MAIN_TARGET_FALLBACK = ''

export function createEmptyGraphState() {
  return {
    nodes: [],
    sessions: [],
    apiSessions: [],
    activeNodeId: '',
    selectedRootNodeId: '',
    mainTargetNodeIdByRoot: {},
    trashNodes: [],
    events: [],
  }
}

export function getRootNodes(nodes) {
  return nodes.filter((node) => node.parentId === null)
}

export function getNodesByRootId(nodes, rootId) {
  return nodes.filter((node) => node.rootId === rootId && !node.isHidden)
}

export function getChildrenByNodeId(nodes, nodeId) {
  return nodes.filter((node) => isChildOfNode(node, nodeId) && !node.isHidden)
}

export function getSubtreeNodeIds(nodes, nodeId) {
  const ids = []
  const queue = [nodeId]

  while (queue.length > 0) {
    const currentId = queue.shift()

    if (!currentId || ids.includes(currentId)) {
      continue
    }

    ids.push(currentId)
    nodes
      .filter((node) => isChildOfNode(node, currentId))
      .forEach((node) => queue.push(node.id))
  }

  return ids
}

export function getActiveNode(state) {
  return state.nodes.find((node) => node.id === state.activeNodeId) ?? state.nodes[0]
}

export function getSessionByNodeId(state, nodeId) {
  return (
    state.sessions.find((session) => session.nodeId === nodeId) ?? {
      id: `messages-${nodeId}`,
      nodeId,
      messages: [],
    }
  )
}

export function getContextSectionsForNode(state, nodeId) {
  return getBranchPath(state.nodes, nodeId).map((node) => ({
    node,
    session: getSessionByNodeId(state, node.id),
  }))
}

export function getNodeById(nodes, nodeId) {
  return nodes.find((node) => node.id === nodeId)
}

export function getBranchPath(nodes, nodeId) {
  const path = []
  let currentNode = getNodeById(nodes, nodeId)

  while (currentNode) {
    path.unshift(currentNode)
    currentNode = currentNode.parentId ? getNodeById(nodes, currentNode.parentId) : null
  }

  return path
}

export function getShortestBranchPath(nodes, nodeId) {
  const startNode = getNodeById(nodes, nodeId)

  if (!startNode) {
    return []
  }

  const queue = [{ node: startNode, path: [startNode] }]
  const visitedNodeIds = new Set()

  while (queue.length > 0) {
    const { node, path } = queue.shift()

    if (visitedNodeIds.has(node.id)) {
      continue
    }

    visitedNodeIds.add(node.id)
    const parentNodes = getParentNodeIds(node)
      .map((parentId) => getNodeById(nodes, parentId))
      .filter(Boolean)

    if (parentNodes.length === 0) {
      return [...path].reverse()
    }

    parentNodes.forEach((parentNode) => {
      queue.push({ node: parentNode, path: [...path, parentNode] })
    })
  }

  return []
}

export function areNodesOnSameShortestRootPath(nodes, firstNodeId, secondNodeId) {
  if (!firstNodeId || !secondNodeId || firstNodeId === secondNodeId) {
    return true
  }

  const firstPathIds = new Set(getShortestBranchPath(nodes, firstNodeId).map((node) => node.id))
  const secondPathIds = new Set(getShortestBranchPath(nodes, secondNodeId).map((node) => node.id))

  return firstPathIds.has(secondNodeId) || secondPathIds.has(firstNodeId)
}

export function getMainPathNodeIds(state, rootId) {
  const mainLeafNode = getMainLeafNodeForRoot(state, rootId)
  const path = getBranchPath(state.nodes, mainLeafNode?.id ?? MAIN_TARGET_FALLBACK)

  return new Set(path.map((node) => node.id))
}

export function getMainLeafNodeForRoot(state, rootId) {
  const rootNode = getNodeById(state.nodes, rootId)

  if (!rootNode) {
    return null
  }

  const targetNodeId = state.mainTargetNodeIdByRoot[rootId]
  const targetNode = getNodeById(state.nodes, targetNodeId)

  if (targetNode && targetNode.rootId === rootId && !targetNode.isHidden) {
    return targetNode
  }

  return getDeepestActiveLeafNode(state.nodes, rootId) ?? rootNode
}

export function selectRoot(state, rootId) {
  const mainLeafNode = getMainLeafNodeForRoot(state, rootId)

  if (!mainLeafNode) {
    return state
  }

  return {
    ...state,
    selectedRootNodeId: rootId,
    activeNodeId: mainLeafNode.id,
  }
}

export function selectNode(state, nodeId) {
  const node = getNodeById(state.nodes, nodeId)

  if (!node) {
    return state
  }

  return {
    ...state,
    activeNodeId: nodeId,
    selectedRootNodeId: node.rootId,
  }
}

export function setMainTargetNode(state, nodeId) {
  const node = getNodeById(state.nodes, nodeId)

  if (!node) {
    return state
  }

  return {
    ...state,
    selectedRootNodeId: node.rootId,
    mainTargetNodeIdByRoot: {
      ...state.mainTargetNodeIdByRoot,
      [node.rootId]: node.id,
    },
    events: addEvent(state.events, 'set_main_target', node.id),
  }
}

export function renameNode(state, nodeId, title) {
  const normalizedTitle = String(title ?? '').trim()

  if (!normalizedTitle || !getNodeById(state.nodes, nodeId)) {
    return state
  }

  return {
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, title: normalizedTitle } : node,
    ),
    events: addEvent(state.events, 'rename_node', nodeId),
  }
}

export function setNodeCollapsed(state, nodeId, isCollapsed) {
  const node = getNodeById(state.nodes, nodeId)

  if (!node) {
    return state
  }

  return {
    ...state,
    nodes: state.nodes.map((candidate) =>
      candidate.id === nodeId ? { ...candidate, isCollapsed } : candidate,
    ),
    events: addEvent(
      state.events,
      isCollapsed ? 'collapse_descendant_nodes' : 'expand_descendant_nodes',
      nodeId,
    ),
  }
}

export function setMergedNodeParentLinks(state, nodeId, parentNodeIds) {
  const node = getNodeById(state.nodes, nodeId)
  const uniqueParentNodeIds = [
    ...new Set(parentNodeIds.filter((parentNodeId) => parentNodeId && parentNodeId !== nodeId)),
  ]

  if (!node || uniqueParentNodeIds.length < 2) {
    return state
  }

  const sourceTitles = uniqueParentNodeIds
    .map((parentNodeId) => getNodeById(state.nodes, parentNodeId)?.title)
    .filter(Boolean)
  const mergeTags = [...new Set([...(node.tags ?? []), '병합'])]

  return {
    ...state,
    nodes: state.nodes.map((candidate) => {
      if (candidate.id !== nodeId) {
        return candidate
      }

      return {
        ...candidate,
        parentId: uniqueParentNodeIds[0],
        parentIds: uniqueParentNodeIds,
        tags: mergeTags,
        description:
          sourceTitles.length > 0
            ? `${sourceTitles.join(' + ')} 흐름을 합친 결과 노드이다.`
            : candidate.description,
      }
    }),
    events: addEvent(state.events, 'link_merged_node_parents', nodeId),
  }
}

export function appendUserMessage(state, nodeId, content) {
  const message = createMessage('user', content)

  return {
    state: appendMessageToSession(state, nodeId, message, 'send_user_message'),
    message,
  }
}

export function appendAssistantMessage(state, nodeId, content) {
  return appendMessageToSession(state, nodeId, createMessage('assistant', content), 'receive_ai_message')
}

export function addBranchFromMessage(state, messageId, parentNodeId = state.activeNodeId) {
  const parentNode = getNodeById(state.nodes, parentNodeId) ?? getActiveNode(state)
  const parentSession = getSessionByNodeId(state, parentNode.id)
  const sourceMessage = parentSession.messages.find((message) => message.id === messageId)
  const branchIndex = state.nodes.filter((node) => node.parentId === parentNode.id).length + 1
  const nodeId = `node-${Date.now()}-${branchIndex}`
  const sessionId = `session-${nodeId}`
  const sourceContent = sourceMessage?.content ?? parentNode.description
  const title = `분기 ${branchIndex}: ${sourceContent.slice(0, 18)}`

  const newNode = {
    id: nodeId,
    rootId: parentNode.rootId,
    parentId: parentNode.id,
    parentMessageId: messageId,
    title,
    description: `${parentNode.title}에서 갈라진 질문 흐름이다.`,
    sessionId,
    createdAt: formatTime(),
    isActive: true,
    isHidden: false,
  }

  const newSession = {
    id: sessionId,
    nodeId,
    messages: [
      createMessage('assistant', `분기 기준 메시지: ${sourceContent}`),
      createMessage('assistant', '이 노드는 원래 흐름과 분리해 후속 질문을 정리하는 세션이다.'),
    ],
  }

  return {
    ...state,
    nodes: [...state.nodes, newNode],
    sessions: [...state.sessions, newSession],
    activeNodeId: nodeId,
    selectedRootNodeId: parentNode.rootId,
    events: addEvent(state.events, 'create_branch', nodeId),
  }
}

export function buildGraphLayout(nodes, rootId, size = 'mini', direction = 'vertical') {
  const visibleNodes = getVisibleGraphNodes(nodes, rootId)
  const rootNode = getNodeById(visibleNodes, rootId)

  if (!rootNode) {
    return { width: 320, height: 180, nodes: [], edges: [] }
  }

  const depthByNodeId = getGraphDepths(visibleNodes, rootNode.id)
  const levels = groupNodesByDepth(visibleNodes, depthByNodeId)
  const nodeOrderById = new Map(visibleNodes.map((node, index) => [node.id, index]))

  const horizontalGap = size === 'full' ? 170 : 82
  const verticalGap = size === 'full' ? 120 : 72
  const paddingX = size === 'full' ? 90 : 42
  const paddingY = size === 'full' ? 70 : 34
  const maxDepth = Math.max(...Array.from(levels.keys()))
  const isHorizontal = direction === 'horizontal'
  const horizontalDepthGap = size === 'full' ? 190 : 120
  const verticalSiblingGap = size === 'full' ? 100 : 72
  const crossAxisGap = isHorizontal ? verticalSiblingGap : horizontalGap
  const crossPositionByNodeId = getLayeredCrossPositions(levels, nodeOrderById, crossAxisGap)
  const crossPositions = Array.from(crossPositionByNodeId.values())
  const minCrossPosition = Math.min(...crossPositions)
  const maxCrossPosition = Math.max(...crossPositions)
  const crossRange = maxCrossPosition - minCrossPosition
  const width = isHorizontal
    ? Math.max(size === 'full' ? 760 : 280, paddingX * 2 + maxDepth * horizontalDepthGap)
    : Math.max(size === 'full' ? 760 : 280, paddingX * 2 + crossRange)
  const height = isHorizontal
    ? Math.max(size === 'full' ? 520 : 220, paddingY * 2 + crossRange)
    : Math.max(size === 'full' ? 520 : 220, paddingY * 2 + maxDepth * verticalGap)
  const crossAxisSize = isHorizontal ? height : width
  const crossAxisOffset = crossAxisSize / 2 - (minCrossPosition + maxCrossPosition) / 2
  const layoutNodes = []

  Array.from(levels.entries())
    .sort(([firstDepth], [secondDepth]) => firstDepth - secondDepth)
    .forEach(([depth, levelNodes]) => {
      const sortedLevelNodes = [...levelNodes].sort(
        (firstNode, secondNode) =>
          (crossPositionByNodeId.get(firstNode.id) ?? 0) -
            (crossPositionByNodeId.get(secondNode.id) ?? 0) ||
          (nodeOrderById.get(firstNode.id) ?? 0) - (nodeOrderById.get(secondNode.id) ?? 0),
      )

      sortedLevelNodes.forEach((node) => {
        const crossPosition = (crossPositionByNodeId.get(node.id) ?? 0) + crossAxisOffset

        if (isHorizontal) {
          layoutNodes.push({
            ...node,
            x: paddingX + depth * horizontalDepthGap,
            y: crossPosition,
            shortTitle: node.title.length > 7 ? `${node.title.slice(0, 7)}.` : node.title,
          })
          return
        }

        layoutNodes.push({
          ...node,
          x: crossPosition,
          y: paddingY + depth * verticalGap,
          shortTitle: node.title.length > 7 ? `${node.title.slice(0, 7)}.` : node.title,
        })
      })
    })

  const layoutNodeById = new Map(layoutNodes.map((node) => [node.id, node]))
  const edges = layoutNodes.flatMap((node) => {
    const visibleParentIds = getParentNodeIds(node).filter((parentId) =>
      layoutNodeById.has(parentId),
    )
    const isMerge = visibleParentIds.length > 1

    return visibleParentIds.map((parentId, parentIndex) => ({
      from: layoutNodeById.get(parentId),
      to: node,
      isMerge,
      mergeIndex: parentIndex,
      mergeCount: visibleParentIds.length,
    }))
  })

  return { width, height, nodes: layoutNodes, edges }
}

function groupNodesByDepth(nodes, depthByNodeId) {
  return nodes.reduce((levels, node) => {
    const depth = depthByNodeId.get(node.id) ?? 0
    const levelNodes = levels.get(depth) ?? []

    levels.set(depth, [...levelNodes, node])
    return levels
  }, new Map())
}

function getLayeredCrossPositions(levels, nodeOrderById, crossAxisGap) {
  const crossPositionByNodeId = new Map()

  Array.from(levels.entries())
    .sort(([firstDepth], [secondDepth]) => firstDepth - secondDepth)
    .forEach(([, levelNodes]) => {
      const targetItems = levelNodes.map((node, index) => ({
        node,
        order: nodeOrderById.get(node.id) ?? index,
        target: getNodeTargetCrossPosition(
          node,
          index,
          levelNodes.length,
          crossAxisGap,
          crossPositionByNodeId,
        ),
      }))

      distributeCrossPositions(targetItems, crossAxisGap).forEach(({ node, crossPosition }) => {
        crossPositionByNodeId.set(node.id, crossPosition)
      })
    })

  return crossPositionByNodeId
}

function getNodeTargetCrossPosition(
  node,
  fallbackIndex,
  levelNodeCount,
  crossAxisGap,
  crossPositionByNodeId,
) {
  const parentCrossPositions = getParentNodeIds(node)
    .map((parentId) => crossPositionByNodeId.get(parentId))
    .filter((crossPosition) => Number.isFinite(crossPosition))

  if (parentCrossPositions.length > 0) {
    return average(parentCrossPositions)
  }

  return (fallbackIndex - (levelNodeCount - 1) / 2) * crossAxisGap
}

function distributeCrossPositions(items, crossAxisGap) {
  const sortedItems = [...items].sort(
    (firstItem, secondItem) =>
      firstItem.target - secondItem.target || firstItem.order - secondItem.order,
  )
  const positionedItems = sortedItems.map((item, index) => {
    const previousPosition = index > 0 ? sortedItems[index - 1].crossPosition : null
    const minimumPosition =
      previousPosition === null ? item.target : previousPosition + crossAxisGap

    item.crossPosition = Math.max(item.target, minimumPosition)
    return item
  })
  const desiredCenter = average(sortedItems.map((item) => item.target))
  const actualCenter = average(positionedItems.map((item) => item.crossPosition))
  const centerShift = desiredCenter - actualCenter

  return positionedItems.map((item) => ({
    node: item.node,
    crossPosition: item.crossPosition + centerShift,
  }))
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function getVisibleGraphNodes(nodes, rootId) {
  const rootNodes = getNodesByRootId(nodes, rootId)
  const rootNode = getNodeById(rootNodes, rootId)

  if (!rootNode) {
    return []
  }

  const visibleNodes = []
  const queue = [rootNode]
  const visitedNodeIds = new Set()

  while (queue.length > 0) {
    const node = queue.shift()

    if (visitedNodeIds.has(node.id)) {
      continue
    }

    visitedNodeIds.add(node.id)
    visibleNodes.push(node)

    if (node.isCollapsed) {
      continue
    }

    getChildrenByNodeId(rootNodes, node.id).forEach((childNode) => {
      queue.push(childNode)
    })
  }

  return visibleNodes
}

function isChildOfNode(node, nodeId) {
  return node.parentId === nodeId || node.parentIds?.includes(nodeId)
}

function getParentNodeIds(node) {
  return [...new Set([node.parentId, ...(node.parentIds ?? [])].filter(Boolean))]
}

function getGraphDepths(nodes, rootId) {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const depthByNodeId = new Map([[rootId, 0]])

  nodes.forEach((node) => {
    if (!depthByNodeId.has(node.id)) {
      depthByNodeId.set(node.id, 0)
    }
  })

  for (let pass = 0; pass < nodes.length; pass += 1) {
    let hasChanged = false

    nodes.forEach((node) => {
      if (node.id === rootId) {
        return
      }

      const parentDepths = getParentNodeIds(node)
        .filter((parentId) => nodeIds.has(parentId))
        .map((parentId) => depthByNodeId.get(parentId) ?? 0)

      if (parentDepths.length === 0) {
        return
      }

      const nextDepth = Math.max(...parentDepths) + 1

      if (nextDepth > (depthByNodeId.get(node.id) ?? 0)) {
        depthByNodeId.set(node.id, nextDepth)
        hasChanged = true
      }
    })

    if (!hasChanged) {
      break
    }
  }

  return depthByNodeId
}

function appendMessageToSession(state, nodeId, message, eventName) {
  return {
    ...state,
    sessions: state.sessions.map((session) => {
      if (session.nodeId !== nodeId) {
        return session
      }

      return {
        ...session,
        messages: [...session.messages, message],
      }
    }),
    events: addEvent(state.events, eventName, nodeId),
  }
}

function getDeepestActiveLeafNode(nodes, rootId) {
  const rootNode = getNodeById(nodes, rootId)

  if (!rootNode) {
    return null
  }

  const visibleActiveNodes = getNodesByRootId(nodes, rootId).filter((node) => node.isActive !== false)
  const queue = [{ node: rootNode, depth: 0 }]
  const visitedNodeIds = new Set()
  let deepestLeaf = { node: rootNode, depth: 0 }

  while (queue.length > 0) {
    const { node, depth } = queue.shift()

    if (visitedNodeIds.has(node.id)) {
      continue
    }

    visitedNodeIds.add(node.id)
    const children = visibleActiveNodes.filter((candidate) => isChildOfNode(candidate, node.id))

    if (children.length === 0 && depth > deepestLeaf.depth) {
      deepestLeaf = { node, depth }
    }

    children.forEach((childNode) => {
      queue.push({ node: childNode, depth: depth + 1 })
    })
  }

  return deepestLeaf.node
}

function createMessage(role, content) {
  return {
    id: `message-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: formatTime(),
  }
}

function addEvent(events, name, targetId) {
  return [
    ...events,
    {
      id: `event-${Date.now()}-${events.length + 1}`,
      name,
      targetId,
      createdAt: formatTime(),
    },
  ]
}

function formatTime() {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}
