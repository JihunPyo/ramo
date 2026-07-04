import { useRef } from 'react'

export function SplitResizeHandle({ label, onResize }) {
  const dragStateRef = useRef(null)

  return (
    <div
      className="split-resize-handle"
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      tabIndex={0}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return
        }

        dragStateRef.current = { pointerId: event.pointerId, previousX: event.clientX }
        event.currentTarget.setPointerCapture(event.pointerId)
        document.body.classList.add('split-view-resizing')
      }}
      onPointerMove={(event) => {
        const dragState = dragStateRef.current

        if (!dragState || dragState.pointerId !== event.pointerId) {
          return
        }

        const deltaX = event.clientX - dragState.previousX
        dragState.previousX = event.clientX
        onResize(deltaX)
      }}
      onPointerUp={(event) => {
        if (dragStateRef.current?.pointerId === event.pointerId) {
          dragStateRef.current = null
          event.currentTarget.releasePointerCapture(event.pointerId)
          document.body.classList.remove('split-view-resizing')
        }
      }}
      onPointerCancel={() => {
        dragStateRef.current = null
        document.body.classList.remove('split-view-resizing')
      }}
      onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) {
          return
        }

        event.preventDefault()
        onResize(event.key === 'ArrowRight' ? 16 : -16)
      }}
    >
      <span aria-hidden="true" />
    </div>
  )
}
