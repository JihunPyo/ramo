import { useLayoutEffect, useRef } from 'react'

export function useAutoResizeTextarea(value, { minHeight = 42, maxHeight = 180 } = {}) {
  const textareaRef = useRef(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    const resizeTextarea = () => {
      textarea.style.height = `${minHeight}px`
      const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
      textarea.style.height = `${nextHeight}px`
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
    }

    resizeTextarea()

    if (typeof ResizeObserver === 'undefined' || !textarea.parentElement) {
      return undefined
    }

    const resizeObserver = new ResizeObserver(resizeTextarea)
    resizeObserver.observe(textarea.parentElement)

    return () => resizeObserver.disconnect()
  }, [maxHeight, minHeight, value])

  return textareaRef
}
