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
  disabled = false,
  onDeleteFile,
}) {
  return (
    <AttachmentList
      className="attachment-tray"
      files={files}
      disabled={disabled}
      onDeleteFile={onDeleteFile}
    />
  )
}

export function MessageAttachmentList({
  files = [],
  onOpenFile,
}) {
  return (
    <AttachmentList
      className="message-attachment-list"
      files={files}
      onOpenFile={onOpenFile}
    />
  )
}

function AttachmentList({
  className,
  files = [],
  disabled = false,
  onDeleteFile,
  onOpenFile,
}) {
  const hasFiles = files.length > 0

  if (!hasFiles) {
    return null
  }

  return (
    <div className={className} aria-live="polite">
      {files.map((file) => {
        const fileId = readFileId(file)
        const fileName = readFileName(file)
        const extensionLabel = getAttachmentExtensionLabel(fileName)
        const previewUrl = readPreviewUrl(file)
        const hasPreview = Boolean(previewUrl)
        const isOpenable = hasPreview && onOpenFile

        return (
          <span
            key={fileId || fileName}
            role={isOpenable ? 'button' : undefined}
            tabIndex={isOpenable ? 0 : undefined}
            className={hasPreview ? 'attachment-chip with-preview' : 'attachment-chip with-document'}
            onClick={isOpenable ? () => onOpenFile(file) : undefined}
            onKeyDown={isOpenable ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenFile(file)
              }
            } : undefined}
          >
            {hasPreview ? (
              <>
                <span className="attachment-preview-frame">
                  <img className="attachment-preview" src={previewUrl} alt="" aria-hidden="true" />
                  <span className="attachment-extension-badge" aria-hidden="true">
                    {extensionLabel}
                  </span>
                  {fileId && onDeleteFile ? (
                    <button
                      type="button"
                      className="attachment-card-remove"
                      aria-label={`${fileName} 첨부 삭제`}
                      disabled={disabled}
                      onClick={(event) => {
                        event.stopPropagation()
                        onDeleteFile(fileId)
                      }}
                    >
                      ×
                    </button>
                  ) : null}
                </span>
                <span className="attachment-card-footer">
                  <span className="attachment-chip-name">{fileName}</span>
                  <span className="attachment-card-check" aria-hidden="true">
                    ✓
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="attachment-document-icon" aria-hidden="true">
                  <span className="attachment-document-fold" />
                  <span className="attachment-document-label">{extensionLabel}</span>
                </span>
                <span className="attachment-document-copy">
                  <span className="attachment-chip-name">{fileName}</span>
                  <span className="attachment-document-type">{extensionLabel}</span>
                </span>
                {fileId && onDeleteFile ? (
                  <button
                    type="button"
                    className="attachment-card-remove"
                    aria-label={`${fileName} 첨부 삭제`}
                    disabled={disabled}
                    onClick={(event) => {
                      event.stopPropagation()
                      onDeleteFile(fileId)
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}

function readFileId(file) {
  return file?.id ?? file?.file_id ?? file?.fileId ?? ''
}

function readFileName(file) {
  return file?.filename ?? file?.name ?? '첨부 파일'
}

function readPreviewUrl(file) {
  return file?.previewUrl ?? file?.preview_url ?? ''
}

function getAttachmentExtensionLabel(filename) {
  const extension = String(filename).split('.').pop()?.toUpperCase()

  if (!extension || extension === String(filename).toUpperCase()) {
    return 'IMG'
  }

  return extension.slice(0, 4)
}
