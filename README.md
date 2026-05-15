# LLM 채팅 브랜치 시각화 서비스

## 개요

본 프로젝트는 LLM 채팅 중 특정 메시지를 기준으로 브랜치를 생성하고, 브랜치 간 관계를 그래프 형태로 시각화하는 독립 웹 서비스이다. 사용자가 꼬리질문을 별도 흐름으로 분리하면서도 원래 대화 목적을 유지하도록 돕는 것이 목표이다.

## 현재 상태

현재 저장소는 기획 및 요구사항 정리 단계이다. 구현 코드는 아직 작성되지 않았으며, `src/`와 `tests/`는 후속 개발을 위한 기본 디렉토리로 준비되어 있다.

## 프로젝트 구조

```text
project-root/
├─ AGENTS.md
├─ docs/
│  ├─ PRD.md
│  ├─ requirements.md
│  ├─ implementation_plan.md
│  ├─ test_plan.md
│  ├─ requirement_status.md
│  └─ review_notes.md
├─ src/
├─ tests/
└─ README.md
```

## 문서 설명

- `docs/PRD.md`: 원본 기획서이다.
- `docs/requirements.md`: 요구사항 ID 목록이다.
- `docs/implementation_plan.md`: 구현 단계와 우선순위를 정리한 문서이다.
- `docs/test_plan.md`: 기능 테스트와 사용성 테스트 계획이다.
- `docs/requirement_status.md`: 요구사항별 충족 여부를 추적하는 문서이다.
- `docs/review_notes.md`: 리뷰 기록과 의사결정 메모이다.
