export function RamoLogo({ compact = false }) {
  return (
    <span className={compact ? 'ramo-logo compact' : 'ramo-logo'} aria-hidden="true">
      <svg className="ramo-logo-mark" viewBox="0 0 210 90" focusable="false">
        <text className="ramo-logo-text" x="10" y="64">ram</text>
        <circle className="ramo-logo-ring" cx="167" cy="44" r="18" />
        <g className="ramo-logo-branches" fill="none">
          <path className="ramo-logo-branch ramo-logo-branch-main" d="M167 44 Q181 34 191 22" pathLength="1" />
          <path className="ramo-logo-branch ramo-logo-branch-side" d="M167 44 Q183 50 198 56" pathLength="1" />
          <path className="ramo-logo-branch ramo-logo-branch-sprout" d="M191 22 Q197 14 194 7" pathLength="1" />
        </g>
        <circle className="ramo-logo-node ramo-logo-node-top" cx="194" cy="7" r="5" />
        <circle className="ramo-logo-node ramo-logo-node-side" cx="199" cy="57" r="4.5" />
        <circle className="ramo-logo-joint" cx="191" cy="22" r="3.5" />
      </svg>
    </span>
  )
}
