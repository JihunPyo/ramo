export const SESSION_CONTENT_CACHE_TTL_MS = 60 * 1000

export function createSessionContentCache({ ttlMs = SESSION_CONTENT_CACHE_TTL_MS } = {}) {
  let sessionListsEntry = null
  const graphPayloadBySessionId = new Map()
  const branchMessagesByKey = new Map()

  const isFresh = (entry) => Boolean(entry) && Date.now() - entry.cachedAt <= ttlMs
  const createEntry = (value) => ({ value, cachedAt: Date.now() })
  const getBranchMessagesKey = (branchId, includeInherited) =>
    `${branchId}:${includeInherited ? 'inherited' : 'direct'}`

  return {
    async getSessionLists(fetchSessionLists, { force = false } = {}) {
      if (!force && isFresh(sessionListsEntry)) {
        return sessionListsEntry.value
      }

      const value = await fetchSessionLists()
      sessionListsEntry = createEntry(value)
      return value
    },

    async getSessionGraphPayload(sessionId, fetchGraphPayload, { force = false } = {}) {
      const cachedEntry = graphPayloadBySessionId.get(sessionId)

      if (!force && isFresh(cachedEntry)) {
        return cachedEntry.value
      }

      const value = await fetchGraphPayload()
      graphPayloadBySessionId.set(sessionId, createEntry(value))
      return value
    },

    readBranchMessages(branchId, includeInherited = true) {
      const key = getBranchMessagesKey(branchId, includeInherited)
      const cachedEntry = branchMessagesByKey.get(key)

      if (!isFresh(cachedEntry)) {
        return null
      }

      return cachedEntry.value
    },

    async getBranchMessages(branchId, includeInherited, fetchMessages, { force = false } = {}) {
      const key = getBranchMessagesKey(branchId, includeInherited)
      const cachedEntry = branchMessagesByKey.get(key)

      if (!force && isFresh(cachedEntry)) {
        return cachedEntry.value
      }

      const value = await fetchMessages()
      branchMessagesByKey.set(key, createEntry(value))
      return value
    },

    invalidateAll() {
      sessionListsEntry = null
      graphPayloadBySessionId.clear()
      branchMessagesByKey.clear()
    },

    invalidateSession(sessionId) {
      graphPayloadBySessionId.delete(sessionId)
    },

    invalidateBranchMessages(branchId) {
      branchMessagesByKey.delete(getBranchMessagesKey(branchId, true))
      branchMessagesByKey.delete(getBranchMessagesKey(branchId, false))
    },
  }
}
