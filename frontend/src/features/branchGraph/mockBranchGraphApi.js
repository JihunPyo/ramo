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
          status: branch.status,
          message_count: store.messagesByBranchId.get(branch.id)?.length ?? 0,
          is_collapsed: branch.is_collapsed,
        })),
        edges: branches
          .filter((branch) => branch.parent_branch_id)
          .map((branch) => ({
            source: branch.parent_branch_id,
            target: branch.id,
            fork_from_message_id: branch.fork_from_message_id,
          })),
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
        status: 'active',
        is_collapsed: false,
        created_at: createdAt,
        updated_at: createdAt,
      }

      store.branches.set(branchId, branch)
      store.messagesByBranchId.set(branchId, [])

      return branch
    },
    async updateBranch(branchId, patch) {
      await delay()
      const branch = store.branches.get(branchId)

      if (!branch) {
        throw new Error('branch_id가 존재하지 않는다.')
      }

      if (!branch.parent_branch_id && ['inactive', 'deleted'].includes(patch.status)) {
        throw new Error('root branch는 inactive 또는 deleted로 변경할 수 없다.')
      }

      const updatedBranch = {
        ...branch,
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

      if (!branch.parent_branch_id) {
        throw new Error('root branch는 영구 삭제할 수 없다.')
      }

      collectBranchIds(store, branchId).forEach((id) => {
        store.branches.delete(id)
        store.messagesByBranchId.delete(id)
      })

      return null
    },
  }
}

function collectBranchIds(store, branchId) {
  const ids = [branchId]

  for (let index = 0; index < ids.length; index += 1) {
    const parentId = ids[index]
    Array.from(store.branches.values())
      .filter((branch) => branch.parent_branch_id === parentId)
      .forEach((branch) => ids.push(branch.id))
  }

  return ids
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
  const sessions = rootNodes.map((node) => ({
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

function createApiMessage({ branch, role, content, modelProvider, modelName }) {
  return {
    id: `mock-message-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    session_id: branch.session_id,
    branch_id: branch.id,
    parent_id: null,
    role,
    content,
    model_provider: modelProvider,
    model_name: modelName,
    status: 'active',
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
