import { MiniGraph } from './MiniGraph.jsx'
import { getSubtreeNodeIds } from '../features/branchGraph/branchGraphModel.js'

export function StartNodeSidebar({
  graphState,
  rootNodes,
  isBusy = false,
  onNewChat,
  onSelectRoot,
  onSelectNode,
  onSetMainTarget,
  onMoveToTrash,
  onRestoreFromTrash,
  onDeleteForever,
}) {
  const trashNodes = graphState.trashNodes ?? []
  const trashNodeIds = new Set(trashNodes.map((node) => node.id))
  const trashRoots = trashNodes.filter((node) => !trashNodeIds.has(node.parentId))

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
          onMoveToTrash={onMoveToTrash}
        />
      </section>

      <details className="trash-panel">
        <summary>
          <span>휴지통</span>
          <strong>{trashNodes.length}</strong>
        </summary>
        {trashRoots.length > 0 ? (
          <div className="trash-list">
            {trashRoots.map((node) => {
              const branchCount = getSubtreeNodeIds(trashNodes, node.id).length

              return (
                <article key={node.id} className="trash-card">
                  <div>
                    <strong>{node.title}</strong>
                    <small>{branchCount}개 브랜치</small>
                  </div>
                  <div className="trash-actions">
                    <button
                      type="button"
                      onClick={() => onRestoreFromTrash(node.id)}
                      disabled={isBusy}
                    >
                      복구
                    </button>
                    <button
                      type="button"
                      className="danger-text-button"
                      onClick={() => onDeleteForever(node.id)}
                      disabled={isBusy}
                    >
                      영구 삭제
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="trash-empty">삭제한 브랜치가 없습니다.</p>
        )}
      </details>
    </aside>
  )
}
