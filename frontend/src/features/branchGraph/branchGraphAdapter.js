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
  trashSessions = [],
  previousState,
  activeNodeId,
  selectedRootNodeId,
}) {
  const loadedApiSessionIds = new Set(graphResponses.map(({ session }) => readSessionId(session)))
  const loadedNodes = graphResponses.flatMap(({ session, graph, branches = [] }) =>
    normalizeGraphNodes({
      session,
      graph,
      branches,
      previousNodes: previousState.nodes,
    }),
  )
  const unloadedNodes = apiSessions
    .filter((session) => !loadedApiSessionIds.has(readSessionId(session)))
    .map((session) => normalizeSessionPlaceholderNode(session, previousState.nodes))
    .filter(Boolean)
  const nodes = [...loadedNodes, ...unloadedNodes]
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
    trashNodes: [
      ...normalizeTrashSessions(trashSessions),
      ...graphResponses.flatMap(({ session, branches = [], branchTrash = [] }) =>
        normalizeTrashNodes(session, branches, branchTrash),
      ),
    ],
    events: previousState.events,
  }
}

function normalizeSessionPlaceholderNode(session, previousNodes = []) {
  const apiSessionId = readSessionId(session)
  const branchId = readMainBranchId(session)

  if (!apiSessionId || !branchId) {
    return null
  }

  const previousNode = previousNodes.find((node) => node.id === branchId)
  const title = session?.title ?? previousNode?.title ?? '새 대화'

  return {
    id: branchId,
    rootId: branchId,
    parentId: null,
    parentIds: [],
    parentMessageId: null,
    title,
    tags: previousNode?.tags ?? [],
    description: previousNode?.description ?? '선택하면 브랜치 정보를 불러오는 세션이다.',
    sessionId: `messages-${branchId}`,
    apiSessionId,
    createdAt: formatDisplayTime(session?.created_at ?? session?.createdAt),
    isActive: true,
    isHidden: false,
    status: 'active',
    isCollapsed: false,
    isMain: true,
    isMerge: false,
    messageCount: previousNode?.messageCount ?? 0,
  }
}

function normalizeTrashSessions(trashSessions) {
  return trashSessions
    .map((session) => {
      const apiSessionId = readSessionId(session)

      return {
        id: `trash-session-${apiSessionId}`,
        rootId: `trash-session-${apiSessionId}`,
        parentId: null,
        parentIds: [],
        title: session?.title ?? '삭제된 세션',
        description: '휴지통으로 이동한 세션이다.',
        apiSessionId,
        trashType: 'session',
        status: 'deleted',
        deletedAt: session?.deleted_at ?? session?.deletedAt ?? '',
      }
    })
    .filter((node) => node.apiSessionId)
}

function normalizeTrashNodes(session, branches, branchTrash) {
  const apiSessionId = readSessionId(session)
  const sessionTitle = session?.title ?? '새 대화'
  const deletedAtByBranchId = new Map(
    branchTrash.map((branch) => [readBranchId(branch), branch.deleted_at ?? branch.deletedAt ?? '']),
  )

  return branches
    .filter((branch) => branch.status === 'deleted')
    .map((branch) => ({
      id: readBranchId(branch),
      rootId: readMainBranchId(session),
      parentId: branch.parent_branch_id ?? branch.parentBranchId ?? null,
      parentIds:
        branch.merge_parent_ids ??
        branch.mergeParentIds ??
        branch.merged_parent_branch_ids ??
        branch.mergedParentBranchIds ??
        branch.parent_branch_ids ??
        [],
      title: branch.name ?? branch.label ?? branch.title ?? '삭제된 브랜치',
      description: `${sessionTitle}에서 삭제한 브랜치`,
      apiSessionId,
      trashType: 'branch',
      status: 'deleted',
      deletedAt:
        deletedAtByBranchId.get(readBranchId(branch)) ??
        branch.deleted_at ??
        branch.deletedAt ??
        branch.updated_at ??
        branch.updatedAt ??
        '',
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

function normalizeGraphNodes({ session, graph, branches = [], previousNodes = [] }) {
  const apiSessionId = readSessionId(session)
  const sessionTitle = session?.title ?? '새 대화'
  const graphNodes = Array.isArray(graph?.nodes) ? graph.nodes : []
  const graphEdges = Array.isArray(graph?.edges) ? graph.edges : []
  const branchById = new Map(branches.map((branch) => [readBranchId(branch), branch]))
  const previousNodeById = new Map(previousNodes.map((node) => [node.id, node]))
  const parentIdsByNodeId = new Map()
  const forkMessageByNodeId = new Map()

  graphEdges.forEach((edge) => {
    const targetId = edge.target ?? edge.to
    const sourceId = edge.source ?? edge.from

    if (targetId && sourceId) {
      const parentIds = parentIdsByNodeId.get(targetId) ?? []
      parentIdsByNodeId.set(targetId, [...new Set([...parentIds, sourceId])])
      forkMessageByNodeId.set(targetId, edge.fork_from_message_id ?? edge.forkFromMessageId ?? null)
    }
  })

  const nodes = graphNodes
    .map((node) => {
      const branchId = readBranchId(node)
      const branch = branchById.get(branchId)
      const status = node.status ?? branch?.status ?? 'active'

      if (!branchId || status === 'deleted') {
        return null
      }

      const declaredParentIds =
        branch?.merge_parent_ids ??
        branch?.mergeParentIds ??
        branch?.merged_parent_branch_ids ??
        branch?.mergedParentBranchIds ??
        node.merge_parent_ids ??
        node.mergeParentIds ??
        node.merged_parent_branch_ids ??
        node.mergedParentBranchIds ??
        node.parent_branch_ids ??
        []
      const previousParentIds = previousNodeById.get(branchId)?.parentIds ?? []
      const parentIds = [
        ...new Set([
          ...(parentIdsByNodeId.get(branchId) ?? []),
          ...declaredParentIds,
          ...(previousParentIds.length > 1 ? previousParentIds : []),
        ]),
      ]
      const parentId = branch?.parent_branch_id ?? node.parent_branch_id ?? parentIds[0] ?? null
      const title = resolveNodeTitle({
        rawTitle: node.label ?? branch?.name ?? node.name ?? node.title,
        parentId,
        sessionTitle,
      })

      return {
        id: branchId,
        rootId: '',
        parentId,
        parentIds: parentIds.length > 0 ? parentIds : parentId ? [parentId] : [],
        parentMessageId:
          forkMessageByNodeId.get(branchId) ??
          branch?.fork_from_message_id ??
          node.fork_from_message_id ??
          node.parentMessageId ??
          null,
        title,
        tags: normalizeNodeTags(node.tags ?? node.tag_list ?? node.tagList),
        description: node.summary ?? `${sessionTitle}의 ${title} 흐름이다.`,
        sessionId: `messages-${branchId}`,
        apiSessionId,
        createdAt: formatDisplayTime(branch?.created_at ?? node.created_at ?? node.createdAt),
        isActive: status === 'active',
        isHidden: false,
        status,
        isCollapsed: Boolean(branch?.is_collapsed ?? node.is_collapsed ?? node.isCollapsed),
        isMain: Boolean(branch?.is_main ?? node.is_main ?? node.isMain),
        isMerge: Boolean(branch?.is_merge ?? node.is_merge ?? node.isMerge),
        messageCount: node.message_count ?? node.messageCount ?? 0,
      }
    })
    .filter(Boolean)

  return nodes.map((node) => ({
    ...node,
    rootId: resolveRootId(nodes, node.id),
  }))
}

function normalizeNodeTags(rawTags) {
  if (!Array.isArray(rawTags)) {
    return []
  }

  return rawTags
    .map((tag) => {
      if (typeof tag === 'string' || typeof tag === 'number') {
        return String(tag)
      }

      return tag?.name ?? tag?.label ?? tag?.title ?? tag?.value ?? ''
    })
    .map((tag) => tag.trim().replace(/^#+/, ''))
    .filter(Boolean)
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
      const apiMainTarget = getDeepestMainNode(nodes, rootNode.id)

      if (apiMainTarget) {
        return {
          ...map,
          [rootNode.id]: apiMainTarget.id,
        }
      }

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

function getDeepestMainNode(nodes, rootId) {
  return nodes
    .filter((node) => node.rootId === rootId && node.isMain && !node.isHidden)
    .sort((firstNode, secondNode) => (
      getPathDepth(nodes, secondNode.id) - getPathDepth(nodes, firstNode.id)
    ))[0]
}

function getPathDepth(nodes, nodeId) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const visitedNodeIds = new Set()
  let depth = 0
  let currentNode = nodeById.get(nodeId)

  while (currentNode?.parentId && !visitedNodeIds.has(currentNode.id)) {
    visitedNodeIds.add(currentNode.id)
    depth += 1
    currentNode = nodeById.get(currentNode.parentId)
  }

  return depth
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
  const status = message.status ?? 'active'
  const metadata = message.metadata ?? message.meta ?? {}
  const model = message.model ?? metadata.model ?? {}

  return {
    id: message.id ?? message.message_id,
    role: message.role,
    content: message.content,
    status,
    kind: message.kind ?? metadata.kind ?? '',
    modelProvider:
      message.model_provider ??
      message.modelProvider ??
      model.provider ??
      metadata.model_provider ??
      metadata.modelProvider ??
      '',
    modelName:
      message.model_name ??
      message.modelName ??
      model.name ??
      metadata.model_name ??
      metadata.modelName ??
      '',
    isHidden:
      status === 'hidden' ||
      message.visible === false ||
      message.is_hidden === true ||
      message.isHidden === true ||
      metadata.hidden_from_user === true,
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
