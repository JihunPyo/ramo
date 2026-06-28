# LLM 채팅 브랜치 시각화 서비스

## 개요

본 프로젝트는 LLM 채팅 중 특정 메시지를 기준으로 브랜치를 생성하고, 브랜치 간 관계를 그래프 형태로 시각화하는 독립 웹 서비스이다. 사용자가 꼬리질문을 별도 흐름으로 분리하면서도 원래 대화 목적을 유지하도록 돕는 것이 목표이다.

## 현재 상태

현재 저장소는 기획 문서와 협업 가이드를 중심으로 정리되어 있다. 기존 정적 UI 프로토타입과 테스트 에셋은 React 전환을 위해 제거되었으며, 새 프론트엔드 앱은 `frontend/` 디렉토리에 React JavaScript 기반으로 구성할 예정이다.

## 프로젝트 구조

```text
project-root/
├─ AGENTS.md
├─ README.md
├─ commit_log.md
├─ docs/
│  ├─ PRD.md
│  ├─ requirements.md
│  └─ implementation_plan.md
└─ 협업방식가이드.md
```

## 실행 방법

- 현재 실행 가능한 프론트엔드 앱은 없다.
- React 전환 후 `frontend/` 디렉토리에서 실행 방법을 별도로 정리한다.

## 문서 설명

- `docs/PRD.md`: 원본 기획서이다.
- `docs/requirements.md`: 요구사항 ID 목록이다.
- `docs/implementation_plan.md`: 구현 단계와 우선순위를 정리한 문서이다.
- `협업방식가이드.md`: 프론트엔드와 백엔드 협업 방식, API 협업 흐름, GitHub 사용 방식을 정리한 문서이다.
