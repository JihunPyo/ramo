export function RamoLogo({ compact = false }) {
  return (
    <span className={compact ? 'ramo-logo compact' : 'ramo-logo'} aria-hidden="true">
      <span className="ramo-logo-text">Ram</span>
      <svg className="ramo-logo-mark" viewBox="0 0 72 72" focusable="false">
        <circle className="ramo-logo-ring" cx="32" cy="38" r="24" />
        <circle className="ramo-logo-center" cx="32" cy="38" r="13" />
        <path className="ramo-logo-slice" d="M32 38 44 27a16 16 0 0 1 4 11Z" />
        <path className="ramo-logo-branch" d="M48 23 56 14M56 14l2-9M56 14l8 8M51 52l12 8" />
        <circle className="ramo-logo-node" cx="58" cy="5" r="5" />
        <circle className="ramo-logo-node hollow" cx="56" cy="14" r="4" />
        <circle className="ramo-logo-node" cx="64" cy="22" r="5" />
        <circle className="ramo-logo-node" cx="63" cy="60" r="5" />
      </svg>
    </span>
  )
}
