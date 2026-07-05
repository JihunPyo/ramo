import { useState } from 'react'
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea.js'
import {
  AttachmentTray,
  FileAttachmentButton,
} from './FileAttachmentControl.jsx'
import { ModelSelector } from './ModelSelector.jsx'
import { RamoLogo } from './RamoLogo.jsx'
import { getFilesFromClipboard } from './fileAttachmentUtils.js'

export function ChatLanding({
  activeNode,
  isBusy = false,
  attachedFiles = [],
  uploadState = null,
  modelOptions = [],
  selectedModel,
  onChangeModel,
  onSendMessage,
  onAttachFiles,
  onDeleteAttachment,
  onOpenModelComparison,
}) {
  const [draft, setDraft] = useState('')
  const textareaRef = useAutoResizeTextarea(draft, { minHeight: 26, maxHeight: 180 })

  const handleSubmit = (event) => {
    event.preventDefault()
    const messageText = draft.trim()

    if (!messageText) {
      return
    }

    onSendMessage(messageText)
    setDraft('')
  }

  const handleMessageKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const handlePaste = (event) => {
    const files = getFilesFromClipboard(event.clipboardData)

    if (files.length === 0) {
      return
    }

    event.preventDefault()
    onAttachFiles?.(files)
  }

  return (
    <section className="chat-landing" aria-label="채팅 시작">
      <div className="landing-logo" aria-hidden="true">
        <RamoLogo />
      </div>
      <h1>무엇을 도와드릴까요?</h1>

      <form className="landing-composer" onSubmit={handleSubmit}>
        <label htmlFor="landing-message">메시지</label>
        <div className="landing-input-row">
          <FileAttachmentButton
            inputId="landing-file-input"
            disabled={isBusy}
            onAttachFiles={onAttachFiles}
          />
          <textarea
            ref={textareaRef}
            id="landing-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleMessageKeyDown}
            onPaste={handlePaste}
            disabled={isBusy}
            rows={1}
            placeholder={`${activeNode?.title ?? '새 대화'}에서 무엇이든 물어보세요`}
          />
          <button type="submit" aria-label="메시지 전송" disabled={isBusy || !draft.trim()}>
            ➤
          </button>
        </div>
        <AttachmentTray
          files={attachedFiles}
          uploadState={uploadState}
          disabled={isBusy}
          onDeleteFile={onDeleteAttachment}
        />

        <div className="prompt-chip-row composer-model-controls landing-model-controls" aria-label="답변 옵션">
          <ModelSelector
            modelOptions={modelOptions}
            selectedModel={selectedModel}
            onChangeModel={onChangeModel}
            disabled={isBusy}
            placement="bottom"
            className="landing-model-selector composer-model-selector"
          />
          <button
            type="button"
            className="composer-compare-button model-compare-launch"
            disabled={isBusy}
            onClick={() => onOpenModelComparison?.(draft.trim())}
          >
            모델 비교
          </button>
        </div>
      </form>
    </section>
  )
}
