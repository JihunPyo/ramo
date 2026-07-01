import { createInitialGraphState } from './mockData.js'
import { createMockLlmResponse } from './mockLlmProvider.js'

export function createMockBranchGraphApi() {
  const store = createMockStore()

  return {
    async listSessions() {
      await delay()
      return [...store.sessions]
    },
    async createSession(title = '새 대화') {
      await delay()
      const createdAt = new Date().toISOString()
      const sessionId = `mock-session-${Date.now()}`
      const branchId = `mock-root-${Date.now()}`
      const session = {
        id: sessionId,
        title,
        main_branch_id: branchId,
        created_at: createdAt,
        updated_at: createdAt,
      }
      const branch = {
        id: branchId,
        session_id: sessionId,
        parent_branch_id: null,
        fork_from_message_id: null,
        name: title,
        tags: ['새 대화', '메인'],
        status: 'active',
        is_collapsed: false,
        created_at: createdAt,
        updated_at: createdAt,
      }

      store.sessions.unshift(session)
      store.branches.set(branchId, branch)
      store.messagesByBranchId.set(branchId, [])

      return session
    },
    async updateSession(sessionId, patch) {
      await delay()
      const sessionIndex = store.sessions.findIndex((session) => session.id === sessionId)

      if (sessionIndex < 0) {
        throw new Error('session_id가 존재하지 않습니다.')
      }

      const currentSession = store.sessions[sessionIndex]
      const title = patch.title?.trim() || currentSession.title
      const updatedSession = {
        ...currentSession,
        title,
        updated_at: new Date().toISOString(),
      }

      store.sessions[sessionIndex] = updatedSession

      const rootBranch = store.branches.get(currentSession.main_branch_id)
      if (rootBranch) {
        store.branches.set(rootBranch.id, {
          ...rootBranch,
          name: title,
          updated_at: updatedSession.updated_at,
        })
      }

      return updatedSession
    },
    async listBranches(sessionId) {
      await delay()
      return getBranchesBySession(store, sessionId)
    },
    async getSessionGraph(sessionId, includeInactive = true) {
      await delay()
      const branches = getBranchesBySession(store, sessionId).filter((branch) => {
        if (branch.status === 'deleted') {
          return false
        }

        return includeInactive || branch.status === 'active'
      })

      return {
        nodes: branches.map((branch) => ({
          id: branch.id,
          label: branch.name,
          summary: branch.summary,
          tags: branch.tags,
          status: branch.status,
          message_count: store.messagesByBranchId.get(branch.id)?.length ?? 0,
          is_collapsed: branch.is_collapsed,
          parent_branch_id: branch.parent_branch_id,
          merged_parent_branch_ids: branch.merged_parent_branch_ids,
        })),
        edges: branches.flatMap((branch) =>
          (branch.merged_parent_branch_ids ?? [branch.parent_branch_id])
            .filter(Boolean)
            .map((parentBranchId) => ({
              source: parentBranchId,
              target: branch.id,
              fork_from_message_id: branch.fork_from_message_id,
              is_merge: Boolean(branch.merged_parent_branch_ids),
            })),
        ),
      }
    },
    async getBranchMessages(branchId, includeInherited = true) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch_id가 존재하지 않는다.')
      }

      if (!includeInherited) {
        return [...(store.messagesByBranchId.get(branchId) ?? [])]
      }

      return getInheritedMessages(store, branchId)
    },
    async sendChatMessage({ branchId, message, modelProvider = 'openai', modelName = 'gpt-4o-mini' }) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch_id가 존재하지 않는다.')
      }

      if (branch.status !== 'active') {
        throw new Error('비활성 또는 삭제된 브랜치에는 메시지를 보낼 수 없다.')
      }

      const userMessage = createApiMessage({
        branch,
        role: 'user',
        content: message,
        modelProvider,
        modelName,
      })
      const assistantMessage = createApiMessage({
        branch,
        role: 'assistant',
        content: createMockLlmResponse(message, branch.name),
        modelProvider,
        modelName,
      })
      const branchMessages = store.messagesByBranchId.get(branchId) ?? []

      store.messagesByBranchId.set(branchId, [...branchMessages, userMessage, assistantMessage])

      return {
        reply: assistantMessage.content,
        user_message: userMessage,
        assistant_message: assistantMessage,
      }
    },
    async createBranch({ sessionId, parentBranchId, forkFromMessageId, name }) {
      await delay()
      const parentBranch = store.branches.get(parentBranchId)

      if (!store.sessions.some((session) => session.id === sessionId)) {
        throw new Error('session_id가 존재하지 않는다.')
      }

      if (!parentBranch || parentBranch.session_id !== sessionId) {
        throw new Error('parent_branch_id가 해당 session에 속하지 않는다.')
      }

      const parentMessages = store.messagesByBranchId.get(parentBranchId) ?? []
      const forkMessage = parentMessages.find((message) => String(message.id) === String(forkFromMessageId))

      if (!forkMessage) {
        throw new Error('fork_from_message_id가 parent branch의 메시지가 아니다.')
      }

      const createdAt = new Date().toISOString()
      const branchId = `mock-branch-${Date.now()}`
      const branch = {
        id: branchId,
        session_id: sessionId,
        parent_branch_id: parentBranchId,
        fork_from_message_id: forkFromMessageId,
        name: name ?? `분기: ${forkMessage.content.slice(0, 16)}`,
        tags: ['새 분기', '대화'],
        status: 'active',
        is_collapsed: false,
        created_at: createdAt,
        updated_at: createdAt,
      }

      store.branches.set(branchId, branch)
      store.messagesByBranchId.set(branchId, [])

      return branch
    },
    async mergeBranches({ sessionId, branchIds, name }) {
      await delay()
      const uniqueBranchIds = [...new Set(branchIds)]
      const sourceBranches = uniqueBranchIds.map((branchId) => store.branches.get(branchId))

      if (uniqueBranchIds.length !== 2 || sourceBranches.some((branch) => !branch)) {
        throw new Error('합칠 두 브랜치를 선택해야 한다.')
      }

      if (sourceBranches.some((branch) => branch.session_id !== sessionId)) {
        throw new Error('같은 세션의 브랜치만 합칠 수 있다.')
      }

      if (areBranchesOnSameShortestRootPath(store, uniqueBranchIds[0], uniqueBranchIds[1])) {
        throw new Error('같은 가지에 있는 브랜치는 합칠 수 없다.')
      }

      const createdAt = new Date().toISOString()
      const branchId = `mock-merge-${Date.now()}`
      const branch = {
        id: branchId,
        session_id: sessionId,
        parent_branch_id: uniqueBranchIds[0],
        merged_parent_branch_ids: uniqueBranchIds,
        fork_from_message_id: null,
        name: name?.trim() || `병합: ${sourceBranches.map((branch) => branch.name).join(' + ')}`,
        tags: ['병합', '대화 흐름'],
        status: 'active',
        is_collapsed: false,
        created_at: createdAt,
        updated_at: createdAt,
      }

      store.branches.set(branchId, branch)
      store.messagesByBranchId.set(branchId, [
        createApiMessage({
          branch,
          role: 'system',
          content: `internal merge prompt: ${uniqueBranchIds.join(', ')}`,
          modelProvider: 'mock',
          modelName: 'mock-llm',
          status: 'hidden',
          kind: 'merge_internal',
          metadata: { hidden_from_user: true },
        }),
        createApiMessage({
          branch,
          role: 'assistant',
          content: createMergedResponseContent(sourceBranches, store),
          modelProvider: 'mock',
          modelName: 'mock-llm',
          kind: 'merge_result',
        }),
      ])

      return branch
    },
    async updateBranch(branchId, patch) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch_id가 존재하지 않는다.')
      }

      if (!branch.parent_branch_id && patch.status === 'inactive') {
        throw new Error('root branch는 inactive로 변경할 수 없다.')
      }

      const updatedBranch = {
        ...branch,
        name: patch.name?.trim() || branch.name,
        status: patch.status ?? branch.status,
        is_collapsed: patch.is_collapsed ?? branch.is_collapsed,
        updated_at: new Date().toISOString(),
      }

      store.branches.set(branchId, updatedBranch)

      return updatedBranch
    },
    async deleteBranch(branchId) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch_id가 존재하지 않는다.')
      }

      collectBranchIds(store, branchId).forEach((id) => {
        store.branches.delete(id)
        store.messagesByBranchId.delete(id)
      })
      if (!branch.parent_branch_id) {
        store.sessions = store.sessions.filter((session) => session.id !== branch.session_id)
      }

      return null
    },
  }
}

function collectBranchIds(store, branchId) {
  const ids = [branchId]

  for (let index = 0; index < ids.length; index += 1) {
    const parentId = ids[index]
    Array.from(store.branches.values())
      .filter((branch) =>
        branch.parent_branch_id === parentId || branch.merged_parent_branch_ids?.includes(parentId),
      )
      .forEach((branch) => {
        if (!ids.includes(branch.id)) {
          ids.push(branch.id)
        }
      })
  }

  return ids
}

function areBranchesOnSameShortestRootPath(store, firstBranchId, secondBranchId) {
  if (!firstBranchId || !secondBranchId || firstBranchId === secondBranchId) {
    return true
  }

  const firstPathIds = new Set(getShortestBranchIdPath(store, firstBranchId))
  const secondPathIds = new Set(getShortestBranchIdPath(store, secondBranchId))

  return firstPathIds.has(secondBranchId) || secondPathIds.has(firstBranchId)
}

function getShortestBranchIdPath(store, branchId) {
  const branch = store.branches.get(branchId)

  if (!branch) {
    return []
  }

  const queue = [{ branch, path: [branch.id] }]
  const visitedBranchIds = new Set()

  while (queue.length > 0) {
    const { branch: currentBranch, path } = queue.shift()

    if (visitedBranchIds.has(currentBranch.id)) {
      continue
    }

    visitedBranchIds.add(currentBranch.id)
    const parentBranches = getParentBranchIds(currentBranch)
      .map((parentBranchId) => store.branches.get(parentBranchId))
      .filter(Boolean)

    if (parentBranches.length === 0) {
      return [...path].reverse()
    }

    parentBranches.forEach((parentBranch) => {
      queue.push({ branch: parentBranch, path: [...path, parentBranch.id] })
    })
  }

  return []
}

function getParentBranchIds(branch) {
  return [
    ...new Set([branch.parent_branch_id, ...(branch.merged_parent_branch_ids ?? [])].filter(Boolean)),
  ]
}

function createMockStore() {
  const initialState = createInitialGraphState()
  const rootNodes = initialState.nodes.filter((node) => node.parentId === null)
  const apiSessionIdByRootId = new Map(
    rootNodes.map((node) => [
      node.id,
      `mock-session-${node.id}`,
    ]),
  )
  let sessions = rootNodes.map((node) => ({
    id: apiSessionIdByRootId.get(node.id),
    title: node.title,
    main_branch_id: node.id,
    created_at: createIsoDate(node.createdAt),
    updated_at: createIsoDate(node.createdAt),
  }))
  const branches = new Map(
    initialState.nodes.map((node) => [
      node.id,
      {
        id: node.id,
        session_id: apiSessionIdByRootId.get(node.rootId),
        parent_branch_id: node.parentId,
        fork_from_message_id: node.parentMessageId,
        name: node.title,
        summary: node.description,
        tags: createMockTags(node),
        status: node.isActive ? 'active' : 'inactive',
        is_collapsed: node.isHidden,
        created_at: createIsoDate(node.createdAt),
        updated_at: createIsoDate(node.createdAt),
      },
    ]),
  )
  const messagesByBranchId = new Map(
    initialState.sessions.map((session) => {
      const branch = branches.get(session.nodeId)

      return [
        session.nodeId,
        session.messages.map((message) => ({
          id: message.id,
          session_id: branch.session_id,
          branch_id: branch.id,
          parent_id: null,
          role: message.role,
          content: message.content,
          model_provider: 'mock',
          model_name: 'mock-llm',
          status: 'active',
          created_at: createIsoDate(message.createdAt),
        })),
      ]
    }),
  )

  return {
    sessions,
    branches,
    messagesByBranchId,
    messageSequence: 1000,
  }
}

function createMockTags(node) {
  const tagsByNodeId = {
    'root-learning': ['LLM', '학습 전략'],
    'learning-context': ['컨텍스트', '대화 관리', '핵심'],
    'learning-example': ['예시', '비교'],
    'learning-side-question': ['용어', '질문'],
    'root-project': ['프로젝트', '기획'],
    'project-user-flow': ['UX', '사용자 흐름'],
    'project-graph-policy': ['그래프', '정책'],
    'project-api': ['API', '백엔드 연동'],
    'project-test': ['테스트', '검증'],
    'project-metrics': ['지표', '분석'],
    'project-ui': ['UI', '컴포넌트'],
    'project-rollout': ['배포', '적용 순서'],
  }

  return tagsByNodeId[node.id] ?? ['대화', node.parentId ? '분기' : '메인']
}

function createMergedResponseContent(sourceBranches, store) {
  const branchSummaries = sourceBranches.map((branch) => {
    const messages = store.messagesByBranchId.get(branch.id) ?? []
    const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')
    const summary = latestAssistantMessage?.content ?? branch.summary ?? '요약 가능한 메시지가 아직 없다.'

    return {
      name: branch.name,
      summary: stripMarkdown(summary).slice(0, 96),
    }
  })

  return `## 병합 결과

선택한 두 노드의 내용을 하나의 후속 흐름으로 정리했다. 내부 병합 프롬프트는 사용자 화면에 표시하지 않고, 아래 요약만 노출한다.

| 원본 노드 | 반영 내용 |
| --- | --- |
${branchSummaries.map((branch) => `| ${branch.name} | ${branch.summary} |`).join('\n')}

### 정리된 다음 단계

- 두 흐름에서 겹치는 목표를 하나의 실행 기준으로 묶었다.
- 서로 다른 판단 기준은 분리해서 유지하되, 현재 병합 노드에서 함께 검토할 수 있게 했다.
- 이후 질문은 이 병합 노드에서 이어가면 두 원본 노드의 맥락을 기준으로 답변을 확장할 수 있다.`
}

function stripMarkdown(value) {
  return String(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`|_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getBranchesBySession(store, sessionId) {
  return Array.from(store.branches.values()).filter((branch) => branch.session_id === sessionId)
}

function getInheritedMessages(store, branchId) {
  const branchChain = getBranchChain(store, branchId)

  return branchChain.flatMap((branch, index) => {
    const messages = store.messagesByBranchId.get(branch.id) ?? []
    const nextBranch = branchChain[index + 1]

    if (!nextBranch) {
      return messages
    }

    const forkMessageIndex = messages.findIndex(
      (message) => String(message.id) === String(nextBranch.fork_from_message_id),
    )

    return forkMessageIndex >= 0 ? messages.slice(0, forkMessageIndex + 1) : messages
  })
}

function getBranchChain(store, branchId) {
  const chain = []
  let branch = store.branches.get(branchId)

  while (branch) {
    chain.unshift(branch)
    branch = branch.parent_branch_id ? store.branches.get(branch.parent_branch_id) : null
  }

  return chain
}

function createApiMessage({
  branch,
  role,
  content,
  modelProvider,
  modelName,
  status = 'active',
  kind = '',
  metadata = {},
}) {
  return {
    id: `mock-message-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    session_id: branch.session_id,
    branch_id: branch.id,
    parent_id: null,
    role,
    content,
    model_provider: modelProvider,
    model_name: modelName,
    status,
    kind,
    metadata,
    created_at: new Date().toISOString(),
  }
}

function createIsoDate(time) {
  const [hour = '0', minute = '0'] = String(time).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)

  return date.toISOString()
}

function delay(ms = 140) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
