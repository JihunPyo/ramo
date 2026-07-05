# Commit Log

## 2026-07-05 클립보드 이미지 중복 첨부 방지

### 원인

- 이미지 붙여넣기 시 브라우저가 같은 파일을 `clipboardData.files`와 `clipboardData.items` 양쪽에 노출할 수 있었다.
- 기존 로직은 두 컬렉션을 합친 뒤 `name`, `type`, `size`, `lastModified` 조합으로 중복 제거를 했고, 같은 이미지라도 `lastModified` 등이 다르면 서로 다른 파일로 판단될 수 있었다.

### 변경 사항

- `frontend/src/components/fileAttachmentUtils.js`에서 `clipboardData.files`가 있으면 해당 목록만 사용하고, 비어 있을 때만 `clipboardData.items`를 fallback으로 사용하도록 변경했다.
- 같은 소스 내 중복 제거 기준에서 `lastModified`를 제외해 클립보드 이미지의 불안정한 타임스탬프 때문에 중복 파일로 남지 않게 했다.

### 검증 결과

- 브라우저에서 테스트 PNG 이미지를 클립보드로 붙여넣었을 때 첨부 칩이 1개만 생성되는 것을 확인했다.
- 업로드 완료 후 `1개 파일을 첨부했다.` 상태가 표시되는 것을 확인했다.
- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/components/fileAttachmentUtils.js commit_log.md` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 사용자가 커밋을 요청해 현재 커밋 대상에 포함했다.

## 2026-07-05 랜딩 첨부 버튼 레이아웃 보정

### 원인

- 랜딩 입력창의 `+` 첨부 버튼에 공통 composer용 `grid-area: attach`가 적용되었지만, `.landing-input-row`에는 `grid-template-areas`가 없었다.
- 이로 인해 브라우저가 암묵 grid를 만들면서 전송 버튼이 입력창 중앙으로 밀리고, 첨부 버튼이 오른쪽으로 배치되는 현상이 발생했다.

### 변경 사항

- `frontend/src/Modern.css`에서 `.landing-input-row`에 `attach input send` grid 영역을 명시했다.
- 랜딩 textarea는 `input`, 첨부 버튼은 `attach`, 전송 버튼은 `send` 영역을 사용하도록 지정했다.
- 랜딩 첨부 버튼과 전송 버튼의 불필요한 `margin-top`, `transform` 보정을 제거해 세 요소가 같은 행에서 정렬되도록 했다.

### 검증 결과

- 브라우저에서 랜딩 입력창 좌표를 확인한 결과 `+` 버튼은 왼쪽, textarea는 중앙, 전송 버튼은 오른쪽에 배치되는 것을 확인했다.
- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/Modern.css commit_log.md` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 사용자가 커밋을 요청해 현재 커밋 대상에 포함했다.

## 2026-07-05 채팅 입력창 파일 첨부 UI

### 변경 사항

- `frontend/src/components/FileAttachmentControl.jsx`를 추가하여 공통 파일 첨부 버튼과 첨부 파일 칩 UI를 구현했다.
- `frontend/src/components/fileAttachmentUtils.js`의 클립보드 파일 추출 유틸을 랜딩, 일반 채팅, 스플릿 채팅 입력창에서 사용하도록 연결했다.
- `frontend/src/components/ChatLanding.jsx`, `frontend/src/components/ChatWorkspace.jsx`, `frontend/src/components/SplitConversationPanel.jsx`에 `+` 파일 첨부 버튼, 클립보드 파일 붙여넣기, 첨부 목록 표시, 첨부 삭제 UI를 추가했다.
- `frontend/src/App.jsx`에서 새 채팅 draft 상태의 파일 첨부 시 먼저 세션을 생성하고, 현재 브랜치에 파일을 업로드한 뒤 첨부 목록과 캐시를 갱신하도록 했다.
- `frontend/src/features/branchGraph/mockBranchGraphApi.js`에 mock 파일 업로드, 파일 목록, 파일 삭제 동작을 추가하여 이미지와 PDF 첨부 UI를 로컬에서 검증할 수 있게 했다.
- `frontend/src/Modern.css`에서 랜딩/채팅/스플릿 입력 바 grid와 첨부 칩 스타일을 추가했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/App.jsx frontend/src/Modern.css frontend/src/components/ChatLanding.jsx frontend/src/components/ChatWorkspace.jsx frontend/src/components/SplitConversationPanel.jsx frontend/src/components/FileAttachmentControl.jsx frontend/src/components/fileAttachmentUtils.js frontend/src/features/branchGraph/mockBranchGraphApi.js frontend/src/features/branchGraph/sessionContentCache.js commit_log.md` 실행 결과, 공백 오류가 없었다.
- 일반 권한의 `npm run dev:mock` 실행은 로컬 포트 바인딩 제한으로 `listen EPERM`이 발생했다.
- 권한 상승으로 Mock 개발 서버를 실행했고, 기본 포트가 사용 중이라 `http://127.0.0.1:5175/`에서 실행되었다.
- 브라우저에서 랜딩 입력창의 `파일 첨부` 버튼과 file input이 렌더링되는 것을 확인했다.
- 브라우저 클립보드에 테스트 PNG 이미지를 넣고 붙여넣었을 때 첨부 칩과 `1개 파일을 첨부했다.` 상태가 표시되는 것을 확인했다.
- 메시지 전송 후 일반 채팅 입력창에도 `파일 첨부` 버튼과 `image/*,application/pdf,.pdf,.docx,.txt,.md,.csv,.json,.py,.js,.ts,.html,.xml` accept 값이 유지되는 것을 확인했다.
- 첨부 칩 삭제 버튼 클릭 후 첨부 목록이 비고 `첨부 파일을 삭제했다.` 상태가 표시되는 것을 확인했다.
- 브라우저 콘솔 error 로그가 없음을 확인했다.

### Git 상태

- 사용자가 커밋을 요청해 현재 커밋 대상에 포함했다.

## 2026-07-05 세션 콘텐츠 임시 캐시

### 변경 사항

- `frontend/src/features/branchGraph/sessionContentCache.js`를 추가하여 세션 목록, 휴지통 목록, 세션 그래프, 브랜치 메시지를 60초 동안 캐싱하도록 했다.
- `frontend/src/App.jsx`의 세션 그래프 로딩, 노드 메시지 로딩, 스플릿 대화 열기 흐름에서 캐시를 우선 사용하도록 수정했다.
- 메시지 전송, 브랜치 생성, 이름 변경, 접기, 삭제, 복구, 영구 삭제, 병합, 모델 비교 답변 적용 후에는 캐시를 무효화하고 최신 데이터를 강제 재조회하도록 했다.
- 관련 요구사항과 테스트 계획을 `REQ-036`, `TP-019`로 문서화했다.
- 현재 작업트리에 함께 있던 파일 첨부 UI 변경의 Fast Refresh lint 오류를 해소하기 위해 클립보드 파일 유틸을 `frontend/src/components/fileAttachmentUtils.js`로 분리했다.

### 검증 결과

- `sessionContentCache` 단위 검증에서 캐시 hit와 `invalidateAll` 이후 재조회가 정상 동작함을 확인했다.
- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 일반 샌드박스 권한의 `npm run dev:mock` 실행은 `listen EPERM`으로 실패했다.
- 권한 상승으로 Mock 개발 서버를 `http://127.0.0.1:5173/`에서 실행했고, HTTP `200 OK` 응답을 확인했다.
- 파일 첨부 UI 변경까지 포함된 현재 작업트리 기준으로 `npm run lint`, `git diff --check`, `npm run build`를 다시 실행했고 모두 통과했다.

### Git 상태

- 사용자가 커밋을 요청해 현재 커밋 대상에 포함했다.

## 2026-07-05 브랜치 그래프 전체 노드 설명 생성 API 연결

### 변경 사항

- 그래프 노드 설명은 `GET /sessions/{session_id}/graph`의 `nodes[].description`을 우선 사용하도록 정리했다.
- 그래프 로딩 시 설명이 없는 모든 노드 중 직접 메시지가 있는 노드에 대해 `POST /branches/{branch_id}/describe`를 호출하도록 했다.
- 설명 생성 호출 후 그래프와 브랜치 목록을 다시 조회해 hover tooltip에 API 생성 설명이 반영되도록 했다.
- Mock API에도 `describeBranch`를 추가해 실제 API와 같은 흐름으로 개발 모드 검증이 가능하도록 했다.

### 검증 결과

- `frontend/`에서 `npm run lint`를 실행하여 ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build`를 실행하여 Vite 프로덕션 빌드가 통과했다.
- 프론트 저장소에서 `git diff --check` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 사용자가 커밋 및 push를 요청해 이 변경 사항을 커밋 대상으로 포함했다.

## 2026-07-05 답변 라벨 페르소나·모델 표시

### 변경 사항

- 답변 메시지 좌측 상단 라벨을 `Ramo · 페르소나 이름 · 사용 모델` 형식으로 표시하도록 수정했다.
- `frontend/src/components/messageRoleLabel.js`를 추가해 일반 채팅, 노드 비교, 스플릿 대화의 답변 라벨 생성 로직을 공통화했다.
- 메시지 API 응답의 `persona_name`, `model_provider`, `model_name`을 프론트 메시지 상태에 정규화하도록 했다.
- 선택 모델이 모델 옵션에 있으면 원본 모델 ID 대신 UI 표시 라벨을 사용하도록 했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프론트 저장소에서 `git diff --check -- frontend/src/components/ChatWorkspace.jsx frontend/src/components/SplitConversationPanel.jsx frontend/src/components/messageRoleLabel.js frontend/src/features/branchGraph/branchGraphAdapter.js` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 백엔드 app 기준 API 호출 구조 정렬

### 변경 사항

- `chatbot_branch_project/app/routers`와 `app/schemas` 기준으로 프론트 HTTP API wrapper를 보강했다.
- 세션 검색, 세션 메모리 조회/수정/추출, 브랜치 자동 이름/태그/요약, 태그 생성/조회/부여/제거, 파일 업로드/조회/삭제 호출 함수를 추가했다.
- 파일 업로드 API가 `multipart/form-data`를 사용하므로 공통 `apiClient`가 `FormData` body에는 JSON `Content-Type`을 강제로 붙이지 않도록 수정했다.
- 병합 후보 추천 응답의 `reasons[].text`와 `reasons[].matched`를 우선 사용하도록 표시 로직을 백엔드 응답 구조에 맞췄다.

### 검증 결과

- `frontend/`에서 `npm run lint`를 실행하여 ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build`를 실행하여 Vite 프로덕션 빌드가 통과했다.
- 프론트 저장소에서 `git diff --check` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 브랜치 그래프 hover 설명 API 연동

### 변경 사항

- `frontend/src/features/branchGraph/branchGraphAdapter.js`에서 백엔드 그래프 노드의 `summary`를 hover 설명으로 우선 사용하도록 했다.
- 그래프 응답에 `summary`가 없더라도 `GET /sessions/{session_id}/branches`의 `summary`를 fallback으로 사용하도록 했다.
- 기존 노드 설명과 이전 상태 설명은 API 요약이 없을 때만 fallback으로 사용하도록 정리했다.

### 검증 결과

- `frontend/`에서 `npm run lint`를 실행하여 ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build`를 실행하여 Vite 프로덕션 빌드가 통과했다.
- 프론트 저장소에서 `git diff --check` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-05-15

### 변경 사항

- `00_brief.md`를 생성하여 현재까지 확인된 프로젝트 아이디어와 미확정 항목을 기록했다.
- `01_questions.md`를 생성하여 인터뷰 질문과 답변 상태를 기록했다.
- `02_answers.md`를 생성하여 사용자의 1차 답변을 정리했다.

### Git 상태

- 현재 프로젝트 루트에서 `.git` 저장소가 확인되지 않아 커밋은 수행하지 않았다.

### 추가 변경 사항

- `00_brief.md`에 주요 사용자, 문제 정의 초안, 제안 솔루션 초안을 추가했다.
- `01_questions.md`에 2차 질문과 답변 상태를 추가했다.
- `02_answers.md`에 사용자의 2차 답변과 핵심 정리를 추가했다.

### 추가 Git 상태

- 2026-05-15 기준 프로젝트 루트에서 `.git` 저장소가 확인되지 않아 커밋은 수행하지 않았다.

### 3차 변경 사항

- `00_brief.md`에 핵심 기능 초안, MVP 범위 초안, 성공 기준 초안, UI 방향을 추가했다.
- `01_questions.md`에 3차 질문과 답변 상태를 추가했다.
- `02_answers.md`에 사용자의 3차 답변과 핵심 정리를 추가했다.
- `03_prd.md`를 생성하여 프로젝트 기획서 초안을 작성했다.
- `03_prd.md`에 PRD 검토 결과와 미확정 요구사항을 포함했다.

### 3차 Git 상태

- 2026-05-15 기준 프로젝트 루트에서 `.git` 저장소가 확인되지 않아 커밋은 수행하지 않았다.

### 4차 변경 사항

- `00_brief.md`에 독립 웹 서비스 방향, LLM API 연동을 고려한 MVP 구현 방향, 그래프 UI 필수 조작을 추가했다.
- `01_questions.md`에 4차 질문과 답변 상태를 추가했다.
- `02_answers.md`에 사용자의 4차 답변과 핵심 정리를 추가했다.
- `03_prd.md`에 초기 서비스 형태, MVP 검증 초점, 그래프 UI 조작 요구사항, 추가 리스크와 미확정 요구사항을 반영했다.

### 4차 Git 상태

- 2026-05-15 기준 프로젝트 루트에서 `.git` 저장소가 확인되지 않아 커밋은 수행하지 않았다.

### 5차 변경 사항

- `00_brief.md`에 LLM 자동 요약, 비활성 브랜치 접기 및 숨김 처리, 실제 사용자 모집 목표를 추가했다.
- `01_questions.md`에 5차 질문과 답변 상태를 추가했다.
- `02_answers.md`에 사용자의 5차 답변과 핵심 정리를 추가했다.
- `03_prd.md`에 브랜치 LLM 자동 요약, 숨김 처리, 실제 사용자 테스트 및 만족도 조사 목표를 반영했다.
- `03_prd.md`의 범위 제외 항목에서 브랜치 자동 요약을 제거했다.

### 5차 Git 상태

- 2026-05-15 기준 프로젝트 루트에서 `.git` 저장소가 확인되지 않아 커밋은 수행하지 않았다.

### 프로젝트 구조 개편

- 요청된 구조에 맞춰 `docs/`, `src/`, `tests/` 디렉토리를 생성했다.
- `03_prd.md`를 `docs/PRD.md`로 이동하고, 문서 내 불필요한 오탈자 한 글자를 정리했다.
- `docs/requirements.md`를 생성하여 기능 요구사항, 비기능 요구사항, 범위 제외 항목을 ID 단위로 정리했다.
- `docs/implementation_plan.md`를 생성하여 MVP 구현 단계를 정리했다.
- `docs/test_plan.md`를 생성하여 기능 테스트와 사용성 테스트 계획을 정리했다.
- `docs/requirement_status.md`를 생성하여 요구사항별 현재 상태를 추적할 수 있게 했다.
- `docs/review_notes.md`를 생성하여 기존 인터뷰 기록과 구조 개편 리뷰를 요약 보존했다.
- `README.md`를 생성하여 프로젝트 개요와 문서 구조를 설명했다.
- `src/.gitkeep`, `tests/.gitkeep`를 생성하여 빈 구현 및 테스트 디렉토리를 유지했다.
- 새 문서 구조에 맞게 `AGENTS.md`의 planning file 경로를 갱신했다.
- 새 구조에 포함되지 않는 `00_brief.md`, `01_questions.md`, `02_answers.md`는 주요 내용을 `docs/review_notes.md`와 새 문서들에 이관한 뒤 제거했다.

### 프로젝트 구조 개편 Git 상태

- 2026-05-15 기준 프로젝트 루트에서 `.git` 저장소가 확인되지 않아 커밋은 수행하지 않았다.

### 요구사항 검증 기준 정리

- `docs/PRD.md`를 기준으로 구현 가능한 MVP 요구사항을 재검토했다.
- `docs/requirements.md`를 `REQ-001`부터 `REQ-016`까지의 요구사항 목록으로 재작성했다.
- 각 요구사항에 구현 범위, 검증 기준, 우선순위를 추가했다.
- PRD의 범위 제외 항목은 구현 요구사항에서 제외하고 별도 표로 정리했다.
- 요구사항 ID 변경에 맞춰 `docs/test_plan.md`의 관련 요구사항 매핑을 갱신했다.
- 요구사항 ID 변경에 맞춰 `docs/requirement_status.md`의 추적 표를 갱신했다.

### 요구사항 검증 기준 정리 Git 상태

- 2026-05-15 기준 프로젝트 루트가 Git 저장소임을 확인했다.
- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

### UI v1 구현

- `feat/ui-ver1` 브랜치를 생성했다.
- `src/index.html`을 생성하여 브랜치 채팅 UI의 기본 화면 구조를 구현했다.
- `src/styles.css`를 생성하여 브랜치 목록, 채팅, 그래프, 상세 패널, 이벤트 로그의 레이아웃과 시각 상태를 정의했다.
- `src/app.js`를 생성하여 Mock LLM 응답 계층, 메시지 전송, 메시지 기준 브랜치 생성, 브랜치 전환, 비활성화, 숨김, 그래프 확대 및 축소, 요약 미리보기, 이벤트 기록 상태 모델을 구현했다.
- `tests/ui_state_model.test.cjs`를 생성하여 빈 세션, 메시지 순서, 브랜치 부모 관계, 숨김 복구, 샘플 그래프 구조, 그래프 배율 제한을 검증했다.
- `README.md`에 UI v1 실행 방법과 테스트 명령을 추가했다.
- `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 UI v1 구현 상태와 검증 정보를 반영했다.

### UI v1 Git 상태

- 2026-05-15 기준 작업 브랜치는 `feat/ui-ver1`이다.
- 사용자가 커밋을 명시적으로 요청하지 않았으므로 커밋은 수행하지 않았다.

### UI v1 검증 결과

- `node tests/ui_state_model.test.cjs` 실행 결과, 상태 모델 테스트가 통과했다.
- `git diff --check` 실행 결과, 공백 오류가 발견되지 않았다.
- conda `DV` 환경에서 정적 파일 서버를 임시 실행하고 `curl -I http://localhost:4173/` 응답이 `200 OK`임을 확인했다.
- 브라우저 검증으로 메시지 전송, 브랜치 생성, 브랜치 비활성화, 숨김 표시 복구, 그래프 확대가 정상 동작함을 확인했다.

## 2026-05-18

### UI v2 Light 구현

- `codex/ui-v2-light` 브랜치를 생성했다.
- v1을 보존하고 `src/v2.html`, `src/v2.css`, `src/v2.js`를 추가하여 UI v2 Light를 별도 화면으로 구현했다.
- 밝은 Glass Morphism 스타일을 적용하고, soft blue, pale cyan, warm white 기반의 배경과 반투명 glass card UI를 구성했다.
- 좌측 사이드바에 새 채팅 버튼, 프로젝트 영역, Mock 최근 대화 목록, 하단 프로필 버튼을 배치했다.
- 중앙 채팅 영역에 채팅 제목, 모델 선택 드롭다운, 공유 및 설정 아이콘, 메시지 목록, 예시 질문 카드, 하단 고정 입력창을 배치했다.
- 우상단 현재 브랜치 배지와 클릭 팝오버를 구현하고, 팝오버에 브랜치 경로, 분기 요약, SVG 미니 그래프를 표시했다.
- Mock 메시지 송수신 흐름을 구현하여 사용자 메시지 추가 후 loading 상태와 AI 응답이 표시되도록 했다.
- Mock AI 응답에는 문단, 목록, 인용문, 표, 코드 블록 예시를 포함했다.
- `tests/v2_ui_state_model.test.cjs`를 추가하여 Mock 세션 선택, 메시지 송수신, 모델 선택, 브랜치 팝오버, 브랜치 생성, 미니 그래프 상태를 검증했다.
- `README.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 UI v2 Light 실행 방법과 구현 상태를 반영했다.

### UI v2 Light 검증 결과

- `node tests/v2_ui_state_model.test.cjs` 실행 결과, UI v2 상태 모델 테스트가 통과했다.
- `node tests/ui_state_model.test.cjs` 실행 결과, 기존 UI v1 상태 모델 테스트가 통과했다.
- `git diff --check` 실행 결과, 공백 오류가 발견되지 않았다.
- conda `DV` 환경에서 정적 파일 서버를 실행하고 `curl -I http://127.0.0.1:4173/v2.html`, `v2.css`, `v2.js` 응답이 모두 `200 OK`임을 확인했다.
- 브라우저 검증으로 우상단 브랜치 배지 팝오버, SVG 미니 그래프, 메시지 입력 및 Mock 응답 표시, 코드 블록 및 표 렌더링이 정상 동작함을 확인했다.
- 브라우저 모바일 viewport 검증으로 사이드바 drawer와 하단 입력창 배치가 정상 동작함을 확인했다.

## 2026-06-27

### 협업 방식 가이드 문서 작성

- 프로젝트 루트에 `협업방식가이드.md`를 생성했다.
- 프론트엔드와 백엔드의 역할, MVP 개발 순서, API 협업 방식, GitHub 브랜치 및 PR 사용 방식, 통합 테스트 기준을 장-절-항 구조로 정리했다.
- 초보 팀원이 실제 협업 흐름을 이해할 수 있도록 브랜치 생성 기능을 기준으로 프론트엔드 작업, 백엔드 작업, API 문서, PR 작성 예시를 추가했다.
- 본 프로젝트에는 초보 팀의 관리 부담을 낮추기 위해 단일 레포 방식과 GitHub Flow 기반 작업 방식을 권장한다고 정리했다.

### 협업 방식 가이드 Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-28

### React 전환 방향 기록

- 사용자가 백엔드가 아니라 프론트엔드 개발 담당이라고 정정했다.
- 프론트엔드는 기존 정적 HTML, CSS, JavaScript 에셋을 유지하지 않고 React 기반으로 재구현할 예정이라고 확인했다.
- React 앱 디렉토리명을 `frontend/`로 확정했다.
- TypeScript 없이 React JavaScript 기반으로 시작하기로 했다.
- Figma 디자인 적용 편의성을 기준으로 스타일 방식은 CSS Modules를 우선 선택했다.
- `docs/implementation_plan.md`에 React 전환 계획 메모를 추가했다.
- `docs/review_notes.md`에 React 전환 결정 기록과 후속 검토 메모를 추가했다.
- 기존 에셋 삭제는 아직 실행하지 않았다.

### React 전환 방향 Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

### React 전환 준비 정리

- 사용자가 필요 없는 파일을 삭제했다고 알려왔다.
- React 전환을 위해 기존 정적 UI 프로토타입과 테스트 에셋을 제거한 상태를 커밋 대상으로 정리했다.
- `README.md`를 현재 프로젝트 구조에 맞게 수정하고, 실행 가능한 프론트엔드 앱이 아직 없음을 명시했다.
- `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`, `src/.gitkeep`, `tests/.gitkeep` 삭제 상태를 반영했다.
- `협업방식가이드.md`를 프로젝트 문서로 커밋 대상에 포함한다.
- `.DS_Store`는 macOS 시스템 파일이므로 커밋 대상에서 제외한다.

### React 앱 생성 절차 정리

- `frontend/` 디렉토리에 Vite 기반 React JavaScript 앱을 생성하는 방향을 정리했다.
- `npm create vite@latest frontend -- --template react`를 앱 생성 명령으로 기록했다.
- `npm install`, `npm run dev`, `npm run build`를 conda 없이 시스템 Node.js와 npm으로 실행하는 방식으로 정리했다.
- React 초기 구조는 `components/`, `features/`, `lib/`, `styles/` 중심으로 나누는 방향을 기록했다.
- `docs/implementation_plan.md`에 React 앱 생성 절차 메모를 추가했다.

### React 앱 생성 절차 Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

### Node.js 환경 기준 수정

- 사용자가 Node.js를 이미 시스템에 설치한 상태이며, 프론트엔드 관련 작업은 conda를 사용하지 않는 것으로 확정했다.
- 로컬 시스템 Node.js와 npm은 후속 확인 결과 Node.js `v24.18.0`, npm `11.16.0` 기준으로 정리했다.
- `AGENTS.md`에 Python은 conda `DV`를 사용하되, Node.js, npm, Vite, React 명령은 시스템 Node.js를 사용한다는 규칙을 추가했다.
- `docs/implementation_plan.md`와 `README.md`의 React 실행 기준을 conda 미사용 방식으로 수정했다.
- 팀원 간 차이는 설치 방식이 아니라 Node.js 버전 기준으로 관리해야 한다고 기록했다.

### Node.js 환경 기준 수정 Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

### Vite React 앱 생성 상태 반영

- 사용자가 `npm create vite@latest frontend -- --template react`를 실행하고 `frontend/`로 이동한 상태임을 확인했다.
- `frontend/package.json`, `frontend/vite.config.js`, `frontend/index.html`, `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/App.css`, `frontend/src/index.css`가 생성된 것을 확인했다.
- `frontend/package-lock.json`과 `frontend/node_modules/`가 존재하므로 현재 로컬 상태에서는 의존성 설치가 완료된 상태로 판단했다.
- `frontend/.nvmrc`를 추가하고 `frontend/package.json` `engines`에 Node.js `>=24 <25`, npm `>=11` 기준을 기록했다.
- `docs/implementation_plan.md`에 React 앱 생성 상태 메모를 추가했다.
- `README.md`의 현재 상태, 프로젝트 구조, 실행 방법을 `frontend/` 생성 이후 기준으로 수정했다.

### Vite React 앱 생성 상태 Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

### 노드 기반 그래프 요구사항 문서화

- 사용자가 React 프론트엔드 기틀 구축 전에 서비스 요구사항을 먼저 설명하겠다고 요청했다.
- `docs/PRD.md`에 main 노드 설정, 시작 노드 기반 사이드바, 미니 그래프 hover 설명, 미니 그래프 노드 클릭 진입, 우측 상단 미니 그래프, 전체화면 그래프 전환 요구사항을 반영했다.
- `docs/requirements.md`에 `REQ-017`부터 `REQ-023`까지 신규 요구사항을 추가했다.
- `docs/implementation_plan.md`에 시작 노드 탐색 UI 구현 단계와 React 컴포넌트 분업 메모를 추가했다.
- `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`가 현재 작업트리에서 없음을 확인하고, AGENTS 문서 기준에 맞춰 간결한 추적 문서로 복구했다.

## 2026-07-01

### 채팅 입력창 위치 안정화

- `frontend/src/Modern.css`에서 채팅 작업공간을 viewport 높이 안의 3행 grid 구조로 변경했다.
- 메시지 목록만 내부 스크롤되도록 수정하고, 입력창은 하단 고정 행에 배치했다.
- 기존 sticky 입력창과 큰 하단 padding 조합을 제거하여 문서 맨 아래에서 입력창 아래 빈 공간이 생기지 않도록 했다.
- 좁은 화면에서도 입력창 하단 간격이 과도하게 벌어지지 않도록 모바일 padding 규칙을 조정했다.
- `docs/test_plan.md`와 `docs/review_notes.md`에 검증 결과와 검토 기록을 추가했다.

### 채팅 입력창 위치 안정화 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 권한 상승으로 Vite 개발 서버를 `http://127.0.0.1:5179/`에서 실행했다.
- 브라우저에서 데스크톱과 좁은 화면 모두 문서 전체 스크롤 없이 메시지 목록만 스크롤되는 것을 확인했다.
- 메시지 목록을 맨 아래까지 스크롤해도 입력창 하단 간격이 유지되는 것을 확인했다.

### 채팅 입력창 위치 안정화 Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

### 노드 기반 그래프 요구사항 Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

### React 프론트엔드 기틀 구현

- 사용자가 확정한 정책에 따라 시작 노드는 루트 노드만 의미하고, 노드와 세션은 1:1 관계이며, main은 루트부터 지정 노드까지의 부모 경로 전체로 정의했다.
- `frontend/src/App.jsx`의 Vite 기본 예제 화면을 제거하고 노드 기반 채팅 그래프 작업공간으로 교체했다.
- `frontend/src/components/ChatWorkspace.jsx`, `FullscreenGraphModal.jsx`, `MiniGraph.jsx`, `StartNodeSidebar.jsx`, `TopMiniGraph.jsx`를 추가하여 팀원이 컴포넌트 단위로 분업할 수 있게 했다.
- `frontend/src/features/branchGraph/branchGraphModel.js`를 추가하여 루트 노드 조회, 노드 선택, main 경로 계산, 메시지 송수신, 부모 메시지 ID를 포함한 메시지 기준 브랜치 생성, SVG 그래프 레이아웃 계산을 UI와 분리했다.
- `frontend/src/features/branchGraph/mockData.js`에 루트 노드 2개, 하위 노드, main 경로, 비활성 노드, 전체화면 전환 확인용 Mock 데이터를 추가했다.
- `frontend/src/features/branchGraph/mockLlmProvider.js`를 추가하여 실제 LLM API 교체 전 Mock 응답 계층을 분리했다.
- `frontend/src/App.css`, `frontend/src/index.css`를 작업공간 UI 기준으로 재작성했다.
- `README.md`, `frontend/README.md`, `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 구현 상태와 확정 정책을 반영했다.

### React 프론트엔드 기틀 검증 결과

## 2026-07-02

### 로컬 FastAPI 연동 실행 보정

- `frontend/.env.development`를 추가하여 Vite 개발 서버가 기본적으로 `http://127.0.0.1:8001` FastAPI 서버를 호출하도록 설정했다.
- `frontend/package.json`에 `npm run dev`의 host와 port를 고정하고, Mock API 확인용 `npm run dev:mock` 스크립트를 추가했다.
- `frontend/src/features/branchGraph/branchGraphApi.js`에서 세션 제목 수정, 브랜치 이름 수정, merge 요청 경로를 실제 FastAPI 라우터와 맞췄다.
- `frontend/src/App.jsx`에서 merge 요청 전에 부모 브랜치의 직접 메시지를 조회해 백엔드가 요구하는 `fork_from_message_id`를 전달하도록 수정했다.
- `app/main.py`의 CORS 설정에 로컬 Vite 개발 포트 범위를 허용하는 정규식을 추가했다.
- `app/repositories/repository.py`와 `app/routers/branches.py`에 휴지통 영구 삭제에 필요한 브랜치 subtree 삭제 API를 추가하고, root branch의 `deleted` 상태 전환을 허용했다.

### 로컬 FastAPI 연동 Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

### 로컬 FastAPI 연동 검증 결과

- `frontend/`에서 `npm run lint`를 실행하여 ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build`를 실행하여 Vite 프로덕션 빌드가 통과했다.
- `DV` conda 환경에서 `python -m compileall app`을 실행하여 백엔드 Python 컴파일이 통과했다.
- 수정된 FastAPI 서버를 `http://127.0.0.1:8001`에서 실행하고 `/health` 응답이 `200 OK`임을 확인했다.
- 실제 HTTP 요청으로 세션 생성, 채팅 전송, 브랜치 메시지 조회, 세션 그래프 조회가 성공하는 것을 확인했다.
- 실제 HTTP 요청으로 세션 제목 수정, 브랜치 생성, 브랜치 이름 수정, 브랜치 영구 삭제가 성공하는 것을 확인했다.
- Vite 개발 서버를 `http://127.0.0.1:5173`에서 실행하고, 변환된 모듈에 `VITE_API_BASE_URL=http://127.0.0.1:8001`이 반영된 것을 확인했다.
- `http://127.0.0.1:5173` Origin에서 `http://127.0.0.1:8001/sessions`로 보내는 CORS preflight가 허용되는 것을 확인했다.

### ChatKHU 실제 모델 응답 전환

- `.env`에 `CHATKHU_API_KEY`가 설정되어 있음을 값 노출 없이 확인했다.
- ChatKHU 게이트웨이 모델 목록을 조회하여 현재 키로 `gpt-5.4-mini` 모델에 접근 가능함을 확인했다.
- `frontend/src/App.jsx`의 기본 채팅 provider와 model을 `chatkhu`, `gpt-5.4-mini`로 변경했다.
- `frontend/src/features/branchGraph/branchGraphApi.js`의 merge 기본 provider와 model을 `chatkhu`, `gpt-5.4-mini`로 변경했다.
- `app/schemas/schemas.py`의 채팅 및 merge 기본 provider와 model을 `chatkhu`, `gpt-5.4-mini`로 변경했다.
- `app/services/providers.py`에서 `chatkhu` provider 요청 시 API 키가 없으면 Mock fallback을 쓰지 않고 명시적으로 오류를 내도록 수정했다.

### ChatKHU 실제 모델 응답 검증 결과

- `gpt-4o-mini`는 현재 ChatKHU 키에서 `permission_denied`로 접근할 수 없음을 확인했다.
- `gpt-5.4-mini`로 `POST /chat` 요청을 보내 실제 ChatKHU 모델 응답이 `200 OK`로 반환되는 것을 확인했다.
- 백엔드 서버를 재시작한 뒤 모델 필드를 생략한 기본 `/chat` 요청도 ChatKHU `gpt-5.4-mini` 응답을 반환하는 것을 확인했다.
- `frontend/`에서 `npm run lint`를 실행하여 ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build`를 실행하여 Vite 프로덕션 빌드가 통과했다.
- `DV` conda 환경에서 `python -m compileall app`을 실행하여 백엔드 Python 컴파일이 통과했다.
- 실행 중인 Vite 개발 서버의 변환 결과에 `DEFAULT_MODEL_PROVIDER = "chatkhu"`와 `DEFAULT_MODEL_NAME = "gpt-5.4-mini"`가 반영된 것을 확인했다.

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 권한 상승으로 Vite 개발 서버를 `http://127.0.0.1:5173/`에서 실행했고, `curl -I` 응답이 `200 OK`임을 확인했다.
- 브라우저 검증으로 루트 노드 2개, 우측 상단 미니 그래프, 전체화면 버튼, 채팅 작업공간 렌더링을 확인했다.
- 브라우저에서 루트 노드 선택, 그래프 노드 진입, main 지정, 전체화면 그래프 열기와 닫기, 메시지 송수신, 메시지 기준 브랜치 생성을 확인했다.
- 브라우저 콘솔 오류가 없음을 확인했다.

### React 프론트엔드 기틀 Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

### 중앙 채팅 랜딩 UI 구현

- 사용자가 첨부한 ChatKHU형 화면을 참고하여 중앙 영역에 채팅 랜딩 페이지와 대형 메시지 입력창을 추가했다.
- `frontend/src/components/ChatLanding.jsx`를 추가하여 시작 문구, 현재 루트 노드명, 메시지 입력창, 프롬프트 모드 버튼을 구현했다.
- `frontend/src/App.jsx`에 랜딩 표시 상태를 추가하고, 새 채팅 클릭 시 랜딩으로 돌아가며 메시지 전송 또는 미니 그래프 노드 클릭 시 중앙 채팅 세션으로 진입하게 했다.
- `frontend/src/components/StartNodeSidebar.jsx`에 `새 채팅` 버튼을 추가했다.
- `frontend/src/App.css`를 수정하여 기존 중앙 그래프 중심 레이아웃을 중앙 채팅 중심 레이아웃으로 변경하고, 우측 상단 미니 그래프를 보조 패널로 축소했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`, `README.md`, `frontend/README.md`에 중앙 채팅 랜딩 요구사항과 구현 상태를 반영했다.

### 중앙 채팅 랜딩 UI 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- `git diff --check` 실행 결과, 공백 오류가 발견되지 않았다.
- 브라우저에서 `검증 계획` 노드 진입 시 `프로젝트 기획`, `사용자 흐름`, `그래프 정책`, `검증 계획` 네 섹션과 8개 메시지가 표시되는 것을 확인했다.
- 브라우저 콘솔 오류가 없음을 확인했다.
- 브라우저에서 중앙 랜딩 문구, 대형 메시지 입력창, 루트 노드 2개, 메시지 전송 후 중앙 채팅 세션 전환을 확인했다.

### 중앙 채팅 랜딩 UI Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

### 상위 대화 컨텍스트 표시 구현

- 사용자가 특정 노드에서는 상위 노드의 대화를 모두 보여줘야 한다고 요청했다.
- `검증 계획` 노드에서는 `프로젝트 기획`, `사용자 흐름`, `그래프 정책`, `검증 계획`의 대화 내용이 모두 포함되어야 한다는 예시를 확인했다.
- `frontend/src/features/branchGraph/branchGraphModel.js`에 `getContextSectionsForNode`를 추가하여 루트부터 현재 노드까지의 경로와 각 노드의 1:1 세션을 묶어 반환하게 했다.
- `frontend/src/components/ChatWorkspace.jsx`를 수정하여 현재 세션만 표시하지 않고 상위 경로의 세션들을 `상위 노드`와 `현재 노드` 섹션으로 누적 표시하게 했다.
- 상위 노드 메시지에서 브랜치를 생성하면 해당 메시지를 가진 상위 노드를 부모로 새 브랜치가 생성되도록 `addBranchFromMessage`와 호출부를 수정했다.
- `frontend/src/App.css`에 컨텍스트 섹션 헤더 스타일과 포함 노드 요약 표시를 추가했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`, `README.md`, `frontend/README.md`에 상위 대화 컨텍스트 요구사항과 구현 상태를 반영했다.

### 상위 대화 컨텍스트 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- `git diff --check` 실행 결과, 공백 오류가 발견되지 않았다.

### 상위 대화 컨텍스트 Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-28 원격 저장소 연결 및 마크다운 제외 처리

### 요청 사항

- GitHub 저장소 `JihunPyo/ramo`를 로컬 저장소 remote로 설정한다.
- 현재 로컬 작업물을 원격 저장소에 올린다.
- `.md` 파일은 전부 원격 반영 대상에서 제외한다.

### 반영 계획

- 루트 `.gitignore`에 `*.md` 규칙을 추가하여 마크다운 파일을 로컬 전용으로 관리한다.
- 기존에 Git이 추적하던 `.md` 파일은 `git rm --cached`로 인덱스에서만 제거하고, 로컬 파일은 유지한다.
- 원격에는 비마크다운 프로젝트 파일과 `.md` 추적 해제 상태만 커밋하여 푸시한다.

## 2026-06-28 프론트엔드 API 계약 연동 수정 계획

### 변경 사항

- 사용자가 현재 구현된 UI가 백엔드 API 계약에 맞게 호출 가능한지 점검한 뒤 수정 계획 수립을 요청했다.
- `docs/requirements.md`에 `REQ-026`을 추가하여 프론트엔드 API 호출 계층과 DTO 변환 계층 요구사항을 명시했다.
- `docs/implementation_plan.md`에 React API 계약 연동 수정 계획을 추가했다.
- `docs/test_plan.md`에 API 계약 연동 검증 항목 `TP-013`과 자동화 후보를 추가했다.
- `docs/requirement_status.md`에 `REQ-026` 상태를 미구현으로 기록했다.
- `docs/review_notes.md`에 프론트엔드 API 계약 적합성 검토 결과와 수정 방향을 기록했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 모델 선택 토글 UI 통일 및 팝오버 잘림 방지

### 변경 사항

- 랜딩 화면과 세션 내부 대화 화면에서 동일한 `ModelSelector` 컴포넌트를 사용하도록 모델 선택 토글 UI를 통일했다.
- `frontend/src/components/ModelSelector.jsx`에서 모델 선택 팝오버를 `document.body` 포털로 렌더링하도록 변경하여 부모 컨테이너 영역에 의해 잘리는 문제를 방지했다.
- 팝오버 위치 계산, 외부 클릭 닫기, `Escape` 닫기, 스크롤 및 리사이즈 시 닫기 처리를 추가했다.
- `frontend/src/components/SplitConversationPanel.jsx`의 기존 네이티브 `select` 모델 선택 UI를 공통 `ModelSelector`로 교체했다.
- `frontend/src/Modern.css`에서 포털 기반 팝오버 스타일과 선택 트리거의 열린 상태 스타일을 정리했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/Modern.css frontend/src/components/ModelSelector.jsx frontend/src/components/SplitConversationPanel.jsx` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 프론트 추적 파일 3개만 커밋 대상으로 스테이징했다.
- 루트 `commit_log.md`는 저장소의 `.gitignore` 규칙에 따라 무시 대상이므로 커밋 대상에서 제외했다.

## 2026-07-05 모델 선택 팝오버 portal 통일

### 변경 사항

- `frontend/src/components/ModelSelector.jsx`에서 모델 선택 팝오버를 컴포넌트 내부 absolute 요소가 아니라 `document.body` portal로 렌더링하도록 수정했다.
- 팝오버 위치를 trigger 기준으로 계산하되, viewport 남은 공간에 따라 위/아래 방향을 자동 선택하고 화면 안에 들어오도록 left, top, max-height를 보정했다.
- 랜딩 페이지, 기본 채팅 세션, 스플릿 대화 패널이 모두 동일한 `ModelSelector` 컴포넌트를 사용하도록 `frontend/src/components/SplitConversationPanel.jsx`의 native select를 제거했다.
- `frontend/src/Modern.css`에서 portal 팝오버에 맞춰 fixed 배치와 높은 z-index를 적용하고, Gemma, Upstage, LG AI 모델 마크 색상을 추가했다.

### 검증 결과

- 브라우저 검증에서 랜딩 페이지 모델 선택 팝오버가 `BODY` 하위 portal로 렌더링되고 viewport 안에 온전히 표시되는 것을 확인했다.
- 브라우저 검증에서 세션 내부 대화 화면의 모델 선택 팝오버도 같은 9개 그룹, 같은 3열 grid 구조로 표시되는 것을 확인했다.
- 코드 검사에서 `ChatLanding`, `ChatWorkspace`, `SplitConversationPanel`이 모두 `ModelSelector`를 사용하고 native `<select>`가 남아 있지 않음을 확인했다.
- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/components/ModelSelector.jsx frontend/src/components/SplitConversationPanel.jsx frontend/src/Modern.css` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 ChatKHU 모델 ID 목록 정합화

### 변경 사항

- 사용자가 조회한 `GET /v1/gateway/models/` 응답 기준으로 `frontend/src/App.jsx`의 모델 ID를 실제 제공 모델 ID와 맞췄다.
- 존재하지 않는 `claude-3-5-sonnet`, `claude-4-6-sonnet`, `claude-4-5-sonnet`, `gemini-3.1-pro`, `gemini-3-flash`, `grok-4.1-fast`, `llama-4-maverick`, `deepseek-chat` 등을 제거하거나 실제 ID로 교체했다.
- Claude 계열은 `claude-sonnet-5`, `claude-sonnet-4-6`, `claude-sonnet-4-5-20250929`, `claude-opus-*`, `claude-haiku-4-5-20251001` 기준으로 정리했다.
- Gemini, xAI, Gemma, Meta, Perplexity, Upstage, LG AI 모델도 `/models` 응답의 정확한 ID를 사용하도록 추가했다.
- 모델 비교용 OpenAI 목록에서도 `/models` 응답에 없는 `gpt-5-nano`, `gpt-4.1*`, `gpt-4o*` 항목을 제거했다.

### 검증 결과

- `frontend/src/App.jsx`에서 추출한 38개 모델 ID가 모두 사용자가 제공한 ChatKHU `/models` 응답에 존재함을 스크립트로 확인했다.
- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/App.jsx frontend/src/components/ModelComparisonFlow.jsx` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 비 OpenAI 모델 ChatKHU provider 매핑

### 변경 사항

- `frontend/src/App.jsx`에서 Claude, Gemini, X-AI, Meta, Perplexity, DeepSeek 계열 모델의 전송 provider를 모두 `chatkhu`로 변경했다.
- 모델 선택 UI의 공급자별 컬럼 표시는 유지하기 위해 `group`, `groupLabel`, `mark` 메타데이터를 추가했다.
- 모델 비교 창에서도 비 OpenAI 모델 카드가 `ChatKHU`로만 보이지 않고 기존 그룹 라벨을 표시하도록 `frontend/src/components/ModelComparisonFlow.jsx`를 보완했다.
- 답변 융합 모델 fallback 허용 provider를 `openai`와 `chatkhu`로 정리했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- `frontend/src/App.jsx`, `ModelComparisonFlow.jsx`, `ModelSelector.jsx`에서 직접 provider 문자열 `anthropic`, `google`, `xai`, `meta`, `perplexity`, `deepseek`가 모델 전송 provider로 남아 있지 않음을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 로고 클릭 새 채팅 draft 동작 수정

### 변경 사항

- `frontend/src/App.jsx`에 `isNewChatDraft` 상태를 추가하여 랜딩 화면이 기존 active 세션을 메시지 전송 대상으로 유지하지 않도록 수정했다.
- 로고 클릭과 `새 채팅` 버튼 클릭 시 즉시 세션을 생성하지 않고, `새 대화` placeholder를 표시하는 draft 랜딩만 열도록 변경했다.
- draft 랜딩에서 첫 메시지를 전송하면 그 시점에 새 세션을 생성하고, 생성된 main branch로 메시지를 전송한 뒤 해당 세션을 선택하도록 수정했다.
- draft 상태에서 모델 비교를 시작하는 경우에도 기존 세션이 아니라 새 세션을 먼저 생성한 뒤 비교 요청을 보내도록 보완했다.
- 초기 앱 진입 랜딩도 기존 첫 세션을 내부 선택한 상태로 보이지 않도록 draft 상태로 시작하게 변경했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/App.jsx` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run dev:mock`을 실행해 `http://127.0.0.1:5176/` mock 개발 서버를 확인했다.
- 브라우저 검증에서 초기 랜딩 placeholder가 `새 대화에서 무엇이든 물어보세요`로 표시되고 기존 root 카드 선택이 없는 것을 확인했다.
- 브라우저 검증에서 기존 세션 진입 후 로고 클릭 시 `새 대화` draft 랜딩으로 돌아가고 root 카드 선택이 해제되는 것을 확인했다.
- 브라우저 검증에서 draft 랜딩 첫 메시지 전송 후 root 세션 수가 2개에서 3개로 증가하고, 새 `새 대화` 세션이 선택되며 메시지가 해당 세션에 표시되는 것을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 ChatKHU 모델 선택지 추가

### 변경 사항

- `frontend/src/App.jsx`의 채팅 모델 목록에 `chatkhu` provider 기반 `GPT-4o mini (ChatKHU)`, `GPT-4o (ChatKHU)` 선택지를 추가했다.
- 선택된 ChatKHU 모델이 `/chat` 요청의 `model_provider: "chatkhu"`와 `model_name`으로 전달되어 백엔드의 `CHATKHU_API_KEY` 및 ChatKHU gateway provider 분기를 사용할 수 있게 했다.
- 모델 비교 후 답변 융합 시 현재 선택 모델이 ChatKHU인 경우에도 OpenAI/Anthropic처럼 해당 provider를 그대로 사용하도록 허용했다.
- `frontend/src/components/ModelSelector.jsx`와 `frontend/src/components/ModelComparisonFlow.jsx`에 ChatKHU 표시 라벨을 추가했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-02 app API 구조 반영 프론트엔드 수정

### 변경 사항

- `frontend/src/features/branchGraph/branchGraphApi.js`에서 세션 휴지통, 브랜치 휴지통, main 경로 선택, 브랜치 병합 API 호출 함수를 현재 `app/` 라우트 구조에 맞게 수정했다.
- `frontend/src/App.jsx`에서 세션 삭제를 브랜치 상태 패치가 아니라 `DELETE /sessions/{session_id}` 호출로 전환했다.
- `frontend/src/App.jsx`에서 병합 요청을 `POST /branches/merge`와 `parent_branch_ids` 요청 바디 기준으로 전환했다.
- `frontend/src/features/branchGraph/branchGraphAdapter.js`에서 `BranchOut.merge_parent_ids`, `BranchOut.is_main`, 세션 휴지통 응답, 브랜치 휴지통 응답을 프론트 노드 상태로 변환하도록 보완했다.
- `frontend/src/features/branchGraph/mockBranchGraphApi.js`에서 실제 API와 같은 함수명과 DTO 필드를 지원하도록 Mock API를 갱신했다.

### 확인 사항

- `app/routers/branches.py`에는 `POST /branches/{branch_id}/select-main` 라우트가 있으나, 현재 `app/repositories/repository.py`에서 `select_main_branch` 구현은 확인되지 않았다.
- 프론트엔드는 해당 라우트 구조에 맞춰 호출하도록 수정했으며, 실제 서버에서 main 경로 저장을 사용하려면 백엔드 repository 구현이 필요하다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-02 답변 렌더링, 대기 UI, 병합 결과 표시 구현

### 변경 사항

- `frontend/src/components/RichMessageContent.jsx`를 추가하여 LLM 답변의 제목, 목록, 표, 코드 블록, 인용문, 인라인 코드, 링크, 굵은 텍스트를 구조화해 렌더링하도록 구현했다.
- `frontend/src/components/ChatWorkspace.jsx`에서 메시지 본문을 구조화 렌더링 컴포넌트로 교체하고, 답변 생성 대기 중 AI 버블과 스켈레톤 UI를 표시하도록 수정했다.
- `frontend/src/Modern.css`에 구조화 답변, 코드 블록, 표, 대기 버블, 점 애니메이션, 스켈레톤 스타일을 추가했다.
- `frontend/src/features/branchGraph/mockLlmProvider.js`의 Mock 응답을 목록, 표, 인용문을 포함한 구조화 답변 형태로 변경했다.
- `frontend/src/features/branchGraph/branchGraphAdapter.js`에서 hidden, system 메시지를 사용자 화면에서 제외할 수 있도록 메시지 상태와 숨김 플래그를 보존했다.
- `frontend/src/features/branchGraph/mockBranchGraphApi.js`에서 병합 내부 프롬프트를 hidden system 메시지로 저장하고, 사용자에게는 정돈된 병합 요약 메시지만 표시하도록 수정했다.
- `frontend/src/features/branchGraph/branchGraphModel.js`에 `setMergedNodeParentLinks`를 추가하여 병합 노드의 두 부모 엣지를 프론트 상태에 보존하도록 했다.
- `frontend/src/App.jsx`에서 병합 확정 후 API 응답 그래프를 불러온 다음 선택된 두 부모 링크를 병합 노드에 다시 적용하도록 수정했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 답변 렌더링, 답변 대기 UI, 병합 결과 표시 요구사항과 구현 상태를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-02 그래프 툴바 단순화 및 스크롤 감도 조정

### 변경 사항

- `frontend/src/components/MiniGraph.jsx`에서 그래프 툴바의 `화면 맞춤` 버튼을 제거했다.
- `frontend/src/components/MiniGraph.jsx`에서 그래프 툴바의 `현재 노드` 버튼과 전용 이동 함수를 제거했다.
- `frontend/src/components/MiniGraph.jsx`에서 확대 비율 퍼센트 표시를 제거했다.
- `frontend/src/components/MiniGraph.jsx`에서 휠 입력 확대/축소 계수를 기존 `1.12`/`0.89`에서 `1.045`/`0.957`로 낮춰 그래프창 입력 감도를 완화했다.
- `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 그래프 툴바 단순화와 감도 조정 내용을 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-28 로컬 FastAPI-React 통합 실행 보정

### 변경 사항

- `app/services/providers.py`에 `local` LLM provider를 추가하여 외부 LLM API 키 없이도 로컬 채팅 응답을 생성할 수 있게 했다.
- `openai`, `anthropic`, `chatkhu` provider 요청도 관련 API 키가 없으면 로컬 provider로 fallback되도록 했다.
- `app/services/auto_tagger.py`의 OpenAI 클라이언트 생성을 lazy 초기화로 변경하고, API 키가 없을 때 세션 제목, 브랜치 이름, 키워드, 메모리 추출이 간단한 로컬 fallback으로 처리되게 했다.
- `app/services/embedding_service.py`의 OpenAI 클라이언트 생성을 lazy 초기화로 변경하고, API 키가 없을 때 임베딩 저장을 건너뛰도록 했다.
- `frontend/src/App.jsx`의 기본 채팅 provider를 `local`, 기본 모델명을 `local-mock`으로 변경하여 실제 FastAPI 서버와 로컬 통합 확인이 가능하게 했다.
- `.gitignore`에 `chat.db`를 추가하여 FastAPI 실행 중 생성되는 SQLite 로컬 데이터 파일을 Git 추적 대상에서 제외했다.

### 검증 결과

- `DV` conda 환경에서 `python -m compileall app` 실행 결과, 백엔드 Python 파일 컴파일이 통과했다.
- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- FastAPI 서버를 `http://127.0.0.1:8000`에서 실행하고 `/health` 응답이 `200 OK`임을 확인했다.
- 실제 API로 세션 생성, 그래프 조회, 로컬 채팅 응답, 브랜치 메시지 조회를 확인했다.
- `VITE_API_BASE_URL=http://127.0.0.1:8000`와 `VITE_USE_MOCK_API=false`로 Vite 서버를 `http://127.0.0.1:5174`에서 실행했다.
- 브라우저에서 프론트 UI 입력을 전송했고, 백엔드의 로컬 Mock 응답이 화면에 표시되며 콘솔 오류가 없음을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않는다.

## 2026-06-28 .env API 키 기반 서버 재기동

### 변경 사항

- `.env`에 `OPENAI_API_KEY`와 `CHATKHU_API_KEY`가 존재함을 키 이름 기준으로 확인했다.
- 기존 로컬 Mock 확인용 백엔드와 프론트 서버를 중지했다.
- `frontend/src/App.jsx`에서 기본 채팅 provider를 `import.meta.env.VITE_MODEL_PROVIDER ?? 'openai'`로, 기본 모델명을 `import.meta.env.VITE_MODEL_NAME ?? 'gpt-4o-mini'`로 변경했다.
- 프론트 실행 시 `VITE_API_BASE_URL`, `VITE_USE_MOCK_API`, `VITE_MODEL_PROVIDER`, `VITE_MODEL_NAME`을 통해 실제 FastAPI 서버와 실제 LLM provider를 선택할 수 있게 했다.
- `.gitignore`에 `.env`를 추가하여 API 키 파일이 Git 추적 대상에 올라가지 않도록 했다.

### 검증 결과

- `DV` conda 환경에서 FastAPI 서버를 `http://127.0.0.1:8000`으로 다시 실행했다.
- `/health` 응답이 `200 OK`임을 확인했다.
- `model_provider=chatkhu`, `model_name=gpt-4o-mini` 요청은 `403 permission_denied - No access to Model 'gpt-4o-mini'`로 실패했다.
- `model_provider=openai`, `model_name=gpt-4o-mini` 요청은 정상 응답을 반환했다.
- `frontend/`에서 `npm run lint`, `npm run build`, 프로젝트 루트에서 `git diff --check`가 통과했다.
- Vite 프론트 서버를 `http://127.0.0.1:5174`에서 `VITE_API_BASE_URL=http://127.0.0.1:8000`, `VITE_USE_MOCK_API=false`, `VITE_MODEL_PROVIDER=openai`, `VITE_MODEL_NAME=gpt-4o-mini` 설정으로 다시 실행했다.
- 브라우저에서 메시지를 전송했고, 로컬 Mock 문구가 아닌 실제 API 응답이 화면에 표시되며 콘솔 오류가 없음을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않는다.

## 2026-06-28 App.jsx Mock 설정 복구

### 변경 사항

- 사용자 요청에 따라 `frontend/src/App.jsx`의 기본 채팅 provider를 `local`, 기본 모델명을 `local-mock`으로 되돌렸다.
- 실제 API 키 기반 OpenAI 기본값 대신 백엔드 로컬 Mock provider를 기본으로 사용하도록 복구했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- 기존 `VITE_MODEL_PROVIDER=openai` 프론트 서버를 중지했다.
- `VITE_USE_MOCK_API=true`로 Vite 프론트 서버를 `http://127.0.0.1:5174`에서 다시 실행했다.
- 브라우저에서 Mock 루트 데이터인 `LLM 학습 전략`, `프로젝트 기획`이 표시되고 실제 API 세션 문구가 표시되지 않음을 확인했다.
- 브라우저에서 메시지를 전송했고, API 키 응답 문구가 아닌 Mock 데이터 기반 응답이 화면에 표시되며 콘솔 오류가 없음을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않는다.

## 2026-06-28 답변 메시지 기준 브랜치 생성 수정

### 변경 사항

- `frontend/src/components/ChatWorkspace.jsx`에서 `브랜치 생성` 버튼을 `message.role === 'assistant'`인 AI 답변 메시지에만 표시하도록 수정했다.
- 사용자 메시지에는 `브랜치 생성` 버튼을 표시하지 않도록 변경했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 답변 메시지 기준 브랜치 생성 정책과 검증 결과를 기록했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- Vite 개발 서버 `http://127.0.0.1:5175/`에서 브라우저 검증을 진행했다.
- `API 연동` 노드의 `User` 메시지 3개에는 `브랜치 생성` 버튼이 없고, `AI` 답변 메시지 2개에는 버튼이 있는 것을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-28 그래프 하단 노드 클릭 방해 수정

### 변경 사항

- `frontend/src/App.css`에서 `.graph-tooltip`을 절대 위치 오버레이가 아니라 그래프 아래 정적 정보 패널로 변경했다.
- `.mini-graph`를 세로 flex 레이아웃으로 변경하여 SVG 그래프와 설명 패널이 겹치지 않게 했다.
- 하단 노드 hover 시 설명이 노드 위를 덮어 클릭 이동을 막는 문제를 수정했다.
- `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 수정 사항과 검증 결과를 기록했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- Vite 개발 서버 `http://127.0.0.1:5175/`에서 브라우저 검증을 진행했다.
- 우측 상단 그래프의 하단 `UI 분업` 노드 클릭 후 현재 세션 제목과 활성 그래프 노드가 `UI 분업`으로 변경되는 것을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-28 그래프 hover 팝오버 안정화

### 변경 사항

- `frontend/src/components/MiniGraph.jsx`에서 그래프 노드 설명 팝오버가 개별 노드 `mouseleave`로 즉시 닫히지 않도록 수정했다.
- 노드 hover 또는 focus 시 팝오버를 표시하고, 그래프 컨테이너 이탈 또는 전체 focus 이탈 시에만 닫히게 했다.
- 팝오버 내부 `main 지정` 버튼 클릭 이벤트 전파를 차단하여 버튼을 실제로 클릭할 수 있게 했다.
- `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 1번 수정 사항과 검증 결과를 기록했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- Vite 개발 서버 `http://127.0.0.1:5175/`에서 브라우저 검증을 진행했다.
- 브라우저에서 `main 지정` 버튼 클릭 후 대상 노드가 main 경로 상태로 변경되는 것을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-28 프론트엔드 API 계약 연동 구현

### 변경 사항

- `frontend/src/lib/apiClient.js`를 추가하여 `VITE_API_BASE_URL` 기반 HTTP 요청과 API 오류 변환을 구현했다.
- `frontend/src/features/branchGraph/branchGraphApi.js`를 추가하여 세션 생성, 세션 목록, 그래프 조회, 브랜치 메시지 조회, 채팅 전송, 브랜치 생성, 브랜치 상태 수정 API wrapper를 구현했다.
- `frontend/src/features/branchGraph/branchGraphAdapter.js`를 추가하여 백엔드 Graph API 응답을 기존 프론트 노드 그래프 상태로 변환하게 했다.
- `frontend/src/features/branchGraph/mockBranchGraphApi.js`를 추가하여 실제 서버가 없어도 동일한 함수명과 요청 필드로 UI를 검증할 수 있게 했다.
- `frontend/src/App.jsx`를 수정하여 로컬 Mock 상태 직접 조작 대신 API 계층을 통해 새 채팅, 메시지 전송, 브랜치 생성, 노드 메시지 조회, 그래프 갱신을 수행하게 했다.
- `frontend/src/components/ChatLanding.jsx`, `frontend/src/components/ChatWorkspace.jsx`, `frontend/src/components/StartNodeSidebar.jsx`에 busy 상태 기반 disabled 처리를 추가했다.
- `frontend/src/App.css`에 API 동기화 상태, 오류 메시지, 빈 상태, disabled 스타일을 추가했다.
- `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 API 계약 연동 구현 상태와 검증 결과를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 권한 상승으로 Vite 개발 서버를 `http://127.0.0.1:5174/`에서 실행했고, HTTP `200 OK` 응답을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-28 새 채팅 루트 노드 생성 수정

### 변경 사항

- `frontend/src/App.jsx`에서 새 채팅 버튼 클릭 시 `createSession(title)`으로 새 세션과 루트 노드를 생성하도록 수정했다.
- 새 루트 제목은 기존 새 대화 루트 개수에 따라 `새 대화`, `새 대화 2` 형식으로 생성하게 했다.
- 세션 생성 응답의 main branch ID를 기준으로 새 루트 노드를 active, selected 상태로 다시 로드하게 했다.
- `frontend/src/features/branchGraph/branchGraphAdapter.js`에서 백엔드 루트 라벨이 비어 있거나 `main`이면 세션 제목으로 표시하도록 보정했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 새 채팅 루트 노드 생성 정책과 검증 결과를 기록했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- Vite 개발 서버 `http://127.0.0.1:5175/`에서 브라우저 검증을 진행했다.
- 새 채팅을 두 번 클릭했을 때 루트 노드 수가 2개에서 3개, 4개로 증가하고, 새 루트가 각각 `새 대화`, `새 대화 2`로 선택되는 것을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-30 사이드바 접기/펴기 기능 추가

### 변경 사항

- `frontend/src/App.jsx`에 `isSidebarCollapsed` 상태를 추가하여 좌측 사이드바 접힘 여부를 전체 레이아웃에서 관리하게 했다.
- `frontend/src/components/StartNodeSidebar.jsx`에 접기/열기 토글 버튼을 추가했다.
- 토글 버튼은 펼친 상태에서 `사이드바 접기`, 접힌 상태에서 `사이드바 열기` 라벨과 tooltip을 표시하게 했다.
- `frontend/src/App.css`에서 펼친 사이드바 폭 292px, 접힌 사이드바 폭 72px 레이아웃을 추가했다.
- 접힌 상태에서는 사이드바 본문을 숨기고 열기 버튼만 남기도록 했다.
- `MiniGraph`, `TopMiniGraph`, `FullscreenGraphModal`, `ChatWorkspace`의 동작 로직은 수정하지 않았다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 사이드바 접기/펴기 요구사항과 구현, 검증 결과를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- 샌드박스 일반 권한의 Vite 서버 실행은 `listen EPERM`으로 실패했다.
- 권한 상승으로 Vite 개발 서버를 `http://127.0.0.1:5176/`에서 실행했고, HTTP `200 OK` 응답을 확인했다.
- 브라우저에서 초기 사이드바 폭 292px, 접기 후 72px, 다시 열기 후 292px 복구를 확인했다.
- 브라우저에서 토글 버튼 라벨과 tooltip이 `사이드바 접기`와 `사이드바 열기`로 전환되는 것을 확인했다.
- 브라우저 콘솔 오류가 없음을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-30 좁은 화면 사이드바 drawer 전환 추가

### 변경 사항

- `frontend/src/App.jsx`에 `isMobileSidebarOpen`, `isNarrowViewport` 상태를 추가하여 데스크톱 접힘 상태와 좁은 화면 drawer 상태를 분리했다.
- `workspace-topbar`에 좁은 화면 전용 `사이드바 열기` 버튼을 추가했다.
- `frontend/src/components/StartNodeSidebar.jsx`에서 drawer 모드의 버튼 라벨을 `사이드바 닫기`로 전환하게 했다.
- 닫힌 drawer에 `aria-hidden`과 `inert`를 적용해 화면 밖 사이드바 내부 요소가 포커스 대상이 되지 않게 했다.
- `frontend/src/App.css`에서 920px 이하 viewport의 사이드바를 `position: fixed` overlay drawer로 전환했다.
- drawer 외부 클릭 닫기를 위한 `sidebar-backdrop` 스타일을 추가했다.
- 데스크톱에서는 기존 292px 펼침, 72px 접힘 고정 폭을 유지했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 좁은 화면 drawer 전환 요구사항과 구현, 검증 결과를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- 권한 상승으로 Vite 개발 서버를 `http://127.0.0.1:5177/`에서 실행했고, HTTP `200 OK` 응답을 확인했다.
- 1280px viewport에서 기존 292px 고정 사이드바가 유지되고 모바일 열기 버튼이 숨겨지는 것을 확인했다.
- 820px viewport에서 사이드바가 fixed drawer로 전환되고 상단 열기 버튼이 표시되는 것을 확인했다.
- 820px viewport에서 열기 버튼 클릭 시 drawer와 backdrop이 표시되고, 내부 버튼 라벨이 `사이드바 닫기`로 바뀌는 것을 확인했다.
- drawer 닫기 후 `aria-hidden="true"`와 `inert`가 적용되는 것을 확인했다.
- 브라우저 콘솔 오류가 없음을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-30 좁은 화면 사이드바 음영 제거

### 변경 사항

- `frontend/src/App.css`에서 920px 이하 drawer 사이드바의 `box-shadow`를 제거했다.
- 좁은 화면에서 사이드바가 닫혔을 때 왼쪽에 남는 음영이 보이지 않도록 했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- 820px viewport에서 닫힌 drawer의 computed style이 `box-shadow: none`임을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-30 사이드바 viewport 고정 및 내부 스크롤

### 변경 사항

- `frontend/src/components/StartNodeSidebar.jsx`에서 사이드바 본문을 상단 새 채팅 버튼, 내부 스크롤 영역, 하단 사용자 정보 영역으로 분리했다.
- `frontend/src/App.css`에서 데스크톱 사이드바를 `height: 100dvh`, `max-height: 100dvh`, `overflow: hidden` 기준으로 고정했다.
- 루트 노드 목록, 미니 그래프, 휴지통은 `.sidebar-scroll-area` 안에서만 스크롤되도록 변경했다.
- 사이드바 하단에는 사용자 이니셜, 사용자 이름, 플랜을 표시하는 계정 영역을 추가했다.
- 접힌 상태에서는 72px 레일에 하단 아바타만 남기고, 좁은 화면 drawer에서는 전체 사이드바 콘텐츠가 표시되도록 CSS override를 추가했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 `REQ-029` 기준 요구사항과 구현 상태를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- Vite 개발 서버 `http://127.0.0.1:5178/`에서 1280x800 viewport의 사이드바 높이가 800px으로 계산되는 것을 확인했다.
- 데스크톱 접힘 상태에서 사이드바 폭은 72px, 높이는 800px으로 유지되고 하단 아바타만 남는 것을 확인했다.
- 820x700 viewport의 drawer 닫힘과 열림 상태에서 사이드바 높이가 700px으로 계산되는 것을 확인했다.
- drawer 닫힘 상태에서는 `aria-hidden`, `inert`, `box-shadow: none`이 유지되고, drawer 열림 상태에서는 내부 스크롤 영역과 하단 사용자 정보 영역이 표시되는 것을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-06-30 사이드바 임시 사용자 정보 표시 수정

### 변경 사항

- `frontend/src/components/StartNodeSidebar.jsx`의 기본 사용자 정보를 실제 계정처럼 보이는 `영원 조`, `Pro`에서 임시값 `name`과 모크 이미지로 변경했다.
- 로그인 기능 추가 전까지 하단 계정 영역이 실제 사용자 정보로 오해되지 않도록 플랜 문구를 제거했다.
- `frontend/src/App.css`에서 하단 아바타 스타일을 텍스트 이니셜 원형 배지에서 이미지 아바타 표시 방식으로 변경했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-01 사이드바 브랜치 표시 제거

### 변경 사항

- `frontend/src/components/StartNodeSidebar.jsx`에서 `Branch workspace` 표기와 사이드바 내부 미니 그래프 렌더링을 제거했다.
- `frontend/src/App.jsx`에서 사이드바로 전달하던 그래프 선택, main 지정, 휴지통 이동 props를 제거했다.
- `frontend/src/App.css`와 `frontend/src/Modern.css`에서 더 이상 사용하지 않는 `.sidebar-graph-panel` 스타일 참조를 제거했다.
- 사이드바 휴지통의 브랜치 용어를 `항목`으로 바꾸어 사이드바 안에서 브랜치 표현이 노출되지 않게 했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 사이드바 브랜치 그래프 미표시 정책과 검증 결과를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- 일반 샌드박스 권한의 Vite 서버 실행은 `listen EPERM`으로 실패했다.
- 권한 상승으로 Vite 개발 서버를 `http://127.0.0.1:5173/`에서 실행했고, HTTP `200 OK` 응답을 확인했다.
- 브라우저에서 사이드바에 `Branch workspace` 표기와 미니 그래프가 표시되지 않고, 콘솔 오류가 없음을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.
- 프로젝트 `.gitignore`의 `*.md` 규칙 때문에 문서와 `commit_log.md`는 Git 추적 대상에서 제외된 상태임을 확인했다.

## 2026-07-01 시작 노드 main 리프 진입 수정

### 변경 사항

- `frontend/src/features/branchGraph/branchGraphModel.js`에 `getMainLeafNodeForRoot`를 추가했다.
- `selectRoot`가 루트 노드가 아니라 해당 루트 트리의 main 리프 노드를 active node로 설정하도록 수정했다.
- 명시 main 대상이 없는 루트 트리는 가장 깊은 활성 리프 노드를 fallback main 리프로 계산하게 했다.
- `frontend/src/features/branchGraph/branchGraphAdapter.js`에서 명시 main 대상이 없을 때 루트를 main 대상으로 강제 저장하지 않도록 수정했다.
- `frontend/src/App.jsx`에서 사이드바 시작 노드 클릭 시 main 리프 노드 메시지를 즉시 조회하고 중앙 랜딩 대신 채팅 세션을 표시하도록 수정했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 시작 노드 클릭 시 main 리프 진입 정책과 검증 결과를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- 일반 샌드박스 권한의 Vite 서버 실행은 `listen EPERM`으로 실패했다.
- 권한 상승으로 Vite 개발 서버를 `http://127.0.0.1:5173/`에서 실행했다.
- 브라우저에서 `프로젝트 기획` 클릭 시 `지표 설계` 세션으로, `LLM 학습 전략` 클릭 시 `예시 비교` 세션으로 바로 진입하는 것을 확인했다.
- 브라우저 콘솔 오류가 없음을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.
- 프로젝트 `.gitignore`의 `*.md` 규칙 때문에 문서와 `commit_log.md`는 Git 추적 대상에서 제외된 상태임을 확인했다.

## 2026-07-01 사이드바 세션 우클릭 삭제 추가

### 변경 사항

- `frontend/src/components/StartNodeSidebar.jsx`에 시작 노드 카드 우클릭 컨텍스트 메뉴를 추가했다.
- 우클릭 메뉴에 `세션 삭제` 버튼을 추가하고, 외부 클릭, Escape, 사이드바 닫힘 시 메뉴가 닫히도록 구현했다.
- `frontend/src/App.jsx`에 루트 세션 트리 전체를 휴지통으로 이동하는 핸들러를 추가했다.
- 세션 삭제 실행 시 해당 루트 트리의 모든 브랜치를 `status: deleted`로 전환하고, 현재 세션 삭제 시 중앙 랜딩으로 돌아가도록 했다.
- `frontend/src/features/branchGraph/mockBranchGraphApi.js`에서 루트 브랜치의 `deleted` 상태 전환과 루트 세션 영구 삭제를 허용하도록 수정했다.
- `frontend/src/App.css`에 사이드바 컨텍스트 메뉴 스타일을 추가했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 세션 우클릭 삭제 요구사항과 구현 상태를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- 일반 샌드박스 권한의 Vite 서버 실행은 `listen EPERM`으로 실패했다.
- 권한 상승으로 Vite 개발 서버를 `http://127.0.0.1:5173/`에서 실행했다.
- 브라우저에서 `프로젝트 기획` 시작 노드 우클릭 시 `세션 삭제` 메뉴가 표시되는 것을 확인했다.
- 브라우저 자동화의 확인창 승인 API가 시간 초과되어 UI에서 삭제 확정 이후 상태 검증은 완료하지 못했다.
- Mock API 검증으로 `프로젝트 기획` 세션 트리 8개 브랜치가 `deleted` 상태로 전환되면 세션 그래프에서 제외되고, 복구 후 8개 노드가 다시 표시되는 것을 확인했다.

## 2026-07-01 사이드바 팝업 레이어링 수정

### 변경 사항

- `frontend/src/components/StartNodeSidebar.jsx`에서 사이드바 우클릭 컨텍스트 메뉴를 `document.body` portal로 렌더링하도록 변경했다.
- `frontend/src/components/StartNodeSidebar.jsx`에서 접힘 토글 툴팁을 React 상태 기반 fixed portal 레이어로 변경했다.
- 접힌 사이드바의 `사이드바 열기` 툴팁이 사이드바 오른쪽 경계 밖에서 시작하도록 좌표 계산을 보정했다.
- `frontend/src/App.css`에서 기존 CSS pseudo-element 툴팁을 제거하고 `.sidebar-toggle-tooltip` 스타일을 추가했다.
- `frontend/src/App.css`에서 `.sidebar-context-menu`의 `z-index`를 메인 작업공간보다 높게 조정했다.
- `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/review_notes.md`에 팝업 레이어링 수정과 검증 결과를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- 권한 상승으로 Vite 개발 서버를 `http://127.0.0.1:5173/`에서 실행했다.
- 브라우저에서 우클릭 메뉴가 `BODY` 하위 요소로 렌더링되고, 메인 작업공간과 겹쳐도 최상단에 표시되는 것을 확인했다.
- 브라우저에서 접힌 사이드바의 `사이드바 열기` 툴팁이 `BODY` 하위 요소로 렌더링되고, 사이드바 오른쪽 경계 밖에서 시작하며, viewport 안에 온전히 표시되는 것을 확인했다.

## 2026-07-01 노드 합치기와 휴지통 병합 보정

### 변경 사항

- 원격 `노드 합치기 기능`과 로컬 세션 삭제/휴지통 이동 기능을 함께 유지하도록 병합 보정을 수행했다.
- `frontend/src/features/branchGraph/branchGraphModel.js`에서 main 리프 fallback 계산이 `parentIds` 기반 다중 부모 노드를 자식으로 인식하도록 수정했다.
- `frontend/src/features/branchGraph/branchGraphAdapter.js`에서 삭제된 브랜치 정규화 시 `merged_parent_branch_ids`, `mergedParentBranchIds`, `parent_branch_ids`를 `parentIds`로 유지하도록 수정했다.
- `frontend/src/components/StartNodeSidebar.jsx`에서 휴지통 최상위 항목 판정이 다중 부모를 고려하도록 수정했다.
- `frontend/src/features/branchGraph/mockBranchGraphApi.js`에서 subtree 수집이 `parent_branch_id`와 `merged_parent_branch_ids`를 모두 따라가도록 수정했다.
- `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/review_notes.md`에 병합 보정 내용과 검증 결과를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- Mock API와 모델 검증에서 `project-api`, `project-test`를 병합한 노드가 두 번째 부모인 `project-test`의 subtree에 포함되는 것을 확인했다.
- 해당 subtree 삭제 시 병합 노드가 `deleted` 상태가 되고, 복구 후 `merged_parent_branch_ids`가 유지된 채 그래프에 다시 표시되는 것을 확인했다.

## 2026-07-01 병합 그래프 방향 및 같은 가지 병합 차단

### 변경 사항

- `frontend/src/features/branchGraph/branchGraphModel.js`에 최단 루트 경로 계산과 같은 가지 병합 판정 유틸을 추가했다.
- 그래프 layout depth를 모든 부모 depth의 최대값보다 자식 depth가 커지는 방식으로 변경하여 병합 간선이 아래 방향으로 향하도록 수정했다.
- `frontend/src/App.jsx`에서 같은 루트 최단 경로상 조상-후손 관계인 노드 조합을 병합 선택 및 확정 단계에서 차단했다.
- `frontend/src/features/branchGraph/mockBranchGraphApi.js`에서 같은 가지 병합 요청을 거부하도록 수정했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 병합 방향성과 병합 가능 조건을 반영했다.

### 검증 결과

- 모델 단위 검증에서 병합 노드의 부모 엣지 2개가 모두 아래 방향으로 연결되는 것을 확인했다.
- 모델 단위 검증에서 `project-user-flow`와 `project-test` 같은 가지 조합은 병합 불가로 판정되는 것을 확인했다.
- 모델 단위 검증에서 `project-api`와 `project-test` 다른 가지 조합은 병합 가능으로 판정되는 것을 확인했다.
- Mock API 검증에서 같은 가지 병합은 오류로 거부되고, 다른 가지 병합은 `merged_parent_branch_ids`를 유지한 병합 노드를 생성하는 것을 확인했다.

## 2026-07-01 병합 그래프 렌더링 안정화 수정

### 변경 사항

- `frontend/src/features/branchGraph/branchGraphModel.js`에서 그래프 좌표 계산을 부모 위치 기반 layered 배치로 변경했다.
- 같은 depth 노드의 최소 간격을 보정하면서 병합 노드는 보이는 부모들의 평균 위치에 배치되도록 수정했다.
- `frontend/src/components/MiniGraph.jsx`에서 SVG edge path를 고정 제어점 방식에서 노드 간 실제 거리 기반 제어점 방식으로 변경했다.
- 병합 edge에는 fan-in offset을 적용하여 점선 두 개가 병합 노드에서 겹쳐 들어가지 않도록 했다.
- `frontend/src/App.css`에서 그래프 edge에 round linecap, geometric precision, non-scaling stroke를 적용하고 병합 점선 간격을 조정했다.
- `docs/PRD.md`, `docs/requirements.md`, `docs/implementation_plan.md`, `docs/test_plan.md`, `docs/requirement_status.md`, `docs/review_notes.md`에 병합 그래프 렌더링 안정화 정책과 검증 결과를 반영했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check` 실행 결과, 공백 오류가 없었다.
- 모델 단위 검증에서 병합 노드가 두 부모의 x 중심에 배치되고 모든 부모보다 아래 y 좌표를 가지는 것을 확인했다.
- 권한 상승으로 Vite 개발 서버를 `http://127.0.0.1:5180/`에서 실행했다.
- 브라우저에서 `API 연동`과 `검증 계획`을 병합한 뒤 병합 노드와 두 병합 점선 엣지가 자연스럽게 수렴하는 것을 확인했다.
- 브라우저 콘솔 오류가 없음을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-03 기본 LLM provider OpenAI 전환

### 변경 사항

- `frontend/src/App.jsx`에서 기본 `modelProvider`를 `chatkhu`에서 `openai`로 변경했다.
- OpenAI provider와 호환되도록 기본 `modelName`을 `gpt-5.4-mini`에서 `gpt-4o-mini`로 변경했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-04 프론트 초기 로딩 범위 축소

### 변경 사항

- `frontend/src/App.jsx`에서 초기 동기화 시 모든 세션의 그래프를 불러오던 구조를 세션 목록, 휴지통 목록, 선택된 세션 그래프만 불러오는 구조로 변경했다.
- 루트 세션 선택 시 해당 세션의 그래프와 메시지를 지연 로드하도록 수정했다.
- `frontend/src/features/branchGraph/branchGraphAdapter.js`에서 아직 그래프를 불러오지 않은 세션도 사이드바에 root placeholder 노드로 표시되도록 수정했다.
- 백엔드 `/sessions` 응답의 `main_branch_id`를 활용해 placeholder root 노드와 실제 세션 그래프를 연결하도록 했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/App.jsx frontend/src/features/branchGraph/branchGraphAdapter.js` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-04 답변 목록 번호 렌더링 파서 수정

### 변경 사항

- `frontend/src/components/RichMessageContent.jsx`에서 순서 있는 목록의 원본 번호를 `start`와 `li value`로 보존하도록 수정했다.
- 번호 목록 항목 아래에 이어지는 세부 bullet 목록을 하위 목록으로 파싱하도록 수정했다.
- `1. 제목:` 다음에 같은 들여쓰기의 `- 세부항목`이 이어지는 LLM 답변에서도 다음 번호 항목이 다시 `1.`로 렌더링되지 않도록 보완했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/components/RichMessageContent.jsx commit_log.md` 실행 결과, 공백 오류가 없었다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 병합 노드 요약 UI 수정

### 변경 사항

- `frontend/src/features/branchGraph/branchGraphModel.js`에 병합 노드 판정, 병합 대상 요약 추출, 병합 노드의 inherited 메시지 조회 차단 유틸을 추가했다.
- `frontend/src/App.jsx`에서 병합 노드 메시지 조회 시 상위 경로 대화를 가져오지 않고 병합 노드 자체 메시지만 가져오도록 수정했다.
- `frontend/src/components/ChatWorkspace.jsx`에서 병합 노드는 첫 번째 부모의 원본 대화 경로를 표시하지 않고, 병합 대상 두 노드의 요약 카드를 양옆으로 표시하도록 수정했다.
- 병합 요약 카드가 표시되는 경우 자동 생성된 `merge_result` 메시지는 일반 메시지 목록에서 숨겨 중복 표시를 방지했다.
- `frontend/src/App.css`, `frontend/src/Modern.css`에 병합 요약 패널과 반응형 2열/1열 레이아웃 스타일을 추가했다.
- `frontend/src/features/branchGraph/mockBranchGraphApi.js`에서 Mock 병합 브랜치의 inherited 메시지 조회도 병합 노드 자체 메시지만 반환하도록 보정했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/App.jsx frontend/src/components/ChatWorkspace.jsx frontend/src/features/branchGraph/branchGraphModel.js frontend/src/features/branchGraph/mockBranchGraphApi.js frontend/src/App.css frontend/src/Modern.css` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 일반 권한의 Vite 서버 실행은 `listen EPERM`으로 실패했고, 권한 상승으로 개발 서버를 `http://127.0.0.1:5173/`에서 실행했다.
- 권한 상승 환경에서 `curl -I http://127.0.0.1:5173/` 실행 결과, `HTTP/1.1 200 OK` 응답을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 병합 노드 이전 컨텍스트 복구

### 변경 사항

- 병합 노드에서 상위 컨텍스트 전체를 끊던 방식을 되돌리고, 병합 대상 노드의 이전 경로 대화는 그대로 표시하도록 수정했다.
- `frontend/src/features/branchGraph/branchGraphModel.js`에서 병합 노드 컨텍스트를 두 병합 부모의 이전 경로와 병합 노드 자체 섹션으로 구성하도록 변경했다.
- 병합 대상 노드 2개는 대화 섹션으로 표시하지 않고, 병합 요약 카드에만 표시하도록 유지했다.
- 병합 노드 조회 시 inherited 메시지 조회를 다시 허용하여 이전 노드 대화가 비어 보이지 않도록 수정했다.
- 병합 노드의 초기 assistant 요약 메시지는 요약 카드에 반영하고, 일반 채팅 버블에서는 숨겨 중복 표시를 방지했다.
- `frontend/src/features/branchGraph/mockBranchGraphApi.js`에서 Mock 병합 inherited 메시지도 이전 경로 메시지와 병합 노드 메시지를 함께 반환하도록 수정했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/App.jsx frontend/src/components/ChatWorkspace.jsx frontend/src/features/branchGraph/branchGraphModel.js frontend/src/features/branchGraph/mockBranchGraphApi.js frontend/src/App.css frontend/src/Modern.css` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 모델 단위 검증에서 병합 노드 컨텍스트가 이전 루트 섹션과 병합 노드 섹션으로 구성되고, 병합 부모 2개는 요약 카드 내용으로만 추출되는 것을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 병합 seed 메시지 숨김 보정

### 변경 사항

- 실제 병합 응답에서 `[브랜치 ... 요약]` 초기 메시지가 `assistant`가 아니라 `user` 역할로 들어오는 경우를 확인하고 숨김 조건을 보정했다.
- `frontend/src/components/ChatWorkspace.jsx`에서 병합 노드의 초기 seed 구간을 역할 기준이 아니라 내용 기준으로 판정하도록 수정했다.
- 초기 seed 구간은 `[브랜치 ... 요약]` 메시지, 그 직후의 `확인했습니다.` 응답, `merge_result` 메시지로 정의했다.
- 병합 seed 메시지는 요약 카드에는 사용하되, 채팅 목록에서는 숨겨 병합 대상 요약이 중복 버블로 표시되지 않도록 했다.
- `frontend/src/features/branchGraph/branchGraphModel.js`에서 요약 카드 원본 추출도 동일하게 `[브랜치 ... 요약]` 메시지를 역할과 무관하게 인식하도록 수정했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/components/ChatWorkspace.jsx frontend/src/features/branchGraph/branchGraphModel.js` 실행 결과, 공백 오류가 없었다.
- 모델 단위 검증에서 `user` 역할의 `[브랜치 ... 요약]` 메시지가 요약 카드 원본으로 추출되는 것을 확인했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 병합 요약 카드 메시지 버블화

### 변경 사항

- 사용자가 제시한 화면 기준에 맞춰 병합 대상 요약 카드 내부에 요약 메시지 버블을 표시하도록 수정했다.
- `frontend/src/components/ChatWorkspace.jsx`에서 병합 요약 카드의 평문 설명과 태그 칩을 제거하고, `RichMessageContent`로 요약 원문을 렌더링하도록 변경했다.
- `frontend/src/features/branchGraph/branchGraphModel.js`에서 병합 seed 요약을 축약하거나 마크다운 제거하지 않고 원문 그대로 반환하도록 변경했다.
- `frontend/src/Modern.css`, `frontend/src/App.css`에서 병합 요약 카드 안의 연한 메시지 버블 스타일을 추가했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/components/ChatWorkspace.jsx frontend/src/features/branchGraph/branchGraphModel.js frontend/src/Modern.css frontend/src/App.css` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 모델 단위 검증에서 `[브랜치 ... 요약]` 원문과 번호 목록이 잘리지 않고 카드 데이터로 유지되는 것을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 병합 요약 카드 내부 박스 제거

### 변경 사항

- `frontend/src/Modern.css`, `frontend/src/App.css`에서 병합 요약 카드 내부 메시지 영역의 연한 초록 배경과 박스형 패딩을 제거했다.
- 병합 대상 요약은 기존 흰색 카드 안에서 바로 텍스트와 목록으로 표시되도록 조정했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/Modern.css frontend/src/App.css` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 랜딩 사이드바 새 채팅 선택 상태 적용

### 변경 사항

- 로고 클릭 등으로 랜딩 화면이 표시될 때 왼쪽 사이드바의 `새 채팅` 버튼이 선택된 상태처럼 보이도록 수정했다.
- `frontend/src/App.jsx`에서 랜딩 표시 상태를 사이드바 컴포넌트로 전달하도록 변경했다.
- `frontend/src/components/StartNodeSidebar.jsx`에서 랜딩 화면일 때 `새 채팅` 버튼에 선택 클래스와 `aria-current`를 부여하고, 기존 대화 카드 선택 표시는 해제되도록 조정했다.
- `frontend/src/Modern.css`에서 `새 채팅` 텍스트를 전체 UI 톤에 맞는 초록색으로 변경하고 선택 배경과 왼쪽 초록 인디케이터를 추가했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/App.jsx frontend/src/components/StartNodeSidebar.jsx frontend/src/Modern.css` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- `frontend/`에서 `npm run dev` 실행 결과, 기본 포트 `5173` 사용 중으로 `http://127.0.0.1:5174/` 개발 서버가 실행되었다.
- `curl -I http://127.0.0.1:5174/` 실행 결과, `200 OK` 응답을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 사이드바 세션 요약 숨김

### 변경 사항

- 왼쪽 사이드바 세션 목록에서 세션 요약 텍스트를 렌더링하지 않도록 수정했다.
- `frontend/src/components/StartNodeSidebar.jsx`에서 루트 카드 내부의 `node.description` 표시를 제거하여 세션 제목만 보이도록 변경했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/components/StartNodeSidebar.jsx` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 랜딩 옵션 칩 제거

### 변경 사항

- 사용자가 표시한 랜딩 입력창 하단 옵션 영역에서 `웹검색`, `심층 사고`, `챗봇 비교` 칩을 제거했다.
- `frontend/src/components/ChatLanding.jsx`에서 해당 옵션들의 상태, 팝오버, 선택 모델 목록, 외부 클릭 감지 로직을 함께 제거했다.
- 일반 메시지 전송은 옵션 객체 없이 메시지 텍스트만 전달하도록 단순화했다.
- 빨간 박스 밖에 있던 `모델 비교` 버튼은 유지했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/components/ChatLanding.jsx` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 모델 선택 팝오버 공통 적용

### 변경 사항

- `frontend/src/components/ModelSelector.jsx`를 추가하여 이미지 참고안처럼 공급자별 컬럼으로 펼쳐지는 모델 선택 팝오버를 구현했다.
- `frontend/src/components/ChatWorkspace.jsx`의 기존 select 기반 모델 선택을 공통 모델 선택 팝오버로 교체했다.
- `frontend/src/components/ChatLanding.jsx`에도 동일한 모델 선택 UI를 추가하여 랜딩 화면에서 선택한 모델이 메시지 전송 모델로 사용되도록 연결했다.
- `frontend/src/App.jsx`에서 랜딩 화면에도 `CHAT_MODEL_OPTIONS`, `selectedChatModel`, `setSelectedChatModel`을 전달하도록 변경했다.
- `frontend/src/App.jsx`의 채팅 모델 목록을 OpenAI, Claude, Gemini, X-AI, Meta, Perplexity, DeepSeek 계열까지 확장했다.
- `frontend/src/Modern.css`에 모델 선택 트리거, 팝오버, 선택 행, 공급자 마크, 모바일 배치 스타일을 추가했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/App.jsx frontend/src/components/ChatLanding.jsx frontend/src/components/ChatWorkspace.jsx frontend/src/components/ModelSelector.jsx frontend/src/Modern.css` 실행 결과, 공백 오류가 없었다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.

## 2026-07-05 모델 답변 비교 팝업 스크롤 수정

### 변경 사항

- 모델 답변 비교 팝업에서 긴 답변이 viewport 밖으로 잘려 하단 내용을 볼 수 없던 문제를 수정했다.
- `frontend/src/App.css`에서 비교 팝업 shell에 viewport 기준 확정 높이를 부여하고, 모달과 답변 그리드가 그 높이 안에서만 배치되도록 변경했다.
- 각 모델 답변 카드 본문을 독립적인 세로 스크롤 영역으로 지정하고, 스크롤바와 overscroll 동작을 명시했다.
- 분석/융합 사이드 패널도 같은 shell 높이를 기준으로 맞춰지도록 조정했다.

### 검증 결과

- `frontend/`에서 `npm run lint` 실행 결과, ESLint 검사가 통과했다.
- `frontend/`에서 `npm run build` 실행 결과, Vite 프로덕션 빌드가 통과했다.
- 프로젝트 루트에서 `git diff --check -- frontend/src/App.css commit_log.md` 실행 결과, 공백 오류가 없었다.
- 일반 권한의 `npm run dev`와 `npm run dev:mock`은 로컬 포트 바인딩 제한으로 `listen EPERM`이 발생했다.
- 권한 상승으로 `npm run dev:mock`을 실행했고, 기본 포트 `5173` 사용 중으로 `http://127.0.0.1:5174/`에서 Mock 개발 서버가 실행되었다.
- 브라우저에서 모델 비교 팝업을 열고 작은 viewport에서 각 답변 본문이 `overflow-y: auto`이며 `scrollHeight > clientHeight` 상태임을 확인했다.
- 브라우저 실제 스크롤 입력 후 첫 번째 답변 본문의 `scrollTop`이 `0`에서 `159`로 증가하는 것을 확인했다.

### Git 상태

- 사용자가 커밋을 요청하지 않았으므로 커밋은 수행하지 않았다.
