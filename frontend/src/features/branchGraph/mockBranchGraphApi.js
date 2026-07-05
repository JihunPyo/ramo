import { createInitialGraphState } from './mockData.js'
import { createMockLlmResponse } from './mockLlmProvider.js'
import { getPersonaOption, readPersonaSlug } from '../personas/personaOptions.js'

export function createMockBranchGraphApi() {
  const store = createMockStore()

  return {
    async listSessions() {
      await delay()
      return store.sessions.filter((session) => session.status !== 'deleted')
    },
    async getHome() {
      await delay()
      return {
        title: 'GET /home',
        message: 'GET /home 응답이 도착했습니다.',
      }
    },
    async getEgg() {
      await delay()
      return {
        title: 'GET /egg',
        message: 'GET /egg 응답이 도착했습니다.',
      }
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
        status: 'active',
        deleted_at: null,
        created_at: createdAt,
        updated_at: createdAt,
      }
      const branch = {
        id: branchId,
        session_id: sessionId,
        parent_branch_id: null,
        fork_from_message_id: null,
        name: title,
        description: null,
        tags: ['새 대화', '메인'],
        status: 'active',
        is_collapsed: false,
        is_merge: false,
        is_main: true,
        merge_parent_ids: [],
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
    async deleteSession(sessionId) {
      await delay()
      const sessionIndex = store.sessions.findIndex((session) => session.id === sessionId)

      if (sessionIndex < 0) {
        throw new Error('session_id가 존재하지 않습니다.')
      }

      const now = new Date().toISOString()
      store.sessions[sessionIndex] = {
        ...store.sessions[sessionIndex],
        status: 'deleted',
        deleted_at: now,
        updated_at: now,
      }

      return null
    },
    async listTrashSessions() {
      await delay()
      return store.sessions.filter((session) => session.status === 'deleted')
    },
    async restoreSession(sessionId) {
      await delay()
      const sessionIndex = store.sessions.findIndex((session) => session.id === sessionId)

      if (sessionIndex < 0 || store.sessions[sessionIndex].status !== 'deleted') {
        throw new Error('휴지통에서 해당 session을 찾을 수 없습니다.')
      }

      const restoredSession = {
        ...store.sessions[sessionIndex],
        status: 'active',
        deleted_at: null,
        updated_at: new Date().toISOString(),
      }

      store.sessions[sessionIndex] = restoredSession

      return restoredSession
    },
    async purgeSession(sessionId) {
      await delay()
      const session = store.sessions.find((candidate) => candidate.id === sessionId)

      if (!session) {
        throw new Error('session_id가 존재하지 않습니다.')
      }

      getBranchesBySession(store, sessionId).forEach((branch) => {
        store.branches.delete(branch.id)
        store.messagesByBranchId.delete(branch.id)
        store.filesByBranchId.delete(branch.id)
      })
      store.sessions = store.sessions.filter((candidate) => candidate.id !== sessionId)
      store.filesBySessionId.delete(sessionId)

      return null
    },
    async listBranches(sessionId) {
      await delay()
      return getBranchesBySession(store, sessionId)
    },
    async listBranchTrash(sessionId) {
      await delay()
      return getBranchesBySession(store, sessionId)
        .filter((branch) => branch.status === 'deleted')
        .map((branch) => ({
          id: branch.id,
          name: branch.name,
          session_id: branch.session_id,
          deleted_at: branch.deleted_at,
        }))
    },
    async getSessionGraph(sessionId, includeInactive = true) {
      await delay()
      const branches = getBranchesBySession(store, sessionId).filter((branch) => {
        return includeInactive || branch.status !== 'deleted'
      })

      return {
        nodes: branches.map((branch) => ({
          id: branch.id,
          label: branch.name,
          description: branch.description,
          summary: branch.summary,
          tags: branch.tags,
          status: branch.status,
          message_count: store.messagesByBranchId.get(branch.id)?.length ?? 0,
          is_collapsed: branch.is_collapsed,
          is_merge: branch.is_merge,
          is_main: branch.is_main,
          parent_branch_id: branch.parent_branch_id,
          merge_parent_ids: branch.merge_parent_ids,
          persona_key: branch.persona_key,
          persona_slug: branch.persona_slug,
          persona_name: branch.persona_name,
        })),
        edges: branches.flatMap((branch) =>
          (branch.merge_parent_ids?.length ? branch.merge_parent_ids : [branch.parent_branch_id])
            .filter(Boolean)
            .map((parentBranchId) => ({
              id: `${branch.is_merge ? 'merge' : 'edge'}-${branch.id}-${parentBranchId}`,
              source: parentBranchId,
              target: branch.id,
              type: branch.is_merge ? 'merge' : 'fork',
              fork_from_message_id: branch.fork_from_message_id,
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
        return withMockMessageAttachments(store, [...(store.messagesByBranchId.get(branchId) ?? [])])
      }

      return withMockMessageAttachments(store, getInheritedMessages(store, branchId))
    },
    async sendChatMessage({
      branchId,
      message,
      modelProvider = 'openai',
      modelName = 'gpt-4o-mini',
      personaKey = '',
      personaName = '',
      fileIds = [],
    }) {
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
        metadata: {
          persona: {
            key: personaKey,
            name: personaName,
          },
        },
      })
      const branchMessages = store.messagesByBranchId.get(branchId) ?? []
      const attachments = attachMockFilesToMessage(store, branchId, fileIds, userMessage.id)

      userMessage.attachments = attachments

      store.messagesByBranchId.set(branchId, [...branchMessages, userMessage, assistantMessage])

      return {
        reply: assistantMessage.content,
        user_message: userMessage,
        assistant_message: assistantMessage,
      }
    },
    async compareModels({ branchId, message, modelA, modelB }) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch || branch.status !== 'active') {
        throw new Error('활성 브랜치에서만 모델 답변을 비교할 수 있다.')
      }

      const comparisonId = `mock-comparison-${Date.now()}`
      const responseA = createMockComparisonContent(message, modelA, 'A')
      const responseB = createMockComparisonContent(message, modelB, 'B')

      store.comparisons.set(comparisonId, {
        id: comparisonId,
        branchId,
        message,
        modelA,
        modelB,
        responseA,
        responseB,
        status: 'pending',
      })

      return {
        comparison_id: comparisonId,
        response_a: { content: responseA, provider: modelA.provider, name: modelA.name },
        response_b: { content: responseB, provider: modelB.provider, name: modelB.name },
      }
    },
    async analyzeComparison(comparisonId) {
      await delay()
      const comparison = getPendingComparison(store, comparisonId, false)

      return {
        comparison_id: comparisonId,
        similarities: '- 두 답변 모두 질문의 핵심 목표를 먼저 정리합니다.\n- 실행 가능한 다음 단계를 제안합니다.',
        differences: `- ${comparison.modelA.name}은 구조와 우선순위를 강조합니다.\n- ${comparison.modelB.name}은 예시와 대안의 폭을 더 넓게 다룹니다.`,
      }
    },
    async selectComparison(comparisonId, selected) {
      await delay()
      const comparison = getPendingComparison(store, comparisonId)
      const isA = selected === 'a'
      const model = isA ? comparison.modelA : comparison.modelB
      const content = isA ? comparison.responseA : comparison.responseB
      const assistantMessage = saveComparisonMessages(store, comparison, content, model)

      comparison.status = 'done'
      return { message_id: assistantMessage.id, branch_id: comparison.branchId, content }
    },
    async mergeComparison(comparisonId, { instruction, modelProvider, modelName }) {
      await delay()
      const comparison = getPendingComparison(store, comparisonId)
      const content = `## 융합 답변\n\n${instruction}\n\n두 모델의 공통 결론을 유지하면서, A의 구조적인 판단과 B의 구체적인 예시를 하나의 실행안으로 정리했습니다.`
      const assistantMessage = saveComparisonMessages(
        store,
        comparison,
        content,
        { provider: modelProvider, name: modelName },
      )

      comparison.status = 'done'
      return { comparison_id: comparisonId, merged_content: content, message_id: assistantMessage.id }
    },
    async createBranch({ sessionId, parentBranchId, forkFromMessageId, name, persona }) {
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
      const personaSlug = readPersonaSlug(persona)
      const personaOption = getPersonaOption(persona?.key ?? personaSlug)
      const branch = {
        id: branchId,
        session_id: sessionId,
        parent_branch_id: parentBranchId,
        fork_from_message_id: forkFromMessageId,
        name: name ?? `분기: ${forkMessage.content.slice(0, 16)}`,
        description: null,
        tags: ['새 분기', '대화'],
        status: 'active',
        is_collapsed: false,
        is_merge: false,
        is_main: false,
        merge_parent_ids: [],
        persona_key: personaOption?.key ?? '',
        persona_slug: personaSlug,
        persona_name: personaOption?.name ?? '',
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
        parent_branch_id: null,
        merge_parent_ids: uniqueBranchIds,
        fork_from_message_id: null,
        name: name?.trim() || `병합: ${sourceBranches.map((branch) => branch.name).join(' + ')}`,
        description: null,
        tags: ['병합', '대화 흐름'],
        status: 'active',
        is_collapsed: false,
        is_merge: true,
        is_main: false,
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
    async describeBranch(branchId) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch_id가 존재하지 않는다.')
      }

      const messages = (store.messagesByBranchId.get(branchId) ?? [])
        .filter((message) => message.status !== 'hidden' && message.role !== 'system')

      if (messages.length === 0) {
        return { branch_id: branchId, description: null }
      }

      const latestMessage = messages[messages.length - 1]
      const description = stripMarkdown(latestMessage.content).slice(0, 120)
      store.branches.set(branchId, {
        ...branch,
        description,
        updated_at: new Date().toISOString(),
      })

      return { branch_id: branchId, description }
    },
    async getMergeCandidates(branchId) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch를 찾을 수 없습니다.')
      }

      const sourceTags = new Set((branch.tags ?? []).map((tag) => tag.name ?? tag))
      const candidates = Array.from(store.branches.values())
        .filter((candidate) => (
          candidate.id !== branchId &&
          candidate.session_id === branch.session_id &&
          candidate.status === 'active' &&
          !areBranchesOnSameShortestRootPath(store, branchId, candidate.id)
        ))
        .map((candidate, index) => {
          const sharedTags = (candidate.tags ?? [])
            .map((tag) => tag.name ?? tag)
            .filter((tag) => sourceTags.has(tag))

          return {
            branch_id: candidate.id,
            name: candidate.name,
            reasons: [
              { type: 'content', score: Math.max(0.76, 0.88 - index * 0.03) },
              ...(sharedTags.length > 0 ? [{ type: 'role', tags: sharedTags }] : []),
            ],
          }
        })

      return { branch_id: branchId, candidates }
    },
    async selectMainBranch(branchId) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch를 찾을 수 없습니다.')
      }

      const mainBranchIds = getBranchChain(store, branchId).map((candidate) => candidate.id)

      Array.from(store.branches.values())
        .filter((candidate) => candidate.session_id === branch.session_id)
        .forEach((candidate) => {
          store.branches.set(candidate.id, {
            ...candidate,
            is_main: mainBranchIds.includes(candidate.id),
          })
        })

      return {
        branch_id: branchId,
        main_branch_ids: mainBranchIds,
      }
    },
    async setBranchPersona(branchId, persona) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch_id가 존재하지 않는다.')
      }

      const personaSlug = readPersonaSlug(persona)
      const personaOption = getPersonaOption(persona?.key ?? personaSlug)
      const updatedBranch = {
        ...branch,
        persona_key: personaOption?.key ?? '',
        persona_slug: personaSlug,
        persona_name: personaOption?.name ?? '',
        updated_at: new Date().toISOString(),
      }

      store.branches.set(branchId, updatedBranch)
      return updatedBranch
    },
    async clearBranchPersona(branchId) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch_id가 존재하지 않는다.')
      }

      const updatedBranch = {
        ...branch,
        persona_key: null,
        persona_slug: null,
        persona_name: null,
        updated_at: new Date().toISOString(),
      }

      store.branches.set(branchId, updatedBranch)
      return updatedBranch
    },
    async updateBranch(branchId, patch) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch_id가 존재하지 않는다.')
      }

      if (!branch.parent_branch_id && !branch.is_merge && ['inactive', 'deleted'].includes(patch.status)) {
        throw new Error('root branch는 비활성화하거나 삭제할 수 없다.')
      }

      if (patch.status === 'deleted') {
        const deletedAt = new Date().toISOString()

        collectBranchIds(store, branchId).forEach((id) => {
          const targetBranch = store.branches.get(id)

          if (targetBranch) {
            store.branches.set(id, {
              ...targetBranch,
              status: 'deleted',
              deleted_at: deletedAt,
              updated_at: deletedAt,
            })
          }
        })

        return store.branches.get(branchId)
      }

      const updatedBranch = {
        ...branch,
        name: patch.name?.trim() || branch.name,
        status: patch.status ?? branch.status,
        deleted_at: patch.status === 'active' ? null : branch.deleted_at,
        is_collapsed: patch.is_collapsed ?? branch.is_collapsed,
        persona_key: patch.persona_key === undefined ? branch.persona_key : patch.persona_key,
        persona_name: patch.persona_name === undefined ? branch.persona_name : patch.persona_name,
        updated_at: new Date().toISOString(),
      }

      store.branches.set(branchId, updatedBranch)

      return updatedBranch
    },
    async restoreBranch(branchId) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch || branch.status !== 'deleted') {
        throw new Error('휴지통에서 해당 branch를 찾을 수 없습니다.')
      }

      const restoredBranch = {
        ...branch,
        status: 'active',
        deleted_at: null,
        updated_at: new Date().toISOString(),
      }

      store.branches.set(branchId, restoredBranch)

      return restoredBranch
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
        store.filesByBranchId.delete(id)
      })
      if (!branch.parent_branch_id && !branch.is_merge) {
        store.sessions = store.sessions.filter((session) => session.id !== branch.session_id)
        store.filesBySessionId.delete(branch.session_id)
      }

      return null
    },
    async uploadBranchFile(branchId, file, { modelProvider = 'openai', modelName = 'gpt-4o-mini' } = {}) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch_id가 존재하지 않는다.')
      }

      const uploadedFile = createMockUploadedFile({
        file,
        sessionId: branch.session_id,
        branchId,
        modelProvider,
        modelName,
      })
      const currentFiles = store.filesByBranchId.get(branchId) ?? []

      store.filesByBranchId.set(branchId, [...currentFiles, uploadedFile])

      return uploadedFile
    },
    async uploadSessionFile(sessionId, file, { modelProvider = 'openai', modelName = 'gpt-4o-mini' } = {}) {
      await delay()

      if (!store.sessions.some((session) => session.id === sessionId)) {
        throw new Error('session_id가 존재하지 않는다.')
      }

      const uploadedFile = createMockUploadedFile({
        file,
        sessionId,
        branchId: null,
        modelProvider,
        modelName,
      })
      const currentFiles = store.filesBySessionId.get(sessionId) ?? []

      store.filesBySessionId.set(sessionId, [...currentFiles, uploadedFile])

      return uploadedFile
    },
    async listBranchFiles(branchId) {
      await delay()
      return [...(store.filesByBranchId.get(branchId) ?? [])]
    },
    async listSessionFiles(sessionId) {
      await delay()
      return [...(store.filesBySessionId.get(sessionId) ?? [])]
    },
    async deleteFile(fileId) {
      await delay()
      const wasDeletedFromBranch = deleteFileFromStoreMap(store.filesByBranchId, fileId)
      const wasDeletedFromSession = deleteFileFromStoreMap(store.filesBySessionId, fileId)

      if (!wasDeletedFromBranch && !wasDeletedFromSession) {
        throw new Error('파일을 찾을 수 없습니다.')
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
        branch.parent_branch_id === parentId || branch.merge_parent_ids?.includes(parentId),
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
    ...new Set([branch.parent_branch_id, ...(branch.merge_parent_ids ?? [])].filter(Boolean)),
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
    status: 'active',
    deleted_at: null,
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
        description: node.description,
        tags: createMockTags(node),
        status: node.isActive ? 'active' : 'inactive',
        deleted_at: null,
        is_collapsed: node.isHidden,
        is_merge: node.parentIds?.length > 1,
        is_main: false,
        merge_parent_ids: node.parentIds?.length > 1 ? node.parentIds : [],
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
    filesByBranchId: new Map(),
    filesBySessionId: new Map(),
    comparisons: new Map(),
    messageSequence: 1000,
  }
}

function createMockUploadedFile({ file, sessionId, branchId, modelProvider, modelName }) {
  const filename = file?.name || '첨부 파일'
  const mimeType = file?.type || inferMockMimeType(filename)
  const isImage = mimeType.startsWith('image/')

  return {
    id: `mock-file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    session_id: sessionId,
    branch_id: branchId,
    message_id: null,
    filename,
    summary: createMockFileSummary(file, modelProvider, modelName),
    file_type: isImage ? 'image' : 'text',
    mime_type: mimeType,
    content_url: isImage && typeof URL !== 'undefined' ? URL.createObjectURL(file) : null,
    created_at: new Date().toISOString(),
  }
}

function inferMockMimeType(filename) {
  const extension = String(filename).split('.').pop()?.toLowerCase()

  if (extension === 'png') {
    return 'image/png'
  }

  if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg'
  }

  if (extension === 'webp') {
    return 'image/webp'
  }

  if (extension === 'gif') {
    return 'image/gif'
  }

  if (extension === 'pdf') {
    return 'application/pdf'
  }

  return 'application/octet-stream'
}

function createMockFileSummary(file, modelProvider, modelName) {
  const filename = file?.name || '첨부 파일'
  const sizeLabel = formatFileSize(file?.size ?? 0)

  if (file?.type?.startsWith('image/')) {
    return `${filename} 이미지 파일을 첨부했다. mock 환경에서는 이미지 내용 분석 대신 파일 메타데이터만 표시한다. (${sizeLabel}, ${modelProvider}/${modelName})`
  }

  return `${filename} 파일을 첨부했다. mock 환경에서는 실제 텍스트 추출 대신 파일 메타데이터만 표시한다. (${sizeLabel}, ${modelProvider}/${modelName})`
}

function attachMockFilesToMessage(store, branchId, fileIds, messageId) {
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return []
  }

  const fileIdSet = new Set(fileIds)
  const branchFiles = store.filesByBranchId.get(branchId) ?? []
  const attachments = branchFiles.filter((file) => fileIdSet.has(file.id))

  attachments.forEach((file) => {
    file.message_id = messageId
  })

  return attachments
}

function withMockMessageAttachments(store, messages) {
  return messages.map((message) => ({
    ...message,
    attachments: getMockMessageAttachments(store, message.id),
  }))
}

function getMockMessageAttachments(store, messageId) {
  return Array.from(store.filesByBranchId.values())
    .flatMap((files) => files)
    .filter((file) => file.message_id === messageId)
}

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function deleteFileFromStoreMap(filesByOwnerId, fileId) {
  let wasDeleted = false

  filesByOwnerId.forEach((files, ownerId) => {
    const nextFiles = files.filter((file) => file.id !== fileId)

    if (nextFiles.length !== files.length) {
      wasDeleted = true
      filesByOwnerId.set(ownerId, nextFiles)
    }
  })

  return wasDeleted
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

function createMockComparisonContent(message, model, answerLabel) {
  return `## ${model.name}의 답변 ${answerLabel}\n\n**질문:** ${message}\n\n- 핵심 목표를 먼저 정리합니다.\n- ${answerLabel === 'A' ? '우선순위와 실행 단계를 구조적으로 제안합니다.' : '구체적인 예시와 대안을 중심으로 설명합니다.'}\n- 마지막에는 바로 적용할 수 있는 다음 행동을 제시합니다.`
}

function getPendingComparison(store, comparisonId, requirePending = true) {
  const comparison = store.comparisons.get(comparisonId)

  if (!comparison) {
    throw new Error('comparison을 찾을 수 없습니다.')
  }

  if (requirePending && comparison.status !== 'pending') {
    throw new Error('이미 완료된 comparison입니다.')
  }

  return comparison
}

function saveComparisonMessages(store, comparison, content, model) {
  const branch = store.branches.get(comparison.branchId)
  const messages = store.messagesByBranchId.get(comparison.branchId) ?? []
  const userMessage = createApiMessage({
    branch,
    role: 'user',
    content: comparison.message,
    modelProvider: model.provider,
    modelName: model.name,
  })
  const assistantMessage = createApiMessage({
    branch,
    role: 'assistant',
    content,
    modelProvider: model.provider,
    modelName: model.name,
  })

  store.messagesByBranchId.set(comparison.branchId, [...messages, userMessage, assistantMessage])
  return assistantMessage
}

function getBranchesBySession(store, sessionId) {
  return Array.from(store.branches.values()).filter((branch) => branch.session_id === sessionId)
}

function getInheritedMessages(store, branchId) {
  const targetBranch = store.branches.get(branchId)

  if (targetBranch?.merge_parent_ids?.length > 1) {
    return getMergeInheritedMessages(store, targetBranch)
  }

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

function getMergeInheritedMessages(store, mergeBranch) {
  const inheritedMessages = []
  const inheritedBranchIds = new Set()

  mergeBranch.merge_parent_ids.forEach((sourceBranchId) => {
    const sourceChain = getBranchChain(store, sourceBranchId)

    sourceChain.slice(0, -1).forEach((branch, index) => {
      if (inheritedBranchIds.has(branch.id)) {
        return
      }

      inheritedBranchIds.add(branch.id)
      inheritedMessages.push(...getInheritedBranchMessages(store, sourceChain, index))
    })
  })

  return [
    ...inheritedMessages,
    ...(store.messagesByBranchId.get(mergeBranch.id) ?? []),
  ]
}

function getInheritedBranchMessages(store, branchChain, index) {
  const branch = branchChain[index]
  const messages = store.messagesByBranchId.get(branch.id) ?? []
  const nextBranch = branchChain[index + 1]

  if (!nextBranch) {
    return messages
  }

  const forkMessageIndex = messages.findIndex(
    (message) => String(message.id) === String(nextBranch.fork_from_message_id),
  )

  return forkMessageIndex >= 0 ? messages.slice(0, forkMessageIndex + 1) : messages
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
