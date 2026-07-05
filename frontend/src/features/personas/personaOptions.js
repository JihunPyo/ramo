export const PERSONA_OPTIONS = [
  {
    key: 'planning-consultant',
    name: '기획 컨설턴트',
    description: '아이디어를 검증하고 구체화해요',
    icon: 'strategy',
  },
  {
    key: 'translation-expert',
    name: '번역 전문가',
    description: '의미와 맥락을 살려 자연스럽게 번역해요',
    icon: 'translate',
  },
  {
    key: 'writing-coach',
    name: '글쓰기 코치',
    description: '글의 구조와 표현을 더 명확하게 다듬어요',
    icon: 'writing',
  },
  {
    key: 'learning-mentor',
    name: '학습 멘토',
    description: '어려운 개념을 이해할 수 있게 설명해요',
    icon: 'learn',
  },
  {
    key: 'dev-partner',
    name: '개발 파트너',
    description: '구현 방법을 찾고 오류를 함께 해결해요',
    icon: 'code',
  },
  {
    key: 'language-coach',
    name: '어학 코치',
    description: '실제 대화를 하며 외국어 회화를 연습해요',
    icon: 'talk',
  },
]

export function getPersonaOption(personaKey) {
  return PERSONA_OPTIONS.find((persona) => persona.key === personaKey) ?? null
}
