export function RamoLogo({ compact = false }) {
  return (
    <span className={compact ? 'ramo-logo compact' : 'ramo-logo'} aria-hidden="true">
      <svg className="ramo-logo-mark" viewBox="0 0 220 90" focusable="false">
        <text className="ramo-logo-text" x="10" y="64">ram</text>
        <circle className="ramo-logo-ring" cx="172" cy="44" r="18" />
        <path className="ramo-logo-branch" d="M172 44 Q186 34 196 22" />
        <circle className="ramo-logo-node" cx="197" cy="21" r="5" />
      </svg>
    </span>
  )
}
