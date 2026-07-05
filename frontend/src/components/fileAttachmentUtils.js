export function getFilesFromClipboard(clipboardData) {
  if (!clipboardData) {
    return []
  }

  const files = Array.from(clipboardData.files ?? [])

  if (files.length > 0) {
    return dedupeFiles(files).map((file, index) => normalizeClipboardFile(file, index))
  }

  const itemFiles = Array.from(clipboardData.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter(Boolean)

  return dedupeFiles(itemFiles).map((file, index) => normalizeClipboardFile(file, index))
}

function normalizeClipboardFile(file, index) {
  if (file.name) {
    return file
  }

  const extension = getExtensionFromMimeType(file.type)
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '')

  return new File([file], `clipboard-file-${timestamp}-${index + 1}.${extension}`, {
    type: file.type,
    lastModified: file.lastModified || Date.now(),
  })
}

function dedupeFiles(files) {
  const seen = new Set()

  return files.filter((file) => {
    const key = `${file.name}:${file.type}:${file.size}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function getExtensionFromMimeType(mimeType) {
  if (mimeType === 'image/jpeg') {
    return 'jpg'
  }

  if (mimeType === 'image/webp') {
    return 'webp'
  }

  if (mimeType === 'application/pdf') {
    return 'pdf'
  }

  if (mimeType?.includes('/')) {
    return mimeType.split('/').pop().replace(/[^a-z0-9]+/gi, '') || 'bin'
  }

  return 'bin'
}
