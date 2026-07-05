import { getPersonaOption } from '../features/personas/personaOptions.js'

function getTagLabel(tag) {
  if (typeof tag === 'string' || typeof tag === 'number') {
    return String(tag)
  }

  return tag?.name ?? tag?.label ?? tag?.title ?? tag?.value ?? ''
}

export function GraphNodeTooltip({ node, className = '', showTags = true }) {
  const persona = getPersonaOption(node?.personaKey)
  const tags = (Array.isArray(node?.tags) ? node.tags : [])
    .map(getTagLabel)
    .map((tag) => tag.trim().replace(/^#+/, ''))
    .filter(Boolean)

  return (
    <div className={`graph-tooltip ${className}`.trim()} role="status">
      <strong>
        <span>{node.title}</span>
        {persona ? <small className="graph-tooltip-persona">{persona.name}</small> : null}
      </strong>
      {showTags && tags.length > 0 ? (
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
