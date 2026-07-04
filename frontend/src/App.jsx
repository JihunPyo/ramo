import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './Modern.css'
import { ChatLanding } from './components/ChatLanding.jsx'
import { ChatWorkspace } from './components/ChatWorkspace.jsx'
import { FullscreenGraphModal } from './components/FullscreenGraphModal.jsx'
import { ModelComparisonFlow } from './components/ModelComparisonFlow.jsx'
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
  canMergeNodes,
  createEmptyGraphState,
  getActiveNode,
  getMainLeafNodeForRoot,
  getMainPathNodeIds,
  getNodeById,
  getRootNodes,
  getSubtreeNodeIds,
  selectNode,
  renameNode,
  setMainTargetNode,
  setMergedNodeParentLinks,
  setNodeCollapsed,
} from './features/branchGraph/branchGraphModel.js'

const CHAT_MODEL_OPTIONS = [
  { provider: 'openai', name: 'gpt-4o-mini', label: 'GPT-4o mini' },
  { provider: 'openai', name: 'gpt-4o', label: 'GPT-4o' },
  { provider: 'anthropic', name: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { provider: 'google', name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { provider: 'deepseek', name: 'deepseek-chat', label: 'DeepSeek Chat' },
]
const OPENAI_COMPARISON_MODEL_OPTIONS = [
  { provider: 'openai', name: 'gpt-5.5', label: 'GPT-5.5' },
  { provider: 'openai', name: 'gpt-5.4', label: 'GPT-5.4' },
  { provider: 'openai', name: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
  { provider: 'openai', name: 'gpt-5.4-nano', label: 'GPT-5.4 nano' },
  { provider: 'openai', name: 'gpt-5.2', label: 'GPT-5.2' },
  { provider: 'openai', name: 'gpt-5.2-chat-latest', label: 'GPT-5.2 Chat' },
  { provider: 'openai', name: 'gpt-5.1', label: 'GPT-5.1' },
  { provider: 'openai', name: 'gpt-5.1-chat-latest', label: 'GPT-5.1 Chat' },
  { provider: 'openai', name: 'gpt-5', label: 'GPT-5' },
  { provider: 'openai', name: 'gpt-5-chat-latest', label: 'GPT-5 Chat' },
  { provider: 'openai', name: 'gpt-5-mini', label: 'GPT-5 mini' },
  { provider: 'openai', name: 'gpt-5-nano', label: 'GPT-5 nano' },
  { provider: 'openai', name: 'gpt-4.1', label: 'GPT-4.1' },
  { provider: 'openai', name: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
  { provider: 'openai', name: 'gpt-4.1-nano', label: 'GPT-4.1 nano' },
  { provider: 'openai', name: 'gpt-4o', label: 'GPT-4o' },
  { provider: 'openai', name: 'gpt-4o-mini', label: 'GPT-4o mini' },
]
const COMPARISON_MODEL_OPTIONS = [
  ...OPENAI_COMPARISON_MODEL_OPTIONS,
  ...CHAT_MODEL_OPTIONS.filter((model) => model.provider !== 'openai'),
]
const DESKTOP_SIDEBAR_MEDIA_QUERY = '(min-width: 921px)'

function formatMergeRecommendation(reasons = []) {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    return '현재 노드와 연결해 함께 이어가기 좋은 대화 흐름입니다.'
  }

  return reasons
    .map((reason) => {
      if (typeof reason === 'string') {
        return reason
      }

      if (reason?.type === 'content') {
        const score = Number(reason.score)
        return Number.isFinite(score)
          ? `대화 내용의 유사도가 ${Math.round(score * 100)}%로 높습니다.`
          : '대화 내용과 주제가 유사합니다.'
      }

      if (reason?.type === 'role') {
        const labels = reason.tags ?? reason.roles ?? reason.shared_roles ?? []
        return labels.length > 0
          ? `공통 태그 ${labels.join(', ')}를 공유합니다.`
          : '대화에서 수행하는 역할이 유사합니다.'
      }

      return reason?.description ?? reason?.message ?? ''
    })
    .filter(Boolean)
    .join(' ')
}

function App() {
  const [graphState, setGraphState] = useState(() => createEmptyGraphState())
  const [isFullscreenGraphOpen, setIsFullscreenGraphOpen] = useState(false)
  const [mergeNodeIds, setMergeNodeIds] = useState([])
  const [mergeRecommendation, setMergeRecommendation] = useState(null)
  const [isMergeRecommendationLoading, setIsMergeRecommendationLoading] = useState(false)
  const [mergeRecommendationError, setMergeRecommendationError] = useState('')
  const [isMiniGraphOpen, setIsMiniGraphOpen] = useState(true)
  const [graphLayoutDirection, setGraphLayoutDirection] = useState('vertical')
  const [nodeNavigationKey, setNodeNavigationKey] = useState(0)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  const [isLandingVisible, setIsLandingVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedChatModel, setSelectedChatModel] = useState(() => CHAT_MODEL_OPTIONS[0])
  const [pendingUserMessage, setPendingUserMessage] = useState('')
  const [modelComparisonFlow, setModelComparisonFlow] = useState(null)
  const [comparisonResetKey, setComparisonResetKey] = useState(0)
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
  const activeMainPathNodeIds = activeNode
    ? getMainPathNodeIds(graphState, activeNode.rootId)
    : new Set()
  const isActiveNodeOnMainPath = activeNode ? activeMainPathNodeIds.has(activeNode.id) : false
  const isBusy = isLoading || Boolean(pendingAction)

  const loadGraphState = useCallback(
    async ({ activeNodeId, selectedRootNodeId, loadMessages = true } = {}) => {
      setIsLoading(true)

      try {
        const [activeSessions, trashSessions] = await Promise.all([
          branchGraphApi.listSessions(),
          branchGraphApi.listTrashSessions(),
        ])
        let apiSessions = activeSessions

        if (apiSessions.length === 0) {
          apiSessions = [await branchGraphApi.createSession()]
        }

        const sessionToLoad = resolveSessionToLoad({
          apiSessions,
          currentState: graphStateRef.current,
          activeNodeId,
          selectedRootNodeId,
        })
        const graphResponses = sessionToLoad ? [await loadSessionGraphResponse(sessionToLoad)] : []
        let nextState = buildGraphStateFromApi({
          apiSessions,
          graphResponses,
          trashSessions,
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
    const mainLeafNode = getMainLeafNodeForRoot(graphStateRef.current, rootId)

    setIsMobileSidebarOpen(false)

    setNodeNavigationKey((currentKey) => currentKey + 1)
    setIsLandingVisible(false)
    void loadGraphState({
      activeNodeId: mainLeafNode?.id ?? rootId,
      selectedRootNodeId: rootId,
      loadMessages: true,
    })
  }

  const handleSelectNode = (nodeId) => {
    setNodeNavigationKey((currentKey) => currentKey + 1)
    setGraphState((currentState) => selectNode(currentState, nodeId))
    setIsMobileSidebarOpen(false)
    setIsLandingVisible(false)
    void loadBranchMessages(nodeId)
  }

  const handleSelectTopGraphNode = (nodeId) => {
    handleSelectNode(nodeId)
  }

  const handleSetMainTarget = async (nodeId) => {
    setPendingAction('main 경로 저장 중')
    setErrorMessage('')

    try {
      await branchGraphApi.selectMainBranch(nodeId)
      setGraphState((currentState) => setMainTargetNode(currentState, nodeId))
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleRenameNode = async (nodeId, title) => {
    const normalizedTitle = title.trim()

    if (!normalizedTitle) {
      throw new Error('노드 이름을 입력해 주세요.')
    }

    setPendingAction('노드 이름 수정 중')
    setErrorMessage('')

    try {
      await branchGraphApi.updateBranch(nodeId, { name: normalizedTitle })
      setGraphState((currentState) => renameNode(currentState, nodeId, normalizedTitle))
    } catch (error) {
      setErrorMessage(getDisplayError(error))
      throw error
    } finally {
      setPendingAction('')
    }
  }

  const handleToggleNodeCollapse = async (nodeId, isCollapsed) => {
    setPendingAction(isCollapsed ? '하위 노드 접는 중' : '하위 노드 펼치는 중')
    setErrorMessage('')

    try {
      await branchGraphApi.updateBranch(nodeId, { is_collapsed: isCollapsed })
      setGraphState((currentState) => setNodeCollapsed(currentState, nodeId, isCollapsed))
    } catch (error) {
      setErrorMessage(getDisplayError(error))
      throw error
    } finally {
      setPendingAction('')
    }
  }

  const handleStartNodeMerge = async (nodeId) => {
    const node = getNodeById(graphStateRef.current.nodes, nodeId)

    if (!node) {
      return
    }

    setGraphState((currentState) => ({
      ...currentState,
      selectedRootNodeId: node.rootId,
    }))
    setMergeNodeIds([nodeId])
    setMergeRecommendation(null)
    setMergeRecommendationError('')
    setIsMergeRecommendationLoading(true)
    setIsFullscreenGraphOpen(true)

    try {
      const response = await branchGraphApi.getMergeCandidates(nodeId)
      const candidate = response?.candidates?.[0]

      if (candidate) {
        setMergeRecommendation({
          branchId: candidate.branch_id ?? candidate.branchId,
          reason: formatMergeRecommendation(candidate.reasons),
        })
      }
    } catch (error) {
      setMergeRecommendationError(getDisplayError(error))
    } finally {
      setIsMergeRecommendationLoading(false)
    }
  }

  const handleSelectMergeNode = (nodeId) => {
    const nodes = graphStateRef.current.nodes
    const firstNode = getNodeById(nodes, mergeNodeIds[0])
    const nextNode = getNodeById(nodes, nodeId)

    if (!firstNode || !nextNode || !canMergeNodes(nodes, firstNode.id, nextNode.id)) {
      return
    }

    setErrorMessage('')
    setMergeNodeIds([firstNode.id, nextNode.id])
  }

  const handleConfirmMerge = async () => {
    const mergeNodes = mergeNodeIds
      .map((nodeId) => getNodeById(graphStateRef.current.nodes, nodeId))
      .filter(Boolean)

    if (
      mergeNodes.length !== 2 ||
      !canMergeNodes(graphStateRef.current.nodes, mergeNodes[0].id, mergeNodes[1].id)
    ) {
      return
    }

    setPendingAction('노드 합치는 중')
    setErrorMessage('')

    try {
      const mergedBranch = await branchGraphApi.mergeBranches({
        sessionId: mergeNodes[0].apiSessionId,
        branchIds: mergeNodes.map((node) => node.id),
        name: `병합: ${mergeNodes.map((node) => node.title).join(' + ')}`,
      })
      const mergedBranchId = readBranchId(mergedBranch)

      if (!mergedBranchId) {
        throw new Error('합쳐진 노드 ID를 확인할 수 없습니다.')
      }

      const nextState = await loadGraphState({
        activeNodeId: mergedBranchId,
        selectedRootNodeId: mergeNodes[0].rootId,
        loadMessages: true,
      })

      if (nextState) {
        setGraphState(
          setMergedNodeParentLinks(
            nextState,
            mergedBranchId,
            mergeNodes.map((node) => node.id),
          ),
        )
      }

      setNodeNavigationKey((currentKey) => currentKey + 1)
      setMergeNodeIds([])
      setMergeRecommendation(null)
      setIsFullscreenGraphOpen(false)
      setIsLandingVisible(false)
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleOpenFullscreenGraph = () => {
    setMergeNodeIds([])
    setMergeRecommendation(null)
    setIsFullscreenGraphOpen(true)
  }

  const handleCloseFullscreenGraph = () => {
    setMergeNodeIds([])
    setMergeRecommendation(null)
    setIsFullscreenGraphOpen(false)
  }

  const handleToggleGraphLayout = () => {
    setGraphLayoutDirection((currentDirection) =>
      currentDirection === 'vertical' ? 'horizontal' : 'vertical',
    )
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
    setPendingUserMessage(messageText)
    setIsLandingVisible(false)

    try {
      await branchGraphApi.sendChatMessage({
        branchId,
        message: messageText,
        modelProvider: selectedChatModel.provider,
        modelName: selectedChatModel.name,
      })
      await loadGraphState({
        activeNodeId: branchId,
        selectedRootNodeId: graphStateRef.current.selectedRootNodeId,
        loadMessages: true,
      })
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingUserMessage('')
      setPendingAction('')
    }
  }

  const handleOpenModelComparison = (messageText) => {
    setErrorMessage('')
    setModelComparisonFlow({ prompt: messageText ?? '', comparison: null, analysis: null, minimized: false })
  }

  const handleStartModelComparison = async (prompt, models) => {
    const branchId = graphStateRef.current.activeNodeId
    const currentFlow = modelComparisonFlow

    if (!branchId || !currentFlow || !prompt || models.length !== 2) {
      return
    }

    setPendingAction('모델 답변 비교 중')
    setErrorMessage('')
    setModelComparisonFlow((flow) => flow ? { ...flow, prompt } : flow)

    try {
      const response = await branchGraphApi.compareModels({
        branchId,
        message: prompt,
        modelA: models[0],
        modelB: models[1],
      })
      const comparisonId = response?.comparison_id ?? response?.comparisonId

      if (!comparisonId) {
        throw new Error('모델 비교 ID를 확인할 수 없습니다.')
      }

      setModelComparisonFlow((flow) => flow ? {
        ...flow,
        comparison: {
          id: comparisonId,
          modelA: models[0],
          modelB: models[1],
          responseA: readComparisonContent(response?.response_a ?? response?.responseA),
          responseB: readComparisonContent(response?.response_b ?? response?.responseB),
        },
      } : flow)
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleAnalyzeModelComparison = async () => {
    const comparisonId = modelComparisonFlow?.comparison?.id

    if (!comparisonId) {
      return
    }

    setPendingAction('답변 분석 중')
    setErrorMessage('')

    try {
      const analysis = await branchGraphApi.analyzeComparison(comparisonId)
      setModelComparisonFlow((flow) => flow ? { ...flow, analysis } : flow)
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleSelectComparedAnswer = async (selected, model) => {
    const comparisonId = modelComparisonFlow?.comparison?.id
    const branchId = graphStateRef.current.activeNodeId

    if (!comparisonId || !branchId) {
      return
    }

    setPendingAction('선택한 답변 적용 중')
    setErrorMessage('')

    try {
      await branchGraphApi.selectComparison(comparisonId, selected)
      setSelectedChatModel(model)
      setComparisonResetKey((key) => key + 1)
      setModelComparisonFlow(null)
      setIsLandingVisible(false)
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

  const handleMergeComparedAnswers = async (instruction) => {
    const comparisonId = modelComparisonFlow?.comparison?.id
    const branchId = graphStateRef.current.activeNodeId

    if (!comparisonId || !branchId) {
      return
    }

    const mergeModel = ['openai', 'anthropic'].includes(selectedChatModel.provider)
      ? selectedChatModel
      : COMPARISON_MODEL_OPTIONS[0]

    setPendingAction('답변 융합 중')
    setErrorMessage('')

    try {
      await branchGraphApi.mergeComparison(comparisonId, {
        instruction,
        modelProvider: mergeModel.provider,
        modelName: mergeModel.name,
      })
      setSelectedChatModel(mergeModel)
      setComparisonResetKey((key) => key + 1)
      setModelComparisonFlow(null)
      setIsLandingVisible(false)
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

  const handleOpenHome = () => {
    setIsMobileSidebarOpen(false)
    setIsLandingVisible(true)
  }

  const handleRenameSession = async (rootNodeId, title) => {
    const currentState = graphStateRef.current
    const rootNode = getNodeById(currentState.nodes, rootNodeId)

    if (!rootNode?.apiSessionId) {
      return
    }

    setPendingAction('세션 이름 변경 중')

    try {
      await branchGraphApi.updateSession(rootNode.apiSessionId, { title })
      await loadGraphState({
        activeNodeId: currentState.activeNodeId,
        selectedRootNodeId: currentState.selectedRootNodeId,
        loadMessages: true,
      })
      setErrorMessage('')
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

  const handleMoveSessionToTrash = async (rootNodeId) => {
    const currentState = graphStateRef.current
    const rootNode = getNodeById(currentState.nodes, rootNodeId)

    if (!rootNode || rootNode.parentId !== null) {
      return
    }

    const branchIds = getSubtreeNodeIds(currentState.nodes, rootNodeId)
    const childBranchCount = Math.max(0, branchIds.length - 1)
    const confirmed = window.confirm(
      `“${rootNode.title}” 세션과 하위 브랜치 ${childBranchCount}개를 휴지통으로 이동할까요?`,
    )

    if (!confirmed) {
      return
    }

    const isDeletingCurrentTree =
      branchIds.includes(currentState.activeNodeId) ||
      currentState.selectedRootNodeId === rootNodeId

    setIsMobileSidebarOpen(false)
    setPendingAction('세션 휴지통 이동 중')

    try {
      await branchGraphApi.deleteSession(rootNode.apiSessionId)
      await loadGraphState({
        activeNodeId: isDeletingCurrentTree ? undefined : currentState.activeNodeId,
        selectedRootNodeId: isDeletingCurrentTree ? undefined : currentState.selectedRootNodeId,
        loadMessages: !isDeletingCurrentTree,
      })
      if (isDeletingCurrentTree) {
        setIsLandingVisible(true)
      }
      setErrorMessage('')
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
      if (node.trashType === 'session') {
        await branchGraphApi.restoreSession(node.apiSessionId)
        await loadGraphState({ loadMessages: false })
        setIsLandingVisible(true)
        return
      }

      await Promise.all(branchIds.map((branchId) => branchGraphApi.restoreBranch(branchId)))
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
      node.trashType === 'session'
        ? `“${node.title}” 세션을 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.`
        : `“${node.title}”과 관련된 ${branchCount}개 브랜치를 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
    )

    if (!confirmed) {
      return
    }

    setPendingAction('영구 삭제 중')

    try {
      if (node.trashType === 'session') {
        await branchGraphApi.purgeSession(node.apiSessionId)
      } else {
        await branchGraphApi.deleteBranch(nodeId)
      }
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
    modelComparisonFlow?.minimized ? 'model-comparison-is-minimized' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main
      className={appShellClassName}
      onClickCapture={(event) => {
        if (
          modelComparisonFlow?.minimized
          && !event.target.closest('.model-comparison-minimized-bar')
        ) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
      onKeyDownCapture={(event) => {
        if (
          modelComparisonFlow?.minimized
          && ['Enter', ' '].includes(event.key)
          && !event.target.closest('.model-comparison-minimized-bar')
        ) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      <StartNodeSidebar
        graphState={graphState}
        rootNodes={rootNodes}
        isCollapsed={isSidebarCollapsed}
        isDrawerMode={isNarrowViewport}
        isMobileDrawerOpen={isMobileSidebarOpen}
        isBusy={isBusy}
        onToggleCollapse={handleToggleSidebar}
        onOpenHome={handleOpenHome}
        onNewChat={handleOpenLanding}
        onSelectRoot={handleSelectRoot}
        onMoveSessionToTrash={handleMoveSessionToTrash}
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
          {!isLandingVisible && activeNode ? (
            <span className={isActiveNodeOnMainPath ? 'topbar-path-status main' : 'topbar-path-status branch'}>
              {isActiveNodeOnMainPath ? 'main 경로' : '분기 경로'}
            </span>
          ) : null}
          {!isLandingVisible && activeNode ? (
            <button
              type="button"
              className={isMiniGraphOpen ? 'graph-toggle-button active' : 'graph-toggle-button'}
              aria-expanded={isMiniGraphOpen}
              onClick={() => setIsMiniGraphOpen((currentValue) => !currentValue)}
            >
              <span aria-hidden="true">◇</span>
              {isMiniGraphOpen ? '시각화 닫기' : '시각화 열기'}
            </button>
          ) : null}
          <div className="topbar-actions" aria-label="작업 도구">
            <span>알림</span>
            <span>도움말</span>
            <span>계정</span>
          </div>
        </header>

        {errorMessage ? <div className="api-error">{errorMessage}</div> : null}

        <div
          className={[
            'workspace-content',
            isLandingVisible ? 'landing-visible' : 'chat-visible',
            isMiniGraphOpen && !isLandingVisible ? 'graph-panel-open' : '',
          ].filter(Boolean).join(' ')}
        >
          <div className="workspace-primary">
            {isLoading && !activeNode ? (
              <section className="empty-state" aria-label="초기 데이터 동기화">
                <p className="eyebrow">API 동기화</p>
                <h1>세션과 브랜치 정보를 불러오는 중이다.</h1>
              </section>
            ) : isLandingVisible ? (
              <ChatLanding
                activeNode={activeNode}
                isBusy={isBusy}
                onSendMessage={handleSendMessage}
                onOpenModelComparison={handleOpenModelComparison}
              />
            ) : (
                <ChatWorkspace
                  key={`${activeNode?.id ?? 'chat'}:${comparisonResetKey}`}
                  activeNode={activeNode}
                  graphState={graphState}
                nodeNavigationKey={nodeNavigationKey}
                isBusy={isBusy}
                isAwaitingResponse={pendingAction === '메시지 전송 중'}
                pendingUserMessage={pendingUserMessage}
                modelOptions={CHAT_MODEL_OPTIONS}
                selectedModel={selectedChatModel}
                onChangeModel={setSelectedChatModel}
                onOpenModelComparison={handleOpenModelComparison}
                onSendMessage={handleSendMessage}
                onCreateBranch={handleCreateBranch}
                onRenameSession={handleRenameSession}
              />
            )}
          </div>

          {!isLandingVisible && isMiniGraphOpen ? (
            <TopMiniGraph
              graphState={graphState}
              activeNode={activeNode}
              onSelectNode={handleSelectTopGraphNode}
              onSetMainTarget={handleSetMainTarget}
              onRenameNode={handleRenameNode}
              onToggleNodeCollapse={handleToggleNodeCollapse}
              onStartNodeMerge={handleStartNodeMerge}
              onMoveToTrash={handleMoveToTrash}
              onOpenFullscreen={handleOpenFullscreenGraph}
              onClose={() => setIsMiniGraphOpen(false)}
              layoutDirection={graphLayoutDirection}
              onToggleLayout={handleToggleGraphLayout}
            />
          ) : null}
        </div>
      </section>

      {isFullscreenGraphOpen ? (
        <FullscreenGraphModal
          graphState={graphState}
          onClose={handleCloseFullscreenGraph}
          onSelectNode={handleSelectTopGraphNode}
          onSetMainTarget={handleSetMainTarget}
          onRenameNode={handleRenameNode}
          onToggleNodeCollapse={handleToggleNodeCollapse}
          onStartNodeMerge={handleStartNodeMerge}
          onMoveToTrash={handleMoveToTrash}
          layoutDirection={graphLayoutDirection}
          onToggleLayout={handleToggleGraphLayout}
          mergeNodeIds={mergeNodeIds}
          onSelectMergeNode={handleSelectMergeNode}
          onConfirmMerge={handleConfirmMerge}
          isMerging={pendingAction === '노드 합치는 중'}
          mergeRecommendation={mergeRecommendation}
          isMergeRecommendationLoading={isMergeRecommendationLoading}
          mergeRecommendationError={mergeRecommendationError}
        />
      ) : null}

      {modelComparisonFlow ? (
        <ModelComparisonFlow
          prompt={modelComparisonFlow.prompt}
          modelOptions={COMPARISON_MODEL_OPTIONS}
          comparison={modelComparisonFlow.comparison}
          analysis={modelComparisonFlow.analysis}
          isMinimized={Boolean(modelComparisonFlow.minimized)}
          isBusy={Boolean(pendingAction)}
          onStartComparison={handleStartModelComparison}
          onAnalyze={handleAnalyzeModelComparison}
          onSelectAnswer={handleSelectComparedAnswer}
          onMerge={handleMergeComparedAnswers}
          onToggleMinimize={() => {
            if (!pendingAction) {
              setModelComparisonFlow((flow) => flow ? { ...flow, minimized: !flow.minimized } : flow)
            }
          }}
          onClose={() => {
            if (!pendingAction) {
              setModelComparisonFlow(null)
            }
          }}
        />
      ) : null}
    </main>
  )
}

function getDisplayError(error) {
  return error?.message ?? '알 수 없는 오류가 발생했다.'
}

function readComparisonContent(response) {
  if (typeof response === 'string') {
    return response
  }

  return response?.content ?? response?.reply ?? response?.response ?? '응답 내용을 확인할 수 없습니다.'
}

async function loadSessionGraphResponse(session) {
  const sessionId = readSessionId(session)
  const [graph, branches, branchTrash] = await Promise.all([
    branchGraphApi.getSessionGraph(sessionId, true),
    branchGraphApi.listBranches(sessionId),
    branchGraphApi.listBranchTrash(sessionId),
  ])

  return { session, graph, branches, branchTrash }
}

function resolveSessionToLoad({ apiSessions, currentState, activeNodeId, selectedRootNodeId }) {
  const activeNode = getNodeById(currentState.nodes, activeNodeId ?? currentState.activeNodeId)
  const selectedRootId = selectedRootNodeId ?? activeNode?.rootId ?? currentState.selectedRootNodeId
  const selectedRootNode = getNodeById(currentState.nodes, selectedRootId)
  const selectedApiSessionId = activeNode?.apiSessionId ?? selectedRootNode?.apiSessionId

  return (
    apiSessions.find((session) => readMainBranchId(session) === selectedRootId) ??
    apiSessions.find((session) => readSessionId(session) === selectedApiSessionId) ??
    apiSessions[0] ??
    null
  )
}

function createNewRootNodeTitle(rootNodes) {
  const newChatRootCount = rootNodes.filter((node) => /^새 대화(?: \d+)?$/.test(node.title)).length

  return newChatRootCount === 0 ? '새 대화' : `새 대화 ${newChatRootCount + 1}`
}

export default App
