export function readSessionId(session) {
  return session?.session_id ?? session?.id ?? ''
}

export function readMainBranchId(session) {
  return session?.main_branch_id ?? session?.mainBranchId ?? session?.root_branch_id ?? ''
}

export function readBranchId(branch) {
  return branch?.branch_id ?? branch?.id ?? ''
}

export function buildGraphStateFromApi({
  apiSessions,
  graphResponses,
  previousState,
  activeNodeId,
  selectedRootNodeId,
}) {
  const nodes = graphResponses.flatMap(({ session, graph }) =>
    normalizeGraphNodes({
      session,
      graph,
    }),
  )
  const nodeIds = new Set(nodes.map((node) => node.id))
  const fallbackRootId = nodes.find((node) => node.parentId === null)?.id ?? ''
  const resolvedActiveNodeId = nodeIds.has(activeNodeId)
    ? activeNodeId
    : nodeIds.has(previousState.activeNodeId)
      ? previousState.activeNodeId
      : fallbackRootId
  const activeNode = nodes.find((node) => node.id === resolvedActiveNodeId)
  const resolvedSelectedRootId = nodeIds.has(selectedRootNodeId)
    ? selectedRootNodeId
    : activeNode?.rootId ?? fallbackRootId

  return {
    nodes,
    sessions: nodes.map((node) => ({
      id: `messages-${node.id}`,
      nodeId: node.id,
      messages: previousState.sessions.find((session) => session.nodeId === node.id)?.messages ?? [],
    })),
    apiSessions,
    activeNodeId: resolvedActiveNodeId,
    selectedRootNodeId: resolvedSelectedRootId,
    mainTargetNodeIdByRoot: buildMainTargetMap(nodes, previousState.mainTargetNodeIdByRoot),
    trashNodes: graphResponses.flatMap(({ session, branches = [] }) =>
      normalizeTrashNodes(session, branches),
    ),
    events: previousState.events,
  }
}

function normalizeTrashNodes(session, branches) {
  const apiSessionId = readSessionId(session)
  const sessionTitle = session?.title ?? '새 대화'

  return branches
    .filter((branch) => branch.status === 'deleted')
    .map((branch) => ({
      id: readBranchId(branch),
      rootId: readMainBranchId(session),
      parentId: branch.parent_branch_id ?? branch.parentBranchId ?? null,
      title: branch.name ?? branch.label ?? branch.title ?? '삭제된 브랜치',
      description: `${sessionTitle}에서 삭제한 브랜치`,
      apiSessionId,
      status: 'deleted',
      deletedAt: branch.updated_at ?? branch.updatedAt ?? '',
    }))
    .filter((node) => node.id)
}

export function applyBranchMessages(state, branchId, apiMessages) {
  const messageGroups = groupMessagesByBranch(apiMessages, branchId)

  return {
    ...state,
    sessions: state.sessions.map((session) => {
      const messages = messageGroups.get(session.nodeId)

      if (!messages) {
        return session
      }

      return {
        ...session,
        messages,
      }
    }),
  }
}

function normalizeGraphNodes({ session, graph }) {
  const apiSessionId = readSessionId(session)
  const sessionTitle = session?.title ?? '새 대화'
  const graphNodes = Array.isArray(graph?.nodes) ? graph.nodes : []
  const graphEdges = Array.isArray(graph?.edges) ? graph.edges : []
  const parentByNodeId = new Map()
  const forkMessageByNodeId = new Map()

  graphEdges.forEach((edge) => {
    const targetId = edge.target ?? edge.to
    const sourceId = edge.source ?? edge.from

    if (targetId && sourceId) {
      parentByNodeId.set(targetId, sourceId)
      forkMessageByNodeId.set(targetId, edge.fork_from_message_id ?? edge.forkFromMessageId ?? null)
    }
  })

  const nodes = graphNodes
    .map((node) => {
      const branchId = readBranchId(node)
      const status = node.status ?? 'active'

      if (!branchId || status === 'deleted') {
        return null
      }

      const parentId = parentByNodeId.get(branchId) ?? node.parent_branch_id ?? null
      const title = resolveNodeTitle({
        rawTitle: node.label ?? node.name ?? node.title,
        parentId,
        sessionTitle,
      })

      return {
        id: branchId,
        rootId: '',
        parentId,
        parentMessageId:
          forkMessageByNodeId.get(branchId) ?? node.fork_from_message_id ?? node.parentMessageId ?? null,
        title,
        description: node.summary ?? `${sessionTitle}의 ${title} 흐름이다.`,
        sessionId: `messages-${branchId}`,
        apiSessionId,
        createdAt: formatDisplayTime(node.created_at ?? node.createdAt),
        isActive: status === 'active',
        isHidden: Boolean(node.is_collapsed ?? node.isCollapsed),
        status,
        isCollapsed: Boolean(node.is_collapsed ?? node.isCollapsed),
        messageCount: node.message_count ?? node.messageCount ?? 0,
      }
    })
    .filter(Boolean)

  return nodes.map((node) => ({
    ...node,
    rootId: resolveRootId(nodes, node.id),
  }))
}

function resolveNodeTitle({ rawTitle, parentId, sessionTitle }) {
  const normalizedTitle = String(rawTitle ?? '').trim()

  if (parentId === null && (!normalizedTitle || normalizedTitle === 'main')) {
    return sessionTitle
  }

  return normalizedTitle || '브랜치'
}

function resolveRootId(nodes, nodeId) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const visitedNodeIds = new Set()
  let currentNode = nodeById.get(nodeId)

  while (currentNode?.parentId && !visitedNodeIds.has(currentNode.parentId)) {
    visitedNodeIds.add(currentNode.id)
    currentNode = nodeById.get(currentNode.parentId)
  }

  return currentNode?.id ?? nodeId
}

function buildMainTargetMap(nodes, previousMap = {}) {
  return nodes
    .filter((node) => node.parentId === null)
    .reduce((map, rootNode) => {
      const previousTargetId = previousMap[rootNode.id]
      const hasPreviousTarget = nodes.some(
        (node) => node.id === previousTargetId && node.rootId === rootNode.id && !node.isHidden,
      )

      if (!hasPreviousTarget) {
        return map
      }

      return {
        ...map,
        [rootNode.id]: previousTargetId,
      }
    }, {})
}

function groupMessagesByBranch(apiMessages, fallbackBranchId) {
  const groups = new Map()
  const messages = Array.isArray(apiMessages) ? apiMessages : apiMessages?.messages ?? []

  messages.forEach((message) => {
    const branchId = message.branch_id ?? message.branchId ?? fallbackBranchId
    const group = groups.get(branchId) ?? []
    groups.set(branchId, [...group, normalizeMessage(message)])
  })

  if (!groups.has(fallbackBranchId)) {
    groups.set(fallbackBranchId, [])
  }

  return groups
}

function normalizeMessage(message) {
  return {
    id: message.id ?? message.message_id,
    role: message.role,
    content: message.content,
    createdAt: formatDisplayTime(message.created_at ?? message.createdAt),
  }
}

function formatDisplayTime(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
