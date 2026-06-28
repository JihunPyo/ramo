import { MiniGraph } from './MiniGraph.jsx'

export function StartNodeSidebar({
  graphState,
  rootNodes,
  isBusy = false,
  onNewChat,
  onSelectRoot,
  onSelectNode,
  onSetMainTarget,
}) {
  return (
    <aside className="start-sidebar" aria-label="시작 노드">
      <header className="sidebar-header">
        <p className="eyebrow">Branch Chat</p>
        <h2>시작 노드</h2>
      </header>

      <button type="button" className="new-chat-button" onClick={onNewChat} disabled={isBusy}>
        새 채팅
      </button>

      <nav className="root-list" aria-label="루트 노드 목록">
        {rootNodes.map((node) => (
          <button
            key={node.id}
            type="button"
            className={node.id === graphState.selectedRootNodeId ? 'root-card selected' : 'root-card'}
            onClick={() => onSelectRoot(node.id)}
            disabled={isBusy}
          >
            <span>{node.title}</span>
            <small>{node.description}</small>
          </button>
        ))}
      </nav>

      <section className="sidebar-graph-panel" aria-label="선택된 시작 노드 그래프">
        <MiniGraph
          graphState={graphState}
          rootId={graphState.selectedRootNodeId}
          onSelectNode={onSelectNode}
          onSetMainTarget={onSetMainTarget}
        />
      </section>
    </aside>
  )
}
