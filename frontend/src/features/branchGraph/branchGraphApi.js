import { httpClient } from '../../lib/apiClient.js'
import { createMockBranchGraphApi } from './mockBranchGraphApi.js'

export function createHttpBranchGraphApi(client = httpClient) {
  return {
    listSessions() {
      return client.request('/sessions')
    },
    createSession(title) {
      return client.request('/sessions', {
        method: 'POST',
        body: title ? { title } : {},
      })
    },
    updateSession(sessionId, patch) {
      return client.request(`/sessions/${sessionId}/title`, {
        method: 'PATCH',
        body: {
          title: patch.title,
        },
      })
    },
    deleteSession(sessionId) {
      return client.request(`/sessions/${sessionId}`, {
        method: 'DELETE',
      })
    },
    listTrashSessions() {
      return client.request('/trash')
    },
    restoreSession(sessionId) {
      return client.request(`/trash/${sessionId}/restore`, {
        method: 'POST',
      })
    },
    purgeSession(sessionId) {
      return client.request(`/trash/${sessionId}`, {
        method: 'DELETE',
      })
    },
    listBranches(sessionId) {
      return client.request(`/sessions/${sessionId}/branches`)
    },
    listBranchTrash(sessionId) {
      return client.request(`/sessions/${sessionId}/branch-trash`)
    },
    getSessionGraph(sessionId, includeInactive = true) {
      return client.request(`/sessions/${sessionId}/graph`, {
        query: {
          include_inactive: includeInactive,
        },
      })
    },
    getBranchMessages(branchId, includeInherited = true) {
      return client.request(`/branches/${branchId}/messages`, {
        query: {
          include_inherited: includeInherited,
        },
      })
    },
    sendChatMessage({ branchId, message, modelProvider = 'openai', modelName = 'gpt-4o-mini' }) {
      return client.request('/chat', {
        method: 'POST',
        body: {
          branch_id: branchId,
          message,
          model_provider: modelProvider,
          model_name: modelName,
        },
      })
    },
    createBranch({ sessionId, parentBranchId, forkFromMessageId, name }) {
      return client.request('/branches', {
        method: 'POST',
        body: {
          session_id: sessionId,
          parent_branch_id: parentBranchId,
          fork_from_message_id: forkFromMessageId,
          ...(name ? { name } : {}),
        },
      })
    },
    mergeBranches({ sessionId, branchIds, name }) {
      return client.request('/branches/merge', {
        method: 'POST',
        body: {
          session_id: sessionId,
          parent_branch_ids: branchIds,
          ...(name ? { name } : {}),
        },
      })
    },
    selectMainBranch(branchId) {
      return client.request(`/branches/${branchId}/select-main`, {
        method: 'POST',
      })
    },
    updateBranch(branchId, patch) {
      if (Object.prototype.hasOwnProperty.call(patch, 'name')) {
        return client.request(`/branches/${branchId}/name`, {
          method: 'PATCH',
          body: {
            name: patch.name,
          },
        })
      }

      return client.request(`/branches/${branchId}`, {
        method: 'PATCH',
        body: patch,
      })
    },
    restoreBranch(branchId) {
      return client.request(`/branches/${branchId}/restore`, {
        method: 'POST',
      })
    },
    deleteBranch(branchId) {
      return client.request(`/branches/${branchId}`, {
        method: 'DELETE',
      })
    },
  }
}

export function createBranchGraphApi() {
  const useMockApi = import.meta.env.VITE_USE_MOCK_API
  const hasApiBaseUrl = Boolean(import.meta.env.VITE_API_BASE_URL)
  const shouldUseMockApi = useMockApi ? useMockApi !== 'false' : !hasApiBaseUrl

  return shouldUseMockApi ? createMockBranchGraphApi() : createHttpBranchGraphApi()
}

export const branchGraphApi = createBranchGraphApi()
