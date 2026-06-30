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
  getSubtreeNodeIds,
  selectNode,
  selectRoot,
  setMainTargetNode,
} from './features/branchGraph/branchGraphModel.js'

const DEFAULT_MODEL_PROVIDER = 'local'
const DEFAULT_MODEL_NAME = 'local-mock'
const DESKTOP_SIDEBAR_MEDIA_QUERY = '(min-width: 921px)'

function App() {
  const [graphState, setGraphState] = useState(() => createEmptyGraphState())
  const [isFullscreenGraphOpen, setIsFullscreenGraphOpen] = useState(false)
  const [isMiniGraphOpen, setIsMiniGraphOpen] = useState(true)
  const [nodeNavigationKey, setNodeNavigationKey] = useState(0)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  const [isLandingVisible, setIsLandingVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const graphStateRef = useRef(graphState)

  useEffect(() => {
    graphStateRef.current = graphState
  }, [graphState])

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_SIDEBAR_MEDIA_QUERY)
    const handleMediaChange = (event) => {
      setIsNarrowViewport(!event.matches)

      if (event.matches) {
        setIsMobileSidebarOpen(false)
      }
    }

    handleMediaChange(mediaQuery)
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

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
          apiSessions.map(async (session) => {
            const sessionId = readSessionId(session)
            const [graph, branches] = await Promise.all([
              branchGraphApi.getSessionGraph(sessionId, true),
              branchGraphApi.listBranches(sessionId),
            ])

            return { session, graph, branches }
          }),
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
    setIsMobileSidebarOpen(false)
    setIsLandingVisible(true)
  }

  const handleSelectNode = (nodeId) => {
    setGraphState((currentState) => selectNode(currentState, nodeId))
    setIsMobileSidebarOpen(false)
    setIsLandingVisible(false)
    void loadBranchMessages(nodeId)
  }

  const handleSelectTopGraphNode = (nodeId) => {
    setNodeNavigationKey((currentKey) => currentKey + 1)
    handleSelectNode(nodeId)
  }

  const handleSetMainTarget = (nodeId) => {
    setGraphState((currentState) => setMainTargetNode(currentState, nodeId))
  }

  const handleOpenLanding = async () => {
    const newRootTitle = createNewRootNodeTitle(getRootNodes(graphStateRef.current.nodes))

    setIsMobileSidebarOpen(false)
    setPendingAction('새 루트 노드 생성 중')

    try {
      const session = await branchGraphApi.createSession(newRootTitle)
      const mainBranchId = readMainBranchId(session)

      if (!mainBranchId) {
        throw new Error('새 루트 노드 ID를 세션 생성 응답에서 확인할 수 없다.')
      }

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

  const handleMoveToTrash = async (nodeId) => {
    const currentState = graphStateRef.current
    const node = getNodeById(currentState.nodes, nodeId)

    if (!node || node.parentId === null) {
      return
    }

    const branchIds = getSubtreeNodeIds(currentState.nodes, nodeId)
    const confirmed = window.confirm(
      `“${node.title}”과 하위 브랜치 ${branchIds.length - 1}개를 휴지통으로 이동할까요?`,
    )

    if (!confirmed) {
      return
    }

    setPendingAction('휴지통으로 이동 중')

    try {
      await Promise.all(
        branchIds.map((branchId) => branchGraphApi.updateBranch(branchId, { status: 'deleted' })),
      )
      await loadGraphState({
        activeNodeId: node.parentId,
        selectedRootNodeId: node.rootId,
        loadMessages: true,
      })
      setIsLandingVisible(false)
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleRestoreFromTrash = async (nodeId) => {
    const trashNodes = graphStateRef.current.trashNodes
    const node = getNodeById(trashNodes, nodeId)

    if (!node) {
      return
    }

    const branchIds = getSubtreeNodeIds(trashNodes, nodeId)
    setPendingAction('브랜치 복구 중')

    try {
      await Promise.all(
        branchIds.map((branchId) => branchGraphApi.updateBranch(branchId, { status: 'active' })),
      )
      await loadGraphState({
        activeNodeId: nodeId,
        selectedRootNodeId: node.rootId,
        loadMessages: true,
      })
      setIsLandingVisible(false)
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleDeleteForever = async (nodeId) => {
    const trashNodes = graphStateRef.current.trashNodes
    const node = getNodeById(trashNodes, nodeId)

    if (!node) {
      return
    }

    const branchCount = getSubtreeNodeIds(trashNodes, nodeId).length
    const confirmed = window.confirm(
      `“${node.title}”과 관련된 ${branchCount}개 브랜치를 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
    )

    if (!confirmed) {
      return
    }

    setPendingAction('영구 삭제 중')

    try {
      await branchGraphApi.deleteBranch(nodeId)
      await loadGraphState({ loadMessages: false })
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleToggleSidebar = () => {
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false)
      return
    }

    setIsSidebarCollapsed((currentValue) => !currentValue)
  }

  const appShellClassName = [
    'app-shell',
    isSidebarCollapsed ? 'sidebar-collapsed' : '',
    isMobileSidebarOpen ? 'mobile-sidebar-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={appShellClassName}>
      <StartNodeSidebar
        graphState={graphState}
        rootNodes={rootNodes}
        isCollapsed={isSidebarCollapsed}
        isDrawerMode={isNarrowViewport}
        isMobileDrawerOpen={isMobileSidebarOpen}
        isBusy={isBusy}
        onToggleCollapse={handleToggleSidebar}
        onNewChat={handleOpenLanding}
        onSelectRoot={handleSelectRoot}
        onSelectNode={handleSelectNode}
        onSetMainTarget={handleSetMainTarget}
        onMoveToTrash={handleMoveToTrash}
        onRestoreFromTrash={handleRestoreFromTrash}
        onDeleteForever={handleDeleteForever}
      />
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="사이드바 닫기"
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <section className="workspace" aria-label="채팅 작업공간">
        <header className="workspace-topbar">
          <button
            type="button"
            className="mobile-sidebar-open-button"
            aria-label="사이드바 열기"
            aria-expanded={isMobileSidebarOpen}
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <span className="mobile-sidebar-open-icon" aria-hidden="true" />
          </button>
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
            {isMiniGraphOpen ? (
              <TopMiniGraph
                graphState={graphState}
                activeNode={activeNode}
                onSelectNode={handleSelectTopGraphNode}
                onSetMainTarget={handleSetMainTarget}
                onMoveToTrash={handleMoveToTrash}
                onOpenFullscreen={() => setIsFullscreenGraphOpen(true)}
                onClose={() => setIsMiniGraphOpen(false)}
              />
            ) : (
              <button
                type="button"
                className="top-graph-reopen"
                aria-label="시각화 창 열기"
                aria-expanded="false"
                onClick={() => setIsMiniGraphOpen(true)}
              >
                <span aria-hidden="true">◇</span>
                시각화 열기
              </button>
            )}

            <ChatWorkspace
              activeNode={activeNode}
              session={activeSession}
              graphState={graphState}
              nodeNavigationKey={nodeNavigationKey}
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
          onMoveToTrash={handleMoveToTrash}
        />
      ) : null}
    </main>
  )
}

function getDisplayError(error) {
  return error?.message ?? '알 수 없는 오류가 발생했다.'
}

function createNewRootNodeTitle(rootNodes) {
  const newChatRootCount = rootNodes.filter((node) => /^새 대화(?: \d+)?$/.test(node.title)).length

  return newChatRootCount === 0 ? '새 대화' : `새 대화 ${newChatRootCount + 1}`
}

export default App
