const DB_NAME = 'ramo-message-attachment-cache'
const DB_VERSION = 1
const STORE_NAME = 'messageAttachments'
export const MESSAGE_ATTACHMENT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function cacheMessageAttachments(
  messageId,
  attachments,
  { ttlMs = MESSAGE_ATTACHMENT_CACHE_TTL_MS } = {},
) {
  if (!messageId || !Array.isArray(attachments) || attachments.length === 0) {
    return
  }

  const db = await openAttachmentCache()

  if (!db) {
    return
  }

  const now = Date.now()
  const entry = {
    messageId,
    cachedAt: now,
    expiresAt: now + ttlMs,
    attachments: await Promise.all(attachments.map(serializeAttachment)),
  }

  await putCacheEntry(db, entry)
}

export async function restoreMessageAttachmentCache(messageIds) {
  const uniqueMessageIds = [...new Set(messageIds.filter(Boolean))]

  if (uniqueMessageIds.length === 0) {
    return {}
  }

  const db = await openAttachmentCache()

  if (!db) {
    return {}
  }

  const entries = await Promise.all(uniqueMessageIds.map((messageId) => getCacheEntry(db, messageId)))
  const now = Date.now()
  const restoredAttachmentsById = {}

  await Promise.all(
    entries.map((entry) => {
      if (!entry || entry.expiresAt > now) {
        return Promise.resolve()
      }

      return deleteCacheEntry(db, entry.messageId)
    }),
  )

  entries.forEach((entry) => {
    if (!entry || entry.expiresAt <= now) {
      return
    }

    restoredAttachmentsById[entry.messageId] = entry.attachments.map(deserializeAttachment)
  })

  return restoredAttachmentsById
}

function openAttachmentCache() {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null)
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'messageId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function putCacheEntry(db, entry) {
  return runStoreTransaction(db, 'readwrite', (store) => store.put(entry))
}

function getCacheEntry(db, messageId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(messageId)

    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

function deleteCacheEntry(db, messageId) {
  return runStoreTransaction(db, 'readwrite', (store) => store.delete(messageId))
}

function runStoreTransaction(db, mode, operation) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const request = operation(transaction.objectStore(STORE_NAME))

    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

async function serializeAttachment(file) {
  return {
    metadata: createSerializableAttachmentMetadata(file),
    blob: await readAttachmentBlob(file),
  }
}

function deserializeAttachment(cachedAttachment) {
  const metadata = cachedAttachment?.metadata ?? {}

  if (!cachedAttachment?.blob || typeof URL === 'undefined') {
    return metadata
  }

  return {
    ...metadata,
    previewUrl: URL.createObjectURL(cachedAttachment.blob),
  }
}

function createSerializableAttachmentMetadata(file) {
  const metadata = { ...(file ?? {}) }

  delete metadata.previewUrl
  delete metadata.preview_url
  return metadata
}

async function readAttachmentBlob(file) {
  const previewUrl = file?.previewUrl ?? file?.preview_url ?? ''

  if (!previewUrl) {
    return null
  }

  try {
    const response = await fetch(previewUrl)
    return await response.blob()
  } catch {
    return null
  }
}
