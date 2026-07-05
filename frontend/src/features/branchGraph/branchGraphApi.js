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
    searchBranches(sessionId, query) {
      return client.request(`/sessions/${sessionId}/search`, {
        query: {
          q: query,
        },
      })
    },
    getSessionMemory(sessionId) {
      return client.request(`/sessions/${sessionId}/memory`)
    },
    updateSessionMemory(sessionId, memory) {
      return client.request(`/sessions/${sessionId}/memory`, {
        method: 'PATCH',
        body: {
          memory,
        },
      })
    },
    extractSessionMemory(sessionId) {
      return client.request(`/sessions/${sessionId}/memory/extract`, {
        method: 'POST',
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
    sendChatMessage({
      branchId,
      message,
      modelProvider = 'openai',
      modelName = 'gpt-4o-mini',
      personaKey = '',
      personaName = '',
    }) {
      return client.request('/chat', {
        method: 'POST',
        body: {
          branch_id: branchId,
          message,
          model_provider: modelProvider,
          model_name: modelName,
          ...(personaKey ? { persona_key: personaKey } : {}),
          ...(personaName ? { persona_name: personaName } : {}),
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
    autoNameBranch(branchId) {
      return client.request(`/branches/${branchId}/auto-name`, {
        method: 'POST',
      })
    },
    autoTagBranch(branchId) {
      return client.request(`/branches/${branchId}/auto-tag`, {
        method: 'POST',
      })
    },
    summarizeBranch(branchId) {
      return client.request(`/branches/${branchId}/summarize`, {
        method: 'POST',
      })
    },
    describeBranch(branchId) {
      return client.request(`/branches/${branchId}/describe`, {
        method: 'POST',
      })
    },
    compareModels({ branchId, message, modelA, modelB }) {
      return client.request('/compare', {
        method: 'POST',
        body: {
          branch_id: branchId,
          message,
          model_a: { provider: modelA.provider, name: modelA.name },
          model_b: { provider: modelB.provider, name: modelB.name },
        },
      })
    },
    analyzeComparison(comparisonId) {
      return client.request(`/compare/${comparisonId}/analyze`, { method: 'POST' })
    },
    selectComparison(comparisonId, selected) {
      return client.request(`/compare/${comparisonId}/select`, {
        method: 'POST',
        body: { selected },
      })
    },
    mergeComparison(comparisonId, { instruction, modelProvider, modelName }) {
      return client.request(`/compare/${comparisonId}/merge`, {
        method: 'POST',
        body: {
          instruction,
          model_provider: modelProvider,
          model_name: modelName,
        },
      })
    },
    getMergeCandidates(branchId) {
      return client.request(`/branches/${branchId}/merge-candidates`)
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
    createTag({ sessionId, name, color = null, type = 'normal' }) {
      return client.request('/tags', {
        method: 'POST',
        body: {
          session_id: sessionId,
          name,
          color,
          type,
        },
      })
    },
    listSessionTags(sessionId) {
      return client.request(`/sessions/${sessionId}/tags`)
    },
    listBranchTags(branchId) {
      return client.request(`/branches/${branchId}/tags`)
    },
    addBranchTag(branchId, tagId) {
      return client.request(`/branches/${branchId}/tags`, {
        method: 'POST',
        body: {
          tag_id: tagId,
        },
      })
    },
    removeBranchTag(branchId, tagId) {
      return client.request(`/branches/${branchId}/tags/${tagId}`, {
        method: 'DELETE',
      })
    },
    uploadBranchFile(branchId, file, { modelProvider = 'openai', modelName = 'gpt-4o-mini' } = {}) {
      return client.request(`/branches/${branchId}/upload`, {
        method: 'POST',
        body: createUploadFormData(file, { modelProvider, modelName }),
      })
    },
    uploadSessionFile(sessionId, file, { modelProvider = 'openai', modelName = 'gpt-4o-mini' } = {}) {
      return client.request(`/sessions/${sessionId}/upload`, {
        method: 'POST',
        body: createUploadFormData(file, { modelProvider, modelName }),
      })
    },
    listBranchFiles(branchId) {
      return client.request(`/branches/${branchId}/files`)
    },
    listSessionFiles(sessionId) {
      return client.request(`/sessions/${sessionId}/files`)
    },
    deleteFile(fileId) {
      return client.request(`/files/${fileId}`, {
        method: 'DELETE',
      })
    },
  }
}

function createUploadFormData(file, { modelProvider, modelName }) {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('model_provider', modelProvider)
  formData.set('model_name', modelName)
  return formData
}

export function createBranchGraphApi() {
  const useMockApi = import.meta.env.VITE_USE_MOCK_API
  const hasApiBaseUrl = Boolean(import.meta.env.VITE_API_BASE_URL)
  const shouldUseMockApi = useMockApi ? useMockApi !== 'false' : !hasApiBaseUrl

  return shouldUseMockApi ? createMockBranchGraphApi() : createHttpBranchGraphApi()
}

export const branchGraphApi = createBranchGraphApi()
