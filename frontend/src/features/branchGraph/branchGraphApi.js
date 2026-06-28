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
    listBranches(sessionId) {
      return client.request(`/sessions/${sessionId}/branches`)
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
    updateBranch(branchId, patch) {
      return client.request(`/branches/${branchId}`, {
        method: 'PATCH',
        body: patch,
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
