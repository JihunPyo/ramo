import { useMemo, useState } from 'react'
import './App.css'
import { ChatLanding } from './components/ChatLanding.jsx'
import { ChatWorkspace } from './components/ChatWorkspace.jsx'
import { FullscreenGraphModal } from './components/FullscreenGraphModal.jsx'
import { StartNodeSidebar } from './components/StartNodeSidebar.jsx'
import { TopMiniGraph } from './components/TopMiniGraph.jsx'
import {
  addBranchFromMessage,
  appendAssistantMessage,
  appendUserMessage,
  getActiveNode,
  getRootNodes,
  getSessionByNodeId,
  selectNode,
  selectRoot,
  setMainTargetNode,
} from './features/branchGraph/branchGraphModel.js'
import { createInitialGraphState } from './features/branchGraph/mockData.js'
import { createMockLlmResponse } from './features/branchGraph/mockLlmProvider.js'

function App() {
  const [graphState, setGraphState] = useState(() => createInitialGraphState())
  const [isFullscreenGraphOpen, setIsFullscreenGraphOpen] = useState(false)
  const [isLandingVisible, setIsLandingVisible] = useState(true)

  const rootNodes = useMemo(() => getRootNodes(graphState.nodes), [graphState.nodes])
  const activeNode = getActiveNode(graphState)
  const activeSession = getSessionByNodeId(graphState, graphState.activeNodeId)

  const handleSelectRoot = (rootId) => {
    setGraphState((currentState) => selectRoot(currentState, rootId))
    setIsLandingVisible(true)
  }

  const handleSelectNode = (nodeId) => {
    setGraphState((currentState) => selectNode(currentState, nodeId))
    setIsLandingVisible(false)
  }

  const handleSetMainTarget = (nodeId) => {
    setGraphState((currentState) => setMainTargetNode(currentState, nodeId))
  }

  const handleOpenLanding = () => {
    setGraphState((currentState) => selectRoot(currentState, currentState.selectedRootNodeId))
    setIsLandingVisible(true)
  }

  const handleSendMessage = (messageText) => {
    const nodeId = graphState.activeNodeId
    const userMessage = {
      content: messageText,
    }

    setGraphState((currentState) => {
      const result = appendUserMessage(currentState, nodeId, messageText)
      return result.state
    })
    setIsLandingVisible(false)

    window.setTimeout(() => {
      setGraphState((currentState) =>
        appendAssistantMessage(
          currentState,
          nodeId,
          createMockLlmResponse(userMessage.content, activeNode?.title),
        ),
      )
    }, 420)
  }

  const handleCreateBranch = (messageId, parentNodeId) => {
    setGraphState((currentState) => addBranchFromMessage(currentState, messageId, parentNodeId))
    setIsLandingVisible(false)
  }

  return (
    <main className="app-shell">
      <StartNodeSidebar
        graphState={graphState}
        rootNodes={rootNodes}
        onNewChat={handleOpenLanding}
        onSelectRoot={handleSelectRoot}
        onSelectNode={handleSelectNode}
        onSetMainTarget={handleSetMainTarget}
      />

      <section className="workspace" aria-label="채팅 작업공간">
        <header className="workspace-topbar">
          <button type="button" className="model-button">
            Branch Chat Mock
          </button>
          <div className="topbar-actions" aria-label="작업 도구">
            <span>알림</span>
            <span>도움말</span>
            <span>계정</span>
          </div>
        </header>

        {isLandingVisible ? (
          <ChatLanding activeNode={activeNode} onSendMessage={handleSendMessage} />
        ) : (
          <>
            <TopMiniGraph
              graphState={graphState}
              activeNode={activeNode}
              onSelectNode={handleSelectNode}
              onSetMainTarget={handleSetMainTarget}
              onOpenFullscreen={() => setIsFullscreenGraphOpen(true)}
            />

            <ChatWorkspace
              activeNode={activeNode}
              session={activeSession}
              graphState={graphState}
              onSendMessage={handleSendMessage}
              onCreateBranch={handleCreateBranch}
              onSetMainTarget={handleSetMainTarget}
            />
          </>
        )}
      </section>

      {isFullscreenGraphOpen ? (
        <FullscreenGraphModal
          graphState={graphState}
          onClose={() => setIsFullscreenGraphOpen(false)}
          onSelectNode={handleSelectNode}
          onSetMainTarget={handleSetMainTarget}
        />
      ) : null}
    </main>
  )
}

export default App
