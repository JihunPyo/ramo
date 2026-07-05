export const PERSONA_OPTIONS = [
  {
    key: 'planning-consultant',
    slug: 'planning',
    name: '기획 컨설턴트',
    description: '아이디어를 검증하고 구체화해요',
    icon: 'strategy',
  },
  {
    key: 'translation-expert',
    slug: 'translation',
    name: '번역 전문가',
    description: '의미와 맥락을 살려 자연스럽게 번역해요',
    icon: 'translate',
  },
  {
    key: 'writing-coach',
    slug: 'writing',
    name: '글쓰기 코치',
    description: '글의 구조와 표현을 더 명확하게 다듬어요',
    icon: 'writing',
  },
  {
    key: 'learning-mentor',
    slug: 'education',
    name: '학습 멘토',
    description: '어려운 개념을 이해할 수 있게 설명해요',
    icon: 'learn',
  },
  {
    key: 'dev-partner',
    slug: 'development',
    name: '개발 파트너',
    description: '구현 방법을 찾고 오류를 함께 해결해요',
    icon: 'code',
  },
  {
    key: 'language-coach',
    slug: 'language_learning',
    name: '어학 코치',
    description: '실제 대화를 하며 외국어 회화를 연습해요',
    icon: 'talk',
  },
]

export function getPersonaOption(personaKey) {
  const normalizedKey = normalizePersonaKey(personaKey)
  return PERSONA_OPTIONS.find((persona) => persona.key === normalizedKey) ?? null
}

export function normalizePersonaKey(personaKey) {
  if (typeof personaKey !== 'string' || !personaKey.trim()) {
    return ''
  }

  const key = personaKey.trim()
  const persona = PERSONA_OPTIONS.find((option) => option.key === key || option.slug === key)
  return persona?.key ?? key
}

export function readPersonaSlug(persona) {
  if (!persona) {
    return ''
  }

  if (typeof persona.slug === 'string' && persona.slug.trim()) {
    return persona.slug.trim()
  }

  return getPersonaOption(persona.key)?.slug ?? ''
}
