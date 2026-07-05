import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './Modern.css'
import { ChatLanding } from './components/ChatLanding.jsx'
import { ChatWorkspace } from './components/ChatWorkspace.jsx'
import { FullscreenGraphModal } from './components/FullscreenGraphModal.jsx'
import { ModelComparisonFlow } from './components/ModelComparisonFlow.jsx'
import { RamoLogo } from './components/RamoLogo.jsx'
import { SplitConversationPanel } from './components/SplitConversationPanel.jsx'
import { SplitResizeHandle } from './components/SplitResizeHandle.jsx'
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
  getBranchPath,
  getMainLeafNodeForRoot,
  getMainPathNodeIds,
  getNodeById,
  getRootNodes,
  getSessionByNodeId,
  getSubtreeNodeIds,
  selectNode,
  renameNode,
  clearNodePersonaForSubtree,
  setMainTargetNode,
  setMergedNodeParentLinks,
  setNodeCollapsed,
  setNodePersonaForSubtree,
  shouldUseInheritedMessagesForNode,
} from './features/branchGraph/branchGraphModel.js'
import { createSessionContentCache } from './features/branchGraph/sessionContentCache.js'

const CHATKHU_MODEL_GROUPS = {
  anthropic: { groupLabel: 'CLAUDE', mark: '✺' },
  google: { groupLabel: 'GEMINI', mark: '◆' },
  xai: { groupLabel: 'X-AI', mark: '𝕏' },
  gemma: { groupLabel: 'GEMMA', mark: 'G' },
  meta: { groupLabel: 'META', mark: '∞' },
  perplexity: { groupLabel: 'PERPLEXITY', mark: '⌬' },
  upstage: { groupLabel: 'UPSTAGE', mark: 'U' },
  lgai: { groupLabel: 'LG AI', mark: 'L' },
}

function createChatKhuModel(group, name, label, extra = {}) {
  return {
    provider: 'chatkhu',
    name,
    label,
    group,
    ...CHATKHU_MODEL_GROUPS[group],
    ...extra,
  }
}

const CHAT_MODEL_OPTIONS = [
  { provider: 'openai', name: 'gpt-5.3-chat-latest', label: 'GPT-5.3 Chat' },
  { provider: 'openai', name: 'gpt-5.5', label: 'GPT-5.5' },
  { provider: 'openai', name: 'gpt-5.4', label: 'GPT-5.4' },
  { provider: 'openai', name: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
  { provider: 'openai', name: 'gpt-5.4-nano', label: 'GPT-5.4 nano' },
  { provider: 'openai', name: 'gpt-5.2-chat-latest', label: 'GPT-5.2 Chat' },
  { provider: 'openai', name: 'gpt-5.2', label: 'GPT-5.2' },
  { provider: 'openai', name: 'gpt-5.1-chat-latest', label: 'GPT-5.1 Chat' },
  { provider: 'openai', name: 'gpt-5.1', label: 'GPT-5.1' },
  { provider: 'openai', name: 'gpt-5-chat-latest', label: 'GPT-5 Chat' },
  { provider: 'openai', name: 'gpt-5', label: 'GPT-5' },
  { provider: 'openai', name: 'gpt-5-mini', label: 'GPT-5 mini' },
  createChatKhuModel('anthropic', 'claude-sonnet-4-6', 'Claude Sonnet 4.6'),
  createChatKhuModel('anthropic', 'claude-sonnet-5', 'Claude Sonnet 5'),
  createChatKhuModel('anthropic', 'claude-fable-5', 'Claude Fable 5'),
  createChatKhuModel('anthropic', 'claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5'),
  createChatKhuModel('anthropic', 'claude-opus-4-8', 'Claude Opus 4.8'),
  createChatKhuModel('anthropic', 'claude-opus-4-7', 'Claude Opus 4.7'),
  createChatKhuModel('anthropic', 'claude-opus-4-6', 'Claude Opus 4.6'),
  createChatKhuModel('anthropic', 'claude-opus-4-5-20251101', 'Claude Opus 4.5'),
  createChatKhuModel('anthropic', 'claude-haiku-4-5-20251001', 'Claude Haiku 4.5'),
  createChatKhuModel('google', 'gemini-3.5-flash', 'Gemini 3.5 Flash'),
  createChatKhuModel('google', 'gemini-3.1-pro-preview', 'Gemini 3.1 Pro Preview'),
  createChatKhuModel('google', 'gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite'),
  createChatKhuModel('google', 'gemini-3-flash-preview', 'Gemini 3 Flash Preview'),
  createChatKhuModel('google', 'gemini-2.5-flash', 'Gemini 2.5 Flash'),
  createChatKhuModel('google', 'gemini-2.5-pro', 'Gemini 2.5 Pro'),
  createChatKhuModel('xai', 'grok-4-1-fast', 'Grok 4.1 Fast'),
  createChatKhuModel('xai', 'grok-3-mini', 'Grok 3 Mini'),
  createChatKhuModel('xai', 'grok-4', 'Grok 4'),
  createChatKhuModel('gemma', 'google/gemma-4-31B-it', 'Gemma 4 31B IT'),
  createChatKhuModel('gemma', 'google/gemma-3-27b-it', 'Gemma 3 27B IT'),
  createChatKhuModel('meta', 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', 'Llama 4 Maverick'),
  createChatKhuModel('perplexity', 'sonar-pro', 'Sonar Pro'),
  createChatKhuModel('perplexity', 'sonar-reasoning-pro', 'Sonar Reasoning Pro'),
  createChatKhuModel('upstage', 'solar-pro3', 'Solar Pro 3'),
  createChatKhuModel('upstage', 'solar-pro2', 'Solar Pro 2'),
  createChatKhuModel('lgai', 'LGAI-EXAONE/K-EXAONE-236B-A23B', 'K-EXAONE 236B'),
]
const OPENAI_COMPARISON_MODEL_OPTIONS = [
  { provider: 'openai', name: 'gpt-5.3-chat-latest', label: 'GPT-5.3 Chat' },
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
]
const COMPARISON_MODEL_OPTIONS = [
  ...OPENAI_COMPARISON_MODEL_OPTIONS,
  ...CHAT_MODEL_OPTIONS.filter((model) => model.provider !== 'openai'),
]
const DESKTOP_SIDEBAR_MEDIA_QUERY = '(min-width: 921px)'
const DEFAULT_SPLIT_CHAT_SHARE = 0.5
const MIN_CHAT_SPLIT_SHARE = 0.35
const MAX_CHAT_SPLIT_SHARE = 0.65
const MIN_CHAT_PANE_WIDTH = 260
const DEFAULT_GRAPH_SPLIT_WIDTH = 332
const MIN_GRAPH_SPLIT_WIDTH = 332
const SPLIT_HANDLE_WIDTH = 9

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
        if (reason.text) {
          return reason.text
        }

        const score = Number(reason.score)
        return Number.isFinite(score)
          ? `대화 내용의 유사도가 ${Math.round(score * 100)}%로 높습니다.`
          : '대화 내용과 주제가 유사합니다.'
      }

      if (reason?.type === 'role') {
        if (reason.text) {
          return reason.text
        }

        const labels = reason.matched ?? reason.tags ?? reason.roles ?? reason.shared_roles ?? []
        return labels.length > 0
          ? `공통 태그 ${labels.join(', ')}를 공유합니다.`
          : '대화에서 수행하는 역할이 유사합니다.'
      }

      return reason?.text ?? reason?.description ?? reason?.message ?? ''
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
  const [isMiniGraphOpen, setIsMiniGraphOpen] = useState(false)
  const [splitNodeId, setSplitNodeId] = useState(null)
  const [splitChatShare, setSplitChatShare] = useState(DEFAULT_SPLIT_CHAT_SHARE)
  const [graphSplitWidth, setGraphSplitWidth] = useState(DEFAULT_GRAPH_SPLIT_WIDTH)
  const [graphLayoutDirection, setGraphLayoutDirection] = useState('vertical')
  const [nodeNavigationKey, setNodeNavigationKey] = useState(0)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  const [isLandingVisible, setIsLandingVisible] = useState(true)
  const [isNewChatDraft, setIsNewChatDraft] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedChatModel, setSelectedChatModel] = useState(() => CHAT_MODEL_OPTIONS[0])
  const [selectedSplitChatModel, setSelectedSplitChatModel] = useState(() => CHAT_MODEL_OPTIONS[0])
  const [pendingUserMessage, setPendingUserMessage] = useState('')
  const [pendingSplitUserMessage, setPendingSplitUserMessage] = useState('')
  const [attachedFilesByBranchId, setAttachedFilesByBranchId] = useState({})
  const [messageAttachmentsById, setMessageAttachmentsById] = useState({})
  const [pendingUserAttachments, setPendingUserAttachments] = useState([])
  const [pendingSplitUserAttachments, setPendingSplitUserAttachments] = useState([])
  const [attachmentPreviewFile, setAttachmentPreviewFile] = useState(null)
  const [fileUploadState, setFileUploadState] = useState(null)
  const [modelComparisonFlow, setModelComparisonFlow] = useState(null)
  const [comparisonResetKey, setComparisonResetKey] = useState(0)
  const graphStateRef = useRef(graphState)
  const sessionContentCacheRef = useRef(createSessionContentCache())
  const splitWorkspaceRef = useRef(null)

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
  const splitNodeCandidate = getNodeById(graphState.nodes, splitNodeId)
  const splitNode = splitNodeCandidate?.id !== graphState.activeNodeId && !splitNodeCandidate?.isHidden
    ? splitNodeCandidate
    : null
  const activeMainPathNodeIds = activeNode
    ? getMainPathNodeIds(graphState, activeNode.rootId)
    : new Set()
  const isActiveNodeOnMainPath = activeNode ? activeMainPathNodeIds.has(activeNode.id) : false
  const isBusy = isLoading || Boolean(pendingAction)
  const isSplitViewOpen = Boolean(splitNode || isMiniGraphOpen)
  const activeRootNode = activeNode ? getNodeById(graphState.nodes, activeNode.rootId) : null
  const activeBranchPath = activeNode ? getBranchPath(graphState.nodes, activeNode.id) : []
  const activeAttachmentBranchId = isNewChatDraft ? null : activeNode?.id
  const activeAttachedFiles = activeAttachmentBranchId
    ? getDraftAttachmentFiles(
        attachedFilesByBranchId[activeAttachmentBranchId] ?? [],
        messageAttachmentsById,
        activeAttachmentBranchId,
      )
    : []
  const activeUploadState = shouldShowUploadState(fileUploadState, activeAttachmentBranchId)
    ? fileUploadState
    : null
  const splitAttachedFiles = splitNode?.id
    ? getDraftAttachmentFiles(
        attachedFilesByBranchId[splitNode.id] ?? [],
        messageAttachmentsById,
        splitNode.id,
      )
    : []
  const splitUploadState = shouldShowUploadState(fileUploadState, splitNode?.id)
    ? fileUploadState
    : null

  const loadGraphState = useCallback(
    async ({
      activeNodeId,
      selectedRootNodeId,
      loadMessages = true,
      includeInheritedMessages,
      forceRefresh = false,
    } = {}) => {
      setIsLoading(graphStateRef.current.nodes.length === 0)

      try {
        const { activeSessions, trashSessions } =
          await sessionContentCacheRef.current.getSessionLists(
            async () => {
              const [nextActiveSessions, nextTrashSessions] = await Promise.all([
                branchGraphApi.listSessions(),
                branchGraphApi.listTrashSessions(),
              ])

              return {
                activeSessions: nextActiveSessions,
                trashSessions: nextTrashSessions,
              }
            },
            { force: forceRefresh },
          )
        let apiSessions = activeSessions

        if (apiSessions.length === 0) {
          apiSessions = [await branchGraphApi.createSession()]
          sessionContentCacheRef.current.invalidateAll()
        }

        const sessionToLoad = resolveSessionToLoad({
          apiSessions,
          currentState: graphStateRef.current,
          activeNodeId,
          selectedRootNodeId,
        })
        const graphResponses = sessionToLoad
          ? [
              await loadSessionGraphResponse(sessionToLoad, sessionContentCacheRef.current, {
                force: forceRefresh,
              }),
            ]
          : []
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
          const shouldIncludeInherited =
            includeInheritedMessages ?? shouldUseInheritedMessagesForNode(nextActiveNode)
          const messages = await sessionContentCacheRef.current.getBranchMessages(
            nextActiveNode.id,
            shouldIncludeInherited,
            () => branchGraphApi.getBranchMessages(nextActiveNode.id, shouldIncludeInherited),
            { force: forceRefresh },
          )
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
    const node = getNodeById(graphStateRef.current.nodes, branchId)
    const includeInheritedMessages = shouldUseInheritedMessagesForNode(node)
    const cachedMessages = sessionContentCacheRef.current.readBranchMessages(
      branchId,
      includeInheritedMessages,
    )

    if (cachedMessages) {
      setGraphState((currentState) => {
        const selectedState = selectNode(currentState, branchId)
        return applyBranchMessages(selectedState, branchId, cachedMessages)
      })
      setErrorMessage('')
      return
    }

    setPendingAction('메시지 동기화 중')

    try {
      const messages = await sessionContentCacheRef.current.getBranchMessages(
        branchId,
        includeInheritedMessages,
        () => branchGraphApi.getBranchMessages(branchId, includeInheritedMessages),
      )

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

  useEffect(() => {
    if (!activeNode?.id || isNewChatDraft) {
      return undefined
    }

    let isCancelled = false

    branchGraphApi.listBranchFiles(activeNode.id)
      .then((branchFiles) => {
        if (!isCancelled && Array.isArray(branchFiles)) {
          setAttachedFilesByBranchId((currentFilesByBranchId) => ({
            ...currentFilesByBranchId,
            [activeNode.id]: mergeAttachmentFiles(
              branchFiles,
              currentFilesByBranchId[activeNode.id] ?? [],
            ),
          }))
        }
      })
      .catch(() => {})

    return () => {
      isCancelled = true
    }
  }, [activeNode?.id, isNewChatDraft])

  const handleSelectRoot = (rootId) => {
    const mainLeafNode = getMainLeafNodeForRoot(graphStateRef.current, rootId)

    setIsMobileSidebarOpen(false)

    setNodeNavigationKey((currentKey) => currentKey + 1)
    setIsNewChatDraft(false)
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
    setIsNewChatDraft(false)
    setIsLandingVisible(false)
    void loadBranchMessages(nodeId)
  }

  const handleSelectTopGraphNode = (nodeId) => {
    handleSelectNode(nodeId)
  }

  const handleOpenSplitNode = async (nodeId) => {
    if (!nodeId || nodeId === graphStateRef.current.activeNodeId) {
      return
    }

    const cachedMessages = sessionContentCacheRef.current.readBranchMessages(nodeId, true)

    if (cachedMessages) {
      setGraphState((currentState) => applyBranchMessages(currentState, nodeId, cachedMessages))
      setSplitNodeId(nodeId)
      setErrorMessage('')
      return
    }

    setPendingAction('스플릿 대화 불러오는 중')
    setErrorMessage('')

    try {
      const messages = await sessionContentCacheRef.current.getBranchMessages(
        nodeId,
        true,
        () => branchGraphApi.getBranchMessages(nodeId, true),
      )
      setGraphState((currentState) => applyBranchMessages(currentState, nodeId, messages))
      setSplitNodeId(nodeId)
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleSetMainTarget = async (nodeId) => {
    setPendingAction('main 경로 저장 중')
    setErrorMessage('')

    try {
      await branchGraphApi.selectMainBranch(nodeId)
      sessionContentCacheRef.current.invalidateAll()
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
      sessionContentCacheRef.current.invalidateAll()
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
      sessionContentCacheRef.current.invalidateAll()
      setGraphState((currentState) => setNodeCollapsed(currentState, nodeId, isCollapsed))
    } catch (error) {
      setErrorMessage(getDisplayError(error))
      throw error
    } finally {
      setPendingAction('')
    }
  }

  const handleSetNodePersona = async (nodeId, persona) => {
    setPendingAction('페르소나 지정 중')
    setErrorMessage('')
    const previousState = graphStateRef.current
    const targetNodeIds = getSubtreeNodeIds(previousState.nodes, nodeId)
    setGraphState((currentState) => setNodePersonaForSubtree(currentState, nodeId, persona))

    try {
      await Promise.all(targetNodeIds.map((targetNodeId) => branchGraphApi.setBranchPersona(targetNodeId, persona)))
      sessionContentCacheRef.current.invalidateAll()
    } catch (error) {
      setGraphState(previousState)
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleClearNodePersona = async (nodeId) => {
    setPendingAction('페르소나 해제 중')
    setErrorMessage('')
    const previousState = graphStateRef.current
    const targetNodeIds = getSubtreeNodeIds(previousState.nodes, nodeId)
    setGraphState((currentState) => clearNodePersonaForSubtree(currentState, nodeId))

    try {
      await Promise.all(targetNodeIds.map((targetNodeId) => branchGraphApi.clearBranchPersona(targetNodeId)))
      sessionContentCacheRef.current.invalidateAll()
    } catch (error) {
      setGraphState(previousState)
      setErrorMessage(getDisplayError(error))
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
      sessionContentCacheRef.current.invalidateAll()
      const mergedBranchId = readBranchId(mergedBranch)

      if (!mergedBranchId) {
        throw new Error('합쳐진 노드 ID를 확인할 수 없습니다.')
      }

      const nextState = await loadGraphState({
        activeNodeId: mergedBranchId,
        selectedRootNodeId: mergeNodes[0].rootId,
        loadMessages: true,
        forceRefresh: true,
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
      setIsNewChatDraft(false)
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

  const createDraftSession = useCallback(async () => {
    const newRootTitle = createNewRootNodeTitle(getRootNodes(graphStateRef.current.nodes))

    const session = await branchGraphApi.createSession(newRootTitle)
    sessionContentCacheRef.current.invalidateAll()
    const mainBranchId = readMainBranchId(session)

    if (!mainBranchId) {
      throw new Error('새 루트 노드 ID를 세션 생성 응답에서 확인할 수 없다.')
    }

    const nextState = await loadGraphState({
      activeNodeId: mainBranchId,
      selectedRootNodeId: mainBranchId,
      loadMessages: false,
      forceRefresh: true,
    })

    if (!nextState) {
      throw new Error('새 대화 상태를 불러오지 못했습니다.')
    }

    setIsNewChatDraft(false)

    return mainBranchId
  }, [loadGraphState])

  const handleOpenNewChatDraft = () => {
    setIsMobileSidebarOpen(false)
    setIsMiniGraphOpen(false)
    setSplitNodeId(null)
    setModelComparisonFlow(null)
    setErrorMessage('')
    setIsNewChatDraft(true)
    setIsLandingVisible(true)
  }

  const handleSendMessage = async (messageText) => {
    let branchId = graphStateRef.current.activeNodeId
    let selectedRootNodeId = graphStateRef.current.selectedRootNodeId
    const shouldCreateDraftSession = isNewChatDraft || !branchId
    let outgoingAttachments = []

    if (!branchId && !shouldCreateDraftSession) {
      return
    }

    setPendingAction(shouldCreateDraftSession ? '새 대화 생성 중' : '메시지 전송 중')
    setPendingUserMessage(messageText)
    if (!shouldCreateDraftSession) {
      setIsLandingVisible(false)
    }

    try {
      if (shouldCreateDraftSession) {
        branchId = await createDraftSession()
        selectedRootNodeId = branchId
        setIsNewChatDraft(false)
        setIsLandingVisible(false)
        setPendingAction('메시지 전송 중')
      }

      outgoingAttachments = createMessageAttachmentSnapshot(
        getDraftAttachmentFiles(
          attachedFilesByBranchId[branchId] ?? [],
          messageAttachmentsById,
          branchId,
        ),
        branchId,
      )
      setPendingUserAttachments(outgoingAttachments)

      const personaNode = getNodeById(graphStateRef.current.nodes, branchId)

      const sendResponse = await branchGraphApi.sendChatMessage({
        branchId,
        message: messageText,
        modelProvider: selectedChatModel.provider,
        modelName: selectedChatModel.name,
        personaKey: personaNode?.personaKey,
        personaName: personaNode?.personaName,
        fileIds: outgoingAttachments.map(readAttachmentFileId).filter(Boolean),
      })
      sessionContentCacheRef.current.invalidateAll()
      const nextState = await loadGraphState({
        activeNodeId: branchId,
        selectedRootNodeId,
        loadMessages: true,
        forceRefresh: true,
      })
      const sentUserMessageId =
        readSentUserMessageId(sendResponse) ??
        findLatestSentUserMessageId(nextState ?? graphStateRef.current, branchId, messageText)

      if (sentUserMessageId && outgoingAttachments.length > 0) {
        setMessageAttachmentsById((currentAttachmentsById) => ({
          ...currentAttachmentsById,
          [sentUserMessageId]: readSentUserMessageAttachments(sendResponse) ?? outgoingAttachments,
        }))
        setAttachedFilesByBranchId((currentFilesByBranchId) =>
          removeAttachedFilesByIds(currentFilesByBranchId, branchId, outgoingAttachments),
        )
      }
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingUserMessage('')
      setPendingUserAttachments([])
      setPendingAction('')
    }
  }

  const handleSendSplitMessage = async (messageText) => {
    const branchId = splitNodeId

    if (!branchId) {
      return
    }

    setPendingAction('스플릿 메시지 전송 중')
    setPendingSplitUserMessage(messageText)
    setErrorMessage('')
    const outgoingAttachments = createMessageAttachmentSnapshot(
      getDraftAttachmentFiles(
        attachedFilesByBranchId[branchId] ?? [],
        messageAttachmentsById,
        branchId,
      ),
      branchId,
    )
    setPendingSplitUserAttachments(outgoingAttachments)

    try {
      const personaNode = getNodeById(graphStateRef.current.nodes, branchId)

      const sendResponse = await branchGraphApi.sendChatMessage({
        branchId,
        message: messageText,
        modelProvider: selectedSplitChatModel.provider,
        modelName: selectedSplitChatModel.name,
        personaKey: personaNode?.personaKey,
        personaName: personaNode?.personaName,
        fileIds: outgoingAttachments.map(readAttachmentFileId).filter(Boolean),
      })
      sessionContentCacheRef.current.invalidateAll()
      const messages = await sessionContentCacheRef.current.getBranchMessages(
        branchId,
        true,
        () => branchGraphApi.getBranchMessages(branchId, true),
        { force: true },
      )
      setGraphState((currentState) => applyBranchMessages(currentState, branchId, messages))
      const sentUserMessageId =
        readSentUserMessageId(sendResponse) ??
        findLatestSentUserMessageIdFromMessages(messages, branchId, messageText)

      if (sentUserMessageId && outgoingAttachments.length > 0) {
        setMessageAttachmentsById((currentAttachmentsById) => ({
          ...currentAttachmentsById,
          [sentUserMessageId]: readSentUserMessageAttachments(sendResponse) ?? outgoingAttachments,
        }))
        setAttachedFilesByBranchId((currentFilesByBranchId) =>
          removeAttachedFilesByIds(currentFilesByBranchId, branchId, outgoingAttachments),
        )
      }
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingSplitUserMessage('')
      setPendingSplitUserAttachments([])
      setPendingAction('')
    }
  }

  const handleAttachFiles = async (incomingFiles, {
    branchId,
    selectedRootNodeId,
    model = selectedChatModel,
  } = {}) => {
    const files = normalizeIncomingFiles(incomingFiles)

    if (files.length === 0) {
      return
    }

    let targetBranchId = branchId ?? graphStateRef.current.activeNodeId
    let targetRootNodeId = selectedRootNodeId ?? graphStateRef.current.selectedRootNodeId
    const shouldCreateDraftSession = !branchId && (isNewChatDraft || !targetBranchId)

    setErrorMessage('')
    setPendingAction(shouldCreateDraftSession ? '첨부용 대화 생성 중' : '파일 첨부 중')
    setFileUploadState({
      branchId: shouldCreateDraftSession ? null : targetBranchId || null,
      phase: 'uploading',
      message: shouldCreateDraftSession ? '첨부할 대화를 준비하는 중이다.' : `${files.length}개 파일을 첨부하는 중이다.`,
    })

    try {
      if (shouldCreateDraftSession) {
        targetBranchId = await createDraftSession()
        targetRootNodeId = targetBranchId
        setPendingAction('파일 첨부 중')
        setFileUploadState({
          branchId: targetBranchId,
          phase: 'uploading',
          message: `${files.length}개 파일을 첨부하는 중이다.`,
        })
      }

      if (!targetBranchId) {
        throw new Error('파일을 첨부할 대화 노드를 확인할 수 없습니다.')
      }

      const uploadedFiles = []

      for (const file of files) {
        const uploadedFile = await branchGraphApi.uploadBranchFile(targetBranchId, file, {
          modelProvider: model.provider,
          modelName: model.name,
        })
        uploadedFiles.push(createUploadedAttachment(uploadedFile, file))
      }

      setAttachedFilesByBranchId((currentFilesByBranchId) => ({
        ...currentFilesByBranchId,
        [targetBranchId]: mergeAttachmentFiles(
          currentFilesByBranchId[targetBranchId] ?? [],
          uploadedFiles,
        ),
      }))
      sessionContentCacheRef.current.invalidateAll()

      try {
        const branchFiles = await branchGraphApi.listBranchFiles(targetBranchId)
        if (Array.isArray(branchFiles)) {
          setAttachedFilesByBranchId((currentFilesByBranchId) => ({
            ...currentFilesByBranchId,
            [targetBranchId]: mergeAttachmentFiles(
              branchFiles,
              mergeAttachmentFiles(currentFilesByBranchId[targetBranchId] ?? [], uploadedFiles),
            ),
          }))
        }
      } catch {
        // 파일 목록 API 실패는 업로드 성공 자체를 취소하지 않는다.
      }

      const isCurrentActiveBranch =
        shouldCreateDraftSession || targetBranchId === graphStateRef.current.activeNodeId

      if (isCurrentActiveBranch) {
        await loadGraphState({
          activeNodeId: targetBranchId,
          selectedRootNodeId: targetRootNodeId,
          loadMessages: true,
          forceRefresh: true,
        })
      }

      setFileUploadState({
        branchId: targetBranchId,
        phase: 'success',
        message: `${uploadedFiles.length}개 파일을 첨부했다.`,
      })
    } catch (error) {
      const message = getDisplayError(error)

      setErrorMessage(message)
      setFileUploadState({
        branchId: targetBranchId || null,
        phase: 'error',
        message,
      })
    } finally {
      setPendingAction('')
    }
  }

  const handleDeleteAttachment = async (branchId, fileId) => {
    if (!branchId || !fileId) {
      return
    }

    setPendingAction('첨부 삭제 중')
    setErrorMessage('')

    try {
      await branchGraphApi.deleteFile(fileId)
      const currentFile = (attachedFilesByBranchId[branchId] ?? []).find(
        (file) => readAttachmentFileId(file) === fileId,
      )
      revokeAttachmentPreview(currentFile)
      setAttachedFilesByBranchId((currentFilesByBranchId) => ({
        ...currentFilesByBranchId,
        [branchId]: (currentFilesByBranchId[branchId] ?? []).filter(
          (file) => readAttachmentFileId(file) !== fileId,
        ),
      }))
      sessionContentCacheRef.current.invalidateAll()
      setFileUploadState({
        branchId,
        phase: 'success',
        message: '첨부 파일을 삭제했다.',
      })
    } catch (error) {
      const message = getDisplayError(error)

      setErrorMessage(message)
      setFileUploadState({
        branchId,
        phase: 'error',
        message,
      })
    } finally {
      setPendingAction('')
    }
  }

  const handleOpenAttachmentPreview = (file) => {
    if (!readAttachmentPreviewUrl(file)) {
      return
    }

    setAttachmentPreviewFile(file)
  }

  const handleOpenModelComparison = (messageText) => {
    setErrorMessage('')
    setModelComparisonFlow({ prompt: messageText ?? '', comparison: null, analysis: null, minimized: false })
  }

  const handleStartModelComparison = async (prompt, models) => {
    let branchId = graphStateRef.current.activeNodeId
    const currentFlow = modelComparisonFlow

    if (!currentFlow || !prompt || models.length !== 2) {
      return
    }

    setPendingAction('모델 답변 비교 중')
    setErrorMessage('')
    setModelComparisonFlow((flow) => flow ? { ...flow, prompt } : flow)

    try {
      if (isNewChatDraft || !branchId) {
        branchId = await createDraftSession()
        setIsNewChatDraft(false)
        setIsLandingVisible(false)
      }

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
      sessionContentCacheRef.current.invalidateAll()
      setSelectedChatModel(model)
      setComparisonResetKey((key) => key + 1)
      setModelComparisonFlow(null)
      setIsLandingVisible(false)
      await loadGraphState({
        activeNodeId: branchId,
        selectedRootNodeId: graphStateRef.current.selectedRootNodeId,
        loadMessages: true,
        forceRefresh: true,
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

    const mergeModel = ['openai', 'chatkhu'].includes(selectedChatModel.provider)
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
      sessionContentCacheRef.current.invalidateAll()
      setSelectedChatModel(mergeModel)
      setComparisonResetKey((key) => key + 1)
      setModelComparisonFlow(null)
      setIsLandingVisible(false)
      await loadGraphState({
        activeNodeId: branchId,
        selectedRootNodeId: graphStateRef.current.selectedRootNodeId,
        loadMessages: true,
        forceRefresh: true,
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
        persona: parentNode.personaKey ? { key: parentNode.personaKey } : null,
      })
      sessionContentCacheRef.current.invalidateAll()
      const branchId = readBranchId(branch)

      await loadGraphState({
        activeNodeId: branchId,
        selectedRootNodeId: parentNode.rootId,
        loadMessages: true,
        forceRefresh: true,
      })
      setIsNewChatDraft(false)
      setIsLandingVisible(false)
    } catch (error) {
      setErrorMessage(getDisplayError(error))
    } finally {
      setPendingAction('')
    }
  }

  const handleOpenHome = () => {
    handleOpenNewChatDraft()
  }

  const handleRenameSession = async (rootNodeId, title) => {
    const currentState = graphStateRef.current
    const rootNode = getNodeById(currentState.nodes, rootNodeId)

    if (!rootNode?.apiSessionId) {
      return false
    }

    setPendingAction('세션 이름 변경 중')

    try {
      await branchGraphApi.updateSession(rootNode.apiSessionId, { title })
      sessionContentCacheRef.current.invalidateAll()
      await loadGraphState({
        activeNodeId: currentState.activeNodeId,
        selectedRootNodeId: currentState.selectedRootNodeId,
        loadMessages: true,
        forceRefresh: true,
      })
      setErrorMessage('')
      return true
    } catch (error) {
      setErrorMessage(getDisplayError(error))
      return false
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
      sessionContentCacheRef.current.invalidateAll()
      await loadGraphState({
        activeNodeId: node.parentId,
        selectedRootNodeId: node.rootId,
        loadMessages: true,
        forceRefresh: true,
      })
      setIsNewChatDraft(false)
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
      sessionContentCacheRef.current.invalidateAll()
      await loadGraphState({
        activeNodeId: isDeletingCurrentTree ? undefined : currentState.activeNodeId,
        selectedRootNodeId: isDeletingCurrentTree ? undefined : currentState.selectedRootNodeId,
        loadMessages: !isDeletingCurrentTree,
        forceRefresh: true,
      })
      if (isDeletingCurrentTree) {
        setIsNewChatDraft(true)
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
        sessionContentCacheRef.current.invalidateAll()
        await loadGraphState({ loadMessages: false, forceRefresh: true })
        setIsLandingVisible(true)
        return
      }

      await Promise.all(branchIds.map((branchId) => branchGraphApi.restoreBranch(branchId)))
      sessionContentCacheRef.current.invalidateAll()
      await loadGraphState({
        activeNodeId: nodeId,
        selectedRootNodeId: node.rootId,
        loadMessages: true,
        forceRefresh: true,
      })
      setIsNewChatDraft(false)
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
      sessionContentCacheRef.current.invalidateAll()
      await loadGraphState({ loadMessages: false, forceRefresh: true })
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
        isLandingActive={isLandingVisible}
        isBusy={isBusy}
        onToggleCollapse={handleToggleSidebar}
        onOpenHome={handleOpenHome}
        onNewChat={handleOpenNewChatDraft}
        onSelectRoot={handleSelectRoot}
        onRenameSession={handleRenameSession}
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
            <div className="topbar-conversation-title">
              <strong>{activeRootNode?.title ?? activeNode.title}</strong>
              {!isSplitViewOpen ? (
                <div className="path-line topbar-path-line" aria-label="현재 노드 경로">
                  {activeBranchPath.map((node) => (
                    <span
                      key={node.id}
                      className={[
                        activeMainPathNodeIds.has(node.id) ? 'main-path-pill' : '',
                        node.id === activeNode.id ? 'current-path-node' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {node.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {!isLandingVisible && activeNode ? (
            <>
              <span className={isActiveNodeOnMainPath ? 'topbar-path-status main' : 'topbar-path-status branch'} aria-label="현재 경로 상태">
                {isActiveNodeOnMainPath ? 'main 경로' : '분기 경로'}
              </span>
              {!isMiniGraphOpen ? (
                <button
                  type="button"
                  className={isSplitViewOpen ? 'topbar-graph-button standalone' : 'topbar-graph-button'}
                  aria-pressed={false}
                  onClick={() => setIsMiniGraphOpen(true)}
                >
                  브랜치 시각화
                </button>
              ) : null}
              <span className="topbar-action-divider" aria-hidden="true" />
            </>
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
            !isLandingVisible && (splitNode || isMiniGraphOpen) ? 'split-view-open' : '',
          ].filter(Boolean).join(' ')}
        >
          <div ref={splitWorkspaceRef} className="split-workspace">
          <div
            className="workspace-primary split-pane"
            style={splitNode ? { flexGrow: 1 - splitChatShare } : undefined}
          >
            {isLoading && !activeNode ? (
              <section className="empty-state loading-state" aria-label="초기 데이터 동기화">
                <div className="loading-logo" aria-hidden="true">
                  <RamoLogo />
                </div>
                <h1 className="loading-message" aria-label="생각의 가지를 펼치고 있어요...">
                  <span>생각의 가지를 펼치고 있어요</span>
                  <span className="loading-dots" aria-hidden="true">...</span>
                </h1>
              </section>
            ) : isLandingVisible ? (
              <ChatLanding
                activeNode={isNewChatDraft ? null : activeNode}
                isBusy={isBusy}
                attachedFiles={activeAttachedFiles}
                uploadState={activeUploadState}
                modelOptions={CHAT_MODEL_OPTIONS}
                selectedModel={selectedChatModel}
                onChangeModel={setSelectedChatModel}
                onSendMessage={handleSendMessage}
                onAttachFiles={(files) => handleAttachFiles(files)}
                onDeleteAttachment={(fileId) => {
                  if (activeAttachmentBranchId) {
                    void handleDeleteAttachment(activeAttachmentBranchId, fileId)
                  }
                }}
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
                pendingUserAttachments={pendingUserAttachments}
                attachedFiles={activeAttachedFiles}
                messageAttachmentsById={messageAttachmentsById}
                uploadState={activeUploadState}
                modelOptions={CHAT_MODEL_OPTIONS}
                selectedModel={selectedChatModel}
                onChangeModel={setSelectedChatModel}
                onOpenModelComparison={handleOpenModelComparison}
                isSplitViewOpen={isSplitViewOpen}
                onSendMessage={handleSendMessage}
                onAttachFiles={(files) => handleAttachFiles(files)}
                onDeleteAttachment={(fileId) => {
                  if (activeNode?.id) {
                    void handleDeleteAttachment(activeNode.id, fileId)
                  }
                }}
                onOpenAttachment={handleOpenAttachmentPreview}
                onCreateBranch={handleCreateBranch}
                onRenameSession={handleRenameSession}
              />
            )}
          </div>

          {!isLandingVisible && splitNode ? (
            <>
              <SplitResizeHandle
                label="선택 노드 대화창 크기 조절"
                onResize={(deltaX) => {
                  const workspaceWidth = (splitWorkspaceRef.current?.clientWidth ?? window.innerWidth) - 16
                  const graphSpace = isMiniGraphOpen ? graphSplitWidth + SPLIT_HANDLE_WIDTH : 0
                  const availableChatWidth = Math.max(1, workspaceWidth - graphSpace - SPLIT_HANDLE_WIDTH)

                  setSplitChatShare((share) => Math.min(
                    MAX_CHAT_SPLIT_SHARE,
                    Math.max(MIN_CHAT_SPLIT_SHARE, share - deltaX / availableChatWidth),
                  ))
                }}
              />
              <div
                className="split-pane split-chat-pane"
                style={{ flexGrow: splitChatShare }}
              >
                <SplitConversationPanel
                  graphState={graphState}
                  node={splitNode}
                  isBusy={isBusy}
                  isAwaitingResponse={pendingAction === '스플릿 메시지 전송 중'}
                  pendingUserMessage={pendingSplitUserMessage}
                  pendingUserAttachments={pendingSplitUserAttachments}
                  attachedFiles={splitAttachedFiles}
                  messageAttachmentsById={messageAttachmentsById}
                  uploadState={splitUploadState}
                  modelOptions={CHAT_MODEL_OPTIONS}
                  selectedModel={selectedSplitChatModel}
                  onChangeModel={setSelectedSplitChatModel}
                  onOpenModelComparison={handleOpenModelComparison}
                  onSendMessage={handleSendSplitMessage}
                  onAttachFiles={(files) => handleAttachFiles(files, {
                    branchId: splitNode.id,
                    selectedRootNodeId: splitNode.rootId,
                    model: selectedSplitChatModel,
                  })}
                  onDeleteAttachment={(fileId) => {
                    if (splitNode?.id) {
                      void handleDeleteAttachment(splitNode.id, fileId)
                    }
                  }}
                  onOpenAttachment={handleOpenAttachmentPreview}
                  onCreateBranch={handleCreateBranch}
                  onClose={() => setSplitNodeId(null)}
                />
              </div>
            </>
          ) : null}

          {!isLandingVisible && isMiniGraphOpen ? (
            <>
              <SplitResizeHandle
                label="브랜치 시각화 창 크기 조절"
                onResize={(deltaX) => {
                  const workspaceWidth = (splitWorkspaceRef.current?.clientWidth ?? window.innerWidth) - 16
                  const chatPaneCount = splitNode ? 2 : 1
                  const handleSpace = SPLIT_HANDLE_WIDTH * (splitNode ? 2 : 1)
                  const maxGraphWidth = Math.max(
                    MIN_GRAPH_SPLIT_WIDTH,
                    workspaceWidth - MIN_CHAT_PANE_WIDTH * chatPaneCount - handleSpace,
                  )

                  setGraphSplitWidth((width) => Math.min(
                    maxGraphWidth,
                    Math.max(MIN_GRAPH_SPLIT_WIDTH, width - deltaX),
                  ))
                }}
              />
              <div className="split-pane graph-split-pane" style={{ width: `${graphSplitWidth}px` }}>
                <TopMiniGraph
                  graphState={graphState}
                  activeNode={activeNode}
                  onSelectNode={handleSelectTopGraphNode}
                  onSetMainTarget={handleSetMainTarget}
                  onRenameNode={handleRenameNode}
                  onToggleNodeCollapse={handleToggleNodeCollapse}
                  onSetNodePersona={handleSetNodePersona}
                  onClearNodePersona={handleClearNodePersona}
                  onStartNodeMerge={handleStartNodeMerge}
                  onMoveToTrash={handleMoveToTrash}
                  onOpenFullscreen={handleOpenFullscreenGraph}
                  onOpenSplitNode={handleOpenSplitNode}
                  onClose={() => setIsMiniGraphOpen(false)}
                  layoutDirection={graphLayoutDirection}
                  onToggleLayout={handleToggleGraphLayout}
                />
              </div>
            </>
          ) : null}
          </div>
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
          onSetNodePersona={handleSetNodePersona}
          onClearNodePersona={handleClearNodePersona}
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

      {attachmentPreviewFile ? (
        <AttachmentPreviewModal
          file={attachmentPreviewFile}
          onClose={() => setAttachmentPreviewFile(null)}
        />
      ) : null}
    </main>
  )
}

function AttachmentPreviewModal({ file, onClose }) {
  const previewUrl = readAttachmentPreviewUrl(file)
  const fileName = readAttachmentFileName(file)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!previewUrl) {
    return null
  }

  return (
    <div
      className="attachment-preview-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${fileName} 원본 이미지`}
    >
      <button
        type="button"
        className="attachment-preview-backdrop"
        aria-label="원본 이미지 닫기"
        onClick={onClose}
      />
      <div className="attachment-preview-dialog">
        <header>
          <strong>{fileName}</strong>
          <button type="button" aria-label="원본 이미지 닫기" onClick={onClose}>
            ×
          </button>
        </header>
        <img src={previewUrl} alt={fileName} />
      </div>
    </div>
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

async function loadSessionGraphResponse(session, sessionContentCache, { force = false } = {}) {
  const sessionId = readSessionId(session)
  let graphPayload = await sessionContentCache.getSessionGraphPayload(
    sessionId,
    () => fetchSessionGraphPayload(sessionId),
    { force },
  )
  const didRequestDescriptions = await describeMissingGraphNodes(graphPayload)

  if (didRequestDescriptions) {
    sessionContentCache.invalidateSession(sessionId)
    graphPayload = await sessionContentCache.getSessionGraphPayload(
      sessionId,
      () => fetchSessionGraphPayload(sessionId),
      { force: true },
    )
  }

  return { session, ...graphPayload }
}

async function fetchSessionGraphPayload(sessionId) {
  const [graph, branches, branchTrash] = await Promise.all([
    branchGraphApi.getSessionGraph(sessionId, true),
    branchGraphApi.listBranches(sessionId),
    branchGraphApi.listBranchTrash(sessionId),
  ])

  return { graph, branches, branchTrash }
}

async function describeMissingGraphNodes({ graph, branches }) {
  const branchById = new Map((branches ?? []).map((branch) => [readBranchId(branch), branch]))
  const branchIds = (graph?.nodes ?? [])
    .filter((node) => shouldDescribeGraphNode(node, branchById.get(readBranchId(node))))
    .map((node) => readBranchId(node))
    .filter(Boolean)
  const uniqueBranchIds = [...new Set(branchIds)]

  if (uniqueBranchIds.length === 0 || typeof branchGraphApi.describeBranch !== 'function') {
    return false
  }

  const results = await Promise.allSettled(
    uniqueBranchIds.map((branchId) => branchGraphApi.describeBranch(branchId)),
  )

  return results.some((result) => result.status === 'fulfilled')
}

function shouldDescribeGraphNode(node, branch) {
  const status = node?.status ?? branch?.status
  const messageCount = Number(node?.message_count ?? node?.messageCount ?? 0)

  return (
    status !== 'deleted' &&
    messageCount > 0 &&
    !hasText(node?.description) &&
    !hasText(branch?.description)
  )
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
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

function shouldShowUploadState(uploadState, branchId) {
  if (!uploadState) {
    return false
  }

  if (!branchId) {
    return uploadState.phase === 'uploading' && !uploadState.branchId
  }

  return uploadState.branchId === branchId
}

function normalizeIncomingFiles(incomingFiles) {
  return Array.from(incomingFiles ?? []).filter((file) => file && file.size >= 0)
}

function createMessageAttachmentSnapshot(files, branchId) {
  return files.map((file) => ({
    ...file,
    branchId,
    branch_id: file?.branch_id ?? branchId,
  }))
}

function getDraftAttachmentFiles(files, messageAttachmentsById, branchId) {
  const sentFileIds = new Set()

  Object.values(messageAttachmentsById).forEach((attachments) => {
    attachments.forEach((file) => {
      const fileBranchId = file?.branchId ?? file?.branch_id ?? ''
      const fileId = readAttachmentFileId(file)

      if (fileBranchId === branchId && fileId) {
        sentFileIds.add(fileId)
      }
    })
  })

  return files.filter((file) => {
    const fileId = readAttachmentFileId(file)
    return !readAttachmentMessageId(file) && (!fileId || !sentFileIds.has(fileId))
  })
}

function removeAttachedFilesByIds(filesByBranchId, branchId, files) {
  const sentFileIds = new Set(files.map(readAttachmentFileId).filter(Boolean))

  if (sentFileIds.size === 0) {
    return filesByBranchId
  }

  return {
    ...filesByBranchId,
    [branchId]: (filesByBranchId[branchId] ?? []).filter(
      (file) => !sentFileIds.has(readAttachmentFileId(file)),
    ),
  }
}

function readSentUserMessageId(response) {
  return readMessageId(response?.user_message ?? response?.userMessage) ??
    response?.user_message_id ??
    response?.userMessageId ??
    null
}

function readSentUserMessageAttachments(response) {
  const userMessage = response?.user_message ?? response?.userMessage
  const attachments = userMessage?.attachments

  return Array.isArray(attachments) && attachments.length > 0 ? attachments : null
}

function findLatestSentUserMessageId(graphState, branchId, messageText) {
  const session = getSessionByNodeId(graphState, branchId)
  return findLatestSentUserMessageIdFromMessages(session.messages, branchId, messageText)
}

function findLatestSentUserMessageIdFromMessages(messages, branchId, messageText) {
  const messageList = Array.isArray(messages) ? messages : messages?.messages ?? []

  for (let index = messageList.length - 1; index >= 0; index -= 1) {
    const message = messageList[index]
    const messageBranchId = message?.branchId ?? message?.branch_id ?? branchId

    if (
      message?.role === 'user' &&
      message?.content === messageText &&
      messageBranchId === branchId
    ) {
      return readMessageId(message)
    }
  }

  return null
}

function readMessageId(message) {
  return message?.id ?? message?.message_id ?? message?.messageId ?? null
}

function createUploadedAttachment(uploadedFile, sourceFile) {
  const attachment = {
    ...uploadedFile,
    filename: uploadedFile?.filename ?? sourceFile?.name,
    type: uploadedFile?.type ?? sourceFile?.type,
    mime_type: uploadedFile?.mime_type ?? sourceFile?.type,
  }

  if (readAttachmentPreviewUrl(attachment)) {
    return attachment
  }

  if (!isPreviewableImage(sourceFile) || typeof URL === 'undefined') {
    return attachment
  }

  return {
    ...attachment,
    previewUrl: URL.createObjectURL(sourceFile),
  }
}

function mergeAttachmentFiles(currentFiles, nextFiles) {
  const mergedFiles = currentFiles.map((file) => ({ ...file }))
  const fileIndexById = new Map(
    mergedFiles
      .map((file, index) => [readAttachmentFileId(file), index])
      .filter(([fileId]) => Boolean(fileId)),
  )

  nextFiles.forEach((file) => {
    const fileId = readAttachmentFileId(file)
    const existingIndex = fileId ? fileIndexById.get(fileId) : undefined

    if (existingIndex !== undefined) {
      mergedFiles[existingIndex] = {
        ...mergedFiles[existingIndex],
        ...file,
      }
      return
    }

    if (fileId) {
      fileIndexById.set(fileId, mergedFiles.length)
    }

    mergedFiles.push(file)
  })

  return mergedFiles
}

function readAttachmentFileId(file) {
  return file?.id ?? file?.file_id ?? file?.fileId ?? ''
}

function readAttachmentMessageId(file) {
  return file?.message_id ?? file?.messageId ?? null
}

function readAttachmentFileName(file) {
  return file?.filename ?? file?.name ?? '첨부 이미지'
}

function readAttachmentPreviewUrl(file) {
  if (!isAttachmentImage(file)) {
    return ''
  }

  return file?.previewUrl ?? file?.preview_url ?? file?.content_url ?? file?.contentUrl ?? ''
}

function isPreviewableImage(file) {
  return file?.type?.startsWith('image/')
}

function isAttachmentImage(file) {
  return file?.file_type === 'image' ||
    file?.fileType === 'image' ||
    file?.type?.startsWith('image/') ||
    file?.mime_type?.startsWith('image/') ||
    file?.mimeType?.startsWith('image/')
}

function revokeAttachmentPreview(file) {
  if (file?.previewUrl && typeof URL !== 'undefined') {
    URL.revokeObjectURL(file.previewUrl)
  }
}

export default App
