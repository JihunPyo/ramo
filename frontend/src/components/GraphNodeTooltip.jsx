function getTagLabel(tag) {
  if (typeof tag === 'string' || typeof tag === 'number') {
    return String(tag)
  }

  return tag?.name ?? tag?.label ?? tag?.title ?? tag?.value ?? ''
}

export function GraphNodeTooltip({ node, className = '' }) {
  const tags = (Array.isArray(node?.tags) ? node.tags : [])
    .map(getTagLabel)
    .map((tag) => tag.trim().replace(/^#+/, ''))
    .filter(Boolean)

  return (
    <div className={`graph-tooltip ${className}`.trim()} role="status">
      <strong>{node.title}</strong>
      {tags.length > 0 ? (
        <div className="graph-tooltip-tags" aria-label="태그">
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`}>#{tag}</span>
          ))}
        </div>
      ) : null}
      <p>{node.description}</p>
    </div>
  )
}
