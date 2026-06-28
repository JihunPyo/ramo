export function createMockLlmResponse(userMessage, nodeTitle = '현재 노드') {
  return `${nodeTitle} 기준으로 답변한다. "${userMessage}" 질문은 현재 세션 안에서 이어가며, 필요하면 메시지의 브랜치 생성 버튼으로 별도 노드를 만들 수 있다.`
}
