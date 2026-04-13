# REVIEW.md

## Review Goal
리뷰의 목표는 **치명도 높은 문제를 빠르게 식별하고, 실행 가능한 수정 방향을 제시하는 것**이다.

리뷰는 단순 의견이 아니라:
- 실제 오류 가능성
- 권한/보안 문제
- 도메인 규칙 위반
- 사용자 경험 실패

를 중심으로 수행한다.

---

## Review Priority
다음 순서로 우선 검토한다:

1. correctness (기능 정확성)
2. auth / role / permission
3. Supabase RLS / 데이터 노출 위험
4. payment 계산 오류
5. inactive 학생 처리 누락
6. 모바일 UX 회귀
7. design-principal 설계 미반영
8. 테스트 누락
9. maintainability

---

## Domain-critical Checks
반드시 우선 확인:

- 학교별 고정금액 우선순위가 깨지지 않았는가
- 부족금액 계산이 누적 입금을 기준으로 하는가
- 이용 정지 학생이 조회 리스트에 노출되지 않는가
- ADMIN / PARENT 권한 분기가 누락되지 않았는가
- 학부모가 수정하면 안 되는 필드(이용금액, 정지일) 제한이 유지되는가

---

## Security-critical Checks
반드시 우선 확인:

- role 판별이 `profiles.role` 기준으로 일관되게 처리되는가
- `auth.uid()` 기준 데이터 접근이 유지되는가
- 부모가 다른 학생 데이터에 접근할 수 없는가
- 클라이언트 조건문만으로 권한을 제어하고 있지 않은가
- RLS 전제와 코드가 불일치하지 않는가

### 레거시 구조 금지
- `public.users`
- `auth_user_id`
- `receiver_id`
- `get_my_legacy_id()`

👉 위 구조를 신규 코드에서 사용하면 high 이상

---

## UX-critical Checks
반드시 우선 확인:

- 모바일에서 주요 동작이 1~2탭 내에 가능한가
- 버튼/입력 요소가 충분히 큰가 (≥48px)
- 글자 크기가 충분한가 (≥18px)
- 고령 사용자 기준으로 흐름이 복잡하지 않은가
- SweetAlert2 입력 흐름이 과도하게 길지 않은가

---

## Design-critical Checks (design-principal 기준)

- 주요 CTA가 명확하게 강조되는가
- 정보 위계가 시각적으로 드러나는가
- 동일한 UI 역할이 동일한 패턴을 사용하는가
- 간격/타이포/컬러가 일관적인가
- UX 카피(버튼, 메시지)가 이해하기 쉬운가

👉 design-principal 설계와 어긋나면 최소 medium 이상

---

## Project-Specific Critical Rules

- 계산 로직 변경 시 예시 데이터로 sanity check 필수
- role guard 없는 mutation은 high 이상
- inactive 필터 누락은 high 이상
- 모바일 핵심 CTA가 화면 하단에서 사라지면 medium 이상
- 관리자 핵심 동선(학생 검색 → 입금 등록)이 길어지면 medium 이상

---
## Todo.md 연동 규칙

다음 경우 반드시 `Todo.md`에 추가해야 한다:
- high 이상 이슈
- 반복 발생 가능 버그
- 구조적 문제
- 성능 문제
- 보안 리스크

추가 규칙:
- high 이상 이슈는 반드시 Todo 변환 대상이다
- Fix가 여러 단계면 Todo를 여러 개로 분리한다
- Fix가 단순 코드 수정이 아닌 경우 반드시 Todo로 관리한다

---

## What To Ignore

- formatter/linter로 해결 가능한 스타일
- 취향 수준 네이밍
- 현재 변경과 직접 무관한 리팩터링
- 근거 없는 추측성 우려

---

## severity:

 - blocker
 - high
 - medium
 - low
 - nit

## Output Rules

 - 최대 5개의 핵심 이슈만 제시한다.
 - 중요한 이슈가 없으면 중요 이슈 없음이라고 작성한다.
 - 확신이 낮으면 확신 낮음을 표시한다.
 - 가능하면 실제 실패 시나리오를 포함한다.
 - diff를 다시 길게 요약하지 않는다.
 - Fix는 반드시 실행 가능해야 한다.

## Severity 기준
blocker
 - 서비스 동작 불가
 - 데이터 손상
 - 권한 완전 붕괴

high
 - 잘못된 데이터 저장/계산
 - 권한 우회 가능
 - 다른 사용자 데이터 노출
 - 핵심 기능 실패

medium
 - UX 흐름 문제
 - 일부 조건에서 오류 발생
 - 성능 저하

low
 - 개선 사항
 - 유지보수성 문제

nit
 - 사소한 정리 수준

## Output Format

각 이슈는 아래 형식만 사용한다:

```markdown
[SEVERITY] 제목
- Why:
- Evidence:
- Risk:
- Fix: