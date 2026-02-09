Supabase 마이그레이션 가이드

1) 스키마 생성
- 파일: `migrations/supabase_schema.sql`
- Supabase SQL Editor에서 전체 실행하거나 로컬 psql로 실행

2) CSV 준비
- `export/` 폴더에 CSV를 준비합니다. (직접 생성 또는 외부 도구 사용)
- 생성 파일 목록:
  - users.csv, parent_profiles.csv
  - schools.csv, routes.csv, route_stops.csv
  - students.csv, payments.csv
  - board_posts.csv, board_comments.csv
  - alerts.csv

3) Supabase로 CSV 임포트 순서(외래키 제약 고려)
- 1) users → 2) parent_profiles → 3) schools → 4) routes → 5) route_stops → 6) students → 7) payments → 8) board_posts → 9) board_comments → 10) alerts

4) 컬럼 매핑 노트
- users.password_hash ← Redis의 `passwordHash`
- students.deposit_day: 없으면 빈칸(Null)
- payments.id: Redis의 복합키(부분입금은 접미사 포함)를 그대로 text PK로 보존
- alerts.memo: “변경전: x, 변경후: y” 형태 문자열 그대로 저장

5) 확인 포인트
- enums: `role_enum`, `payment_status`, `alert_type`, `alert_status` 값은 코드와 동일하게 생성됨
- route_stops: Redis에서는 배열이던 정차지점을 행 단위(`position` 0-based)로 분해
- parent_profiles: Redis에는 studentIds가 있으나 RDB에서는 `students.parent_user_id`로 일대다 표현

6) 에러 대응
- FK 에러 발생 시, 임포트 순서를 확인하거나 누락된 상위 테이블 행이 있는지 점검
- CSV의 Null은 빈칸 처리. true/false는 소문자 불리언으로 임포트
