# REVIEW.md

## Review Goal
리뷰 목표는 치명도 높은 문제를 짧고 실행 가능하게 식별하는 것이다.

## Review Priority
다음 순서로 우선 검토한다:
1. correctness
2. auth / role / permission
3. Supabase RLS / 데이터 노출 위험
4. payment 계산 오류
5. inactive 학생 처리 누락
6. 모바일 UX 회귀
7. 테스트 누락
8. maintainability

## Domain-critical Checks
반드시 우선 확인:
- 학교별 고정금액 우선순위가 깨지지 않았는가
- 부족금액 계산이 누적 입금을 기준으로 하는가
- 이용 정지 학생이 조회 리스트에 노출되지 않는가
- ADMIN / PARENT 권한 분기가 누락되지 않았는가
- 학부모가 수정하면 안 되는 필드(이용금액, 정지일) 제한이 유지되는가

## UX-critical Checks
반드시 우선 확인:
- 모바일에서 주요 동작이 1~2탭 내에 가능한가
- 버튼/입력 요소가 너무 작지 않은가
- 고령 사용자 기준으로 흐름이 복잡하지 않은가
- SweetAlert2 입력 흐름이 과도하게 길지 않은가

## Project-Specific Critical Rules
- 계산 로직 변경 시 예시 데이터로 sanity check
- role guard 없는 mutation은 high 이상
- inactive 필터 누락은 high 이상
- 모바일 핵심 CTA가 화면 하단에서 사라지면 medium 이상
- 관리자 핵심 동선(학생 검색 → 입금 등록)이 길어지면 medium 이상

## What To Ignore
- formatter/linter가 해결할 단순 스타일
- 취향 수준의 네이밍 의견
- 현재 변경과 직접 무관한 대규모 리팩터링 제안
- 근거 없는 추측성 우려

## Output Format
각 이슈는 아래 형식만 사용한다.

[SEVERITY] 제목
- Why:
- Evidence:
- Risk:
- Fix:

severity:
- blocker
- high
- medium
- low
- nit

## Output Rules
- 핵심 이슈만 최대 5개까지 제시한다.
- 중요한 이슈가 없으면 `중요 이슈 없음`이라고 쓴다.
- 확신이 낮으면 `확신 낮음`을 표시한다.
- 가능하면 실제 실패 시나리오를 포함한다.
- diff를 다시 길게 요약하지 않는다.