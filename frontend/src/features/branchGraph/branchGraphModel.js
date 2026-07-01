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
  return nodes.filter((node) => node.parentId === nodeId && !node.isHidden)
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
      .filter((node) => node.parentId === currentId)
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
  const levels = new Map()
  const rootNode = getNodeById(visibleNodes, rootId)

  if (!rootNode) {
    return { width: 320, height: 180, nodes: [], edges: [] }
  }

  const queue = [{ node: rootNode, depth: 0 }]

  while (queue.length > 0) {
    const { node, depth } = queue.shift()
    const levelNodes = levels.get(depth) ?? []
    levels.set(depth, [...levelNodes, node])

    getChildrenByNodeId(visibleNodes, node.id).forEach((childNode) => {
      queue.push({ node: childNode, depth: depth + 1 })
    })
  }

  const horizontalGap = size === 'full' ? 170 : 82
  const verticalGap = size === 'full' ? 120 : 72
  const paddingX = size === 'full' ? 90 : 42
  const paddingY = size === 'full' ? 70 : 34
  const widestLevel = Math.max(...Array.from(levels.values()).map((levelNodes) => levelNodes.length))
  const maxDepth = Math.max(...Array.from(levels.keys()))
  const isHorizontal = direction === 'horizontal'
  const horizontalDepthGap = size === 'full' ? 190 : 120
  const verticalSiblingGap = size === 'full' ? 100 : 72
  const width = isHorizontal
    ? Math.max(size === 'full' ? 760 : 280, paddingX * 2 + maxDepth * horizontalDepthGap)
    : Math.max(
        size === 'full' ? 760 : 280,
        paddingX * 2 + (widestLevel - 1) * horizontalGap,
      )
  const height = isHorizontal
    ? Math.max(
        size === 'full' ? 520 : 220,
        paddingY * 2 + (widestLevel - 1) * verticalSiblingGap,
      )
    : Math.max(size === 'full' ? 520 : 220, paddingY * 2 + maxDepth * verticalGap)
  const layoutNodes = []

  Array.from(levels.entries()).forEach(([depth, levelNodes]) => {
    if (isHorizontal) {
      const levelHeight = (levelNodes.length - 1) * verticalSiblingGap
      const startY = height / 2 - levelHeight / 2

      levelNodes.forEach((node, index) => {
        layoutNodes.push({
          ...node,
          x: paddingX + depth * horizontalDepthGap,
          y: startY + index * verticalSiblingGap,
          shortTitle: node.title.length > 7 ? `${node.title.slice(0, 7)}.` : node.title,
        })
      })
      return
    }

    const levelWidth = (levelNodes.length - 1) * horizontalGap
    const startX = width / 2 - levelWidth / 2

    levelNodes.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        x: startX + index * horizontalGap,
        y: paddingY + depth * verticalGap,
        shortTitle: node.title.length > 7 ? `${node.title.slice(0, 7)}.` : node.title,
      })
    })
  })

  const edges = layoutNodes
    .filter((node) => node.parentId)
    .map((node) => ({
      from: layoutNodes.find((candidate) => candidate.id === node.parentId),
      to: node,
    }))
    .filter((edge) => edge.from && edge.to)

  return { width, height, nodes: layoutNodes, edges }
}

function getVisibleGraphNodes(nodes, rootId) {
  const rootNodes = getNodesByRootId(nodes, rootId)
  const rootNode = getNodeById(rootNodes, rootId)

  if (!rootNode) {
    return []
  }

  const visibleNodes = []
  const queue = [rootNode]

  while (queue.length > 0) {
    const node = queue.shift()
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
  let deepestLeaf = { node: rootNode, depth: 0 }

  while (queue.length > 0) {
    const { node, depth } = queue.shift()
    const children = visibleActiveNodes.filter((candidate) => candidate.parentId === node.id)

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
