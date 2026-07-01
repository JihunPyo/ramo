import { useLayoutEffect, useRef } from 'react'

export function useAutoResizeTextarea(value, { maxHeight = 180 } = {}) {
  const textareaRef = useRef(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [maxHeight, value])

  return textareaRef
}
