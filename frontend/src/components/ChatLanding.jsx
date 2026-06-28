import { useState } from 'react'

const promptChips = ['웹검색', '심층 사고', '챗봇 비교']

export function ChatLanding({ activeNode, onSendMessage }) {
  const [draft, setDraft] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const messageText = draft.trim()

    if (!messageText) {
      return
    }

    onSendMessage(messageText)
    setDraft('')
  }

  return (
    <section className="chat-landing" aria-label="채팅 랜딩">
      <div className="landing-mark" aria-hidden="true">
        ✣
      </div>
      <p className="landing-model">{activeNode?.title ?? 'Branch Chat'}</p>
      <h1>무엇을 도와드릴까요?</h1>

      <form className="landing-composer" onSubmit={handleSubmit}>
        <label htmlFor="landing-message">메시지</label>
        <div className="landing-input-row">
          <span aria-hidden="true">＋</span>
          <textarea
            id="landing-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="메시지를 입력하세요."
          />
          <button type="submit" aria-label="메시지 전송">
            ➤
          </button>
        </div>
        <div className="prompt-chip-row" aria-label="프롬프트 모드">
          {promptChips.map((chip) => (
            <button key={chip} type="button">
              {chip}
            </button>
          ))}
        </div>
      </form>
    </section>
  )
}
