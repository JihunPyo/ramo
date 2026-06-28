import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { ChatLanding } from './components/ChatLanding.jsx'
import { ChatWorkspace } from './components/ChatWorkspace.jsx'
import { FullscreenGraphModal } from './components/FullscreenGraphModal.jsx'
import { StartNodeSidebar } from './components/StartNodeSidebar.jsx'
import { TopMiniGraph } from './components/TopMiniGraph.jsx'
import {
  applyBranchMessages,
  buildGraphStateFromApi,
  readBranchId,
  readMainBranchId,
  readSessionId,
} from './features/branchGraph/branchGraphAdapter.js'
import { branchGraphApi } from './features/branchGraph/branchGraphApi.js'
import {
  createEmptyGraphState,
  getActiveNode,
  getNodeById,
  getRootNodes,
  getSessionByNodeId,
  selectNode,
  selectRoot,
  setMainTargetNode,
} from './features/branchGraph/branchGraphModel.js'

const DEFAULT_MODEL_PROVIDER = 'openai'
const DEFAULT_MODEL_NAME = 'gpt-4o-mini'

function App() {
  const [graphState, setGraphState] = useState(() => createEmptyGraphState())
  const [isFullscreenGraphOpen, setIsFullscreenGraphOpen] = useState(false)
  const [isLandingVisible, setIsLandingVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const graphStateRef = useRef(graphState)

  useEffect(() => {
    graphStateRef.current = graphState
  }, [graphState])

  const rootNodes = useMemo(() => getRootNodes(graphState.nodes), [graphState.nodes])
  const activeNode = getActiveNode(graphState)
  const activeSession = getSessionByNodeId(graphState, graphState.activeNodeId)
  const isBusy = isLoading || Boolean(pendingAction)

  const loadGraphState = useCallback(
    async ({ activeNodeId, selectedRootNodeId, loadMessages = true } = {}) => {
      setIsLoading(true)

      try {
        let apiSessions = await branchGraphApi.listSessions()

        if (apiSessions.length === 0) {
          apiSessions = [await branchGraphApi.createSession()]
        }

        const graphResponses = await Promise.all(
          apiSessions.map(async (session) => ({
            session,
            graph: await branchGraphApi.getSessionGraph(readSessionId(session), true),
          })),
        )
        let nextState = buildGraphStateFromApi({
          apiSessions,
          graphResponses,
          previousState: graphStateRef.current,
          activeNodeId,
          selectedRootNodeId,
        })
        const nextActiveNode = getNodeById(nextState.nodes, nextState.activeNodeId)

        if (loadMessages && nextActiveNode) {
          const messages = await branchGraphApi.getBranchMessages(nextActiveNode.id, true)
          nextState = applyBranchMessages(nextState, nextActiveNode.id, messages)
        }

        setGraphState(nextState)
        setErrorMessage('')

        return nextState
      } catch (error) {
        setErrorMessage(getDisplayError(error))
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const loadBranchMessages = useCallback(async (branchId) => {
    setPendingAction('메시지 동기화 중')

    try {
      const messages = await branchGraphApi.getBranchMessages(branchId, true)

      setGraphState((currentState) => {
        const selectedState = selectNode(currentState, branchId)
        return applyBranchMessages(selectedState, branchId, messages)
      })
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadGraphState()
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [loadGraphState])

  const handleSelectRoot = (rootId) => {
    setGraphState((currentState) => selectRoot(currentState, rootId))
    setIsLandingVisible(true)
  }

  const handleSelectNode = (nodeId) => {
    setGraphState((currentState) => selectNode(currentState, nodeId))
    setIsLandingVisible(false)
    void loadBranchMessages(nodeId)
  }

  const handleSetMainTarget = (nodeId) => {
    setGraphState((currentState) => setMainTargetNode(currentState, nodeId))
  }

  const handleOpenLanding = async () => {
    setPendingAction('새 세션 생성 중')

    try {
      const session = await branchGraphApi.createSession()
      const mainBranchId = readMainBranchId(session)

      await loadGraphState({
        activeNodeId: mainBranchId,
        selectedRootNodeId: mainBranchId,
        loadMessages: false,
      })
      setIsLandingVisible(true)
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleSendMessage = async (messageText) => {
    const branchId = graphStateRef.current.activeNodeId

    if (!branchId) {
      return
    }

    setPendingAction('메시지 전송 중')
    setIsLandingVisible(false)

    try {
      await branchGraphApi.sendChatMessage({
        branchId,
        message: messageText,
        modelProvider: DEFAULT_MODEL_PROVIDER,
        modelName: DEFAULT_MODEL_NAME,
      })
      await loadGraphState({
        activeNodeId: branchId,
        selectedRootNodeId: graphStateRef.current.selectedRootNodeId,
        loadMessages: true,
      })
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleCreateBranch = async (messageId, parentNodeId) => {
    const parentNode = getNodeById(graphStateRef.current.nodes, parentNodeId)

    if (!parentNode) {
      return
    }

    setPendingAction('브랜치 생성 중')

    try {
      const branch = await branchGraphApi.createBranch({
        sessionId: parentNode.apiSessionId,
        parentBranchId: parentNode.id,
        forkFromMessageId: messageId,
      })
      const branchId = readBranchId(branch)

      await loadGraphState({
        activeNodeId: branchId,
        selectedRootNodeId: parentNode.rootId,
        loadMessages: true,
      })
      setIsLandingVisible(false)
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  return (
    <main className="app-shell">
      <StartNodeSidebar
        graphState={graphState}
        rootNodes={rootNodes}
        isBusy={isBusy}
        onNewChat={handleOpenLanding}
        onSelectRoot={handleSelectRoot}
        onSelectNode={handleSelectNode}
        onSetMainTarget={handleSetMainTarget}
      />

      <section className="workspace" aria-label="채팅 작업공간">
        <header className="workspace-topbar">
          <button type="button" className="model-button">
            Branch Chat API
          </button>
          <span className="api-status">{pendingAction || (isLoading ? '동기화 중' : 'API 계약 모드')}</span>
          <div className="topbar-actions" aria-label="작업 도구">
            <span>알림</span>
            <span>도움말</span>
            <span>계정</span>
          </div>
        </header>

        {errorMessage ? <div className="api-error">{errorMessage}</div> : null}

        {isLoading && !activeNode ? (
          <section className="empty-state" aria-label="초기 데이터 동기화">
            <p className="eyebrow">API 동기화</p>
            <h1>세션과 브랜치 정보를 불러오는 중이다.</h1>
          </section>
        ) : isLandingVisible ? (
          <ChatLanding activeNode={activeNode} isBusy={isBusy} onSendMessage={handleSendMessage} />
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
              isBusy={isBusy}
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

function getDisplayError(error) {
  return error?.message ?? '알 수 없는 오류가 발생했다.'
}

export default App
