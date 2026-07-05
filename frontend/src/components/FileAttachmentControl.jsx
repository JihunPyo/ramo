import { useRef } from 'react'

const ATTACHMENT_ACCEPT = [
  'image/*',
  'application/pdf',
  '.pdf',
  '.docx',
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.py',
  '.js',
  '.ts',
  '.html',
  '.xml',
].join(',')

export function FileAttachmentButton({
  disabled = false,
  onAttachFiles,
  inputId,
  className = '',
}) {
  const inputRef = useRef(null)

  const handleFileChange = (event) => {
    const files = Array.from(event.currentTarget.files ?? [])

    if (files.length > 0) {
      onAttachFiles?.(files)
    }

    event.currentTarget.value = ''
  }

  return (
    <>
      <button
        type="button"
        className={['composer-attach-button', className].filter(Boolean).join(' ')}
        aria-label="파일 첨부"
        title="파일 첨부"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <span aria-hidden="true">+</span>
      </button>
      <input
        ref={inputRef}
        id={inputId}
        className="composer-file-input"
        type="file"
        accept={ATTACHMENT_ACCEPT}
        multiple
        tabIndex={-1}
        onChange={handleFileChange}
      />
    </>
  )
}

export function AttachmentTray({
  files = [],
  uploadState = null,
  disabled = false,
  onDeleteFile,
}) {
  const hasFiles = files.length > 0
  const hasStatus = uploadState?.message

  if (!hasFiles && !hasStatus) {
    return null
  }

  return (
    <div className="attachment-tray" aria-live="polite">
      {files.map((file) => {
        const fileId = readFileId(file)
        const fileName = readFileName(file)

        return (
          <span key={fileId || fileName} className="attachment-chip">
            <span className="attachment-chip-kind" aria-hidden="true">
              {getAttachmentKindLabel(fileName)}
            </span>
            <span className="attachment-chip-name">{fileName}</span>
            {file.summary ? <span className="attachment-chip-summary">{file.summary}</span> : null}
            {fileId && onDeleteFile ? (
              <button
                type="button"
                className="attachment-chip-remove"
                aria-label={`${fileName} 첨부 삭제`}
                disabled={disabled}
                onClick={() => onDeleteFile(fileId)}
              >
                ×
              </button>
            ) : null}
          </span>
        )
      })}
      {hasStatus ? (
        <span className={`attachment-status ${uploadState.phase ?? 'idle'}`}>
          {uploadState.message}
        </span>
      ) : null}
    </div>
  )
}

function readFileId(file) {
  return file?.id ?? file?.file_id ?? file?.fileId ?? ''
}

function readFileName(file) {
  return file?.filename ?? file?.name ?? '첨부 파일'
}

function getAttachmentKindLabel(filename) {
  const extension = String(filename).split('.').pop()?.toLowerCase() ?? ''

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(extension)) {
    return 'IMG'
  }

  if (extension === 'pdf') {
    return 'PDF'
  }

  if (extension === 'docx') {
    return 'DOC'
  }

  return 'FILE'
}
