-- ============================================================================
-- Ecostat DB 스키마
-- 대상: PostgreSQL 14+
-- 범위: 거시지표 / 미시지표 / 원자재를 하나의 통합 indicators 테이블로 표현하고,
--       사용자·구독·발표일정·상관관계까지 포함한다.
--
-- 설계 원칙
-- 1) 거시지표(macro)·미시지표(micro)·원자재(commodity)는 카드 스키마가 거의 동일하다
--    (이름·기관·현재값·6개월 추이·보조수치·정의/중요성/확인포인트·11년 궤적).
--    따라서 하나의 indicators 테이블 + scope 컬럼으로 통합하고, 자식 테이블들을
--    선택적으로만 채운다(예: 미시지표 경량 카드는 year_history를 안 씀).
-- 2) 국가별로 다른 계열/카테고리 체계(거시=계열, 미시=업종 카테고리, 원자재=품목군)를
--    categories 테이블 하나로 통합하고 scope + country_id 조합으로 구분한다.
-- 3) "11개 고정순서(기준금리→...→환율)"는 concepts + concept_mappings로 표현해,
--    국가마다 어떤 지표가 어느 개념 슬롯을 채우는지 조회 가능하게 한다.
-- ============================================================================

BEGIN;

-- ── ENUM 타입 ──────────────────────────────────────────────────────────────
CREATE TYPE indicator_scope   AS ENUM ('macro', 'micro', 'commodity');
CREATE TYPE card_style        AS ENUM ('full', 'light');       -- full: 11년 궤적 포함 / light: 경량 카드
CREATE TYPE chart_kind        AS ENUM ('line', 'bar');
CREATE TYPE trend_direction   AS ENUM ('up', 'down', 'flat');  -- 'good' 필드 (호전 방향)
CREATE TYPE auth_provider     AS ENUM ('google', 'apple', 'guest');
CREATE TYPE subscription_status AS ENUM ('trial', 'expired', 'subscribed');
CREATE TYPE subscription_plan   AS ENUM ('none', 'monthly', 'yearly');

-- ── 1. 국가 ────────────────────────────────────────────────────────────────
CREATE TABLE countries (
    id          SMALLSERIAL PRIMARY KEY,
    code        CHAR(2)      NOT NULL UNIQUE,     -- 'US','KR','JP','EA','CN'
    name        VARCHAR(30)  NOT NULL,             -- '미국','한국','일본','유로존','중국'
    sort_order  SMALLINT     NOT NULL
);

-- ── 2. 카테고리 (거시 계열 / 미시 업종 카테고리 / 원자재 품목군 통합) ──────────
-- 거시(macro): country_id NULL → 국가 공통 계열('물가','고용','성장·생산' 등)
-- 미시(micro): country_id 필수 → 국가마다 다른 업종 카테고리('반도체','부동산' 등)
-- 원자재(commodity): country_id NULL → 전역 품목군('에너지','귀금속' 등)
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    scope       indicator_scope NOT NULL,
    country_id  SMALLINT REFERENCES countries(id),
    name        VARCHAR(60)  NOT NULL,
    color_hex   CHAR(7),
    sort_order  SMALLINT,
    UNIQUE (scope, country_id, name)
);

-- ── 3. 11개 고정순서 개념 ─────────────────────────────────────────────────
CREATE TABLE concepts (
    id          SMALLSERIAL PRIMARY KEY,
    name        VARCHAR(40)  NOT NULL UNIQUE,      -- '기준금리','통화량','GDP', ...
    sort_order  SMALLINT     NOT NULL UNIQUE
);

-- ── 4. 지표 (거시 / 미시 / 원자재 통합) ──────────────────────────────────
CREATE TABLE indicators (
    id                BIGSERIAL PRIMARY KEY,
    indicator_key     VARCHAR(40)  NOT NULL UNIQUE,   -- 기존 코드의 id ('cpi','kgdp','j_tankan' 등)
    country_id        SMALLINT REFERENCES countries(id),   -- 원자재는 국가 무관 → NULL 허용
    scope             indicator_scope NOT NULL,
    card_style        card_style   NOT NULL DEFAULT 'full',
    category_id       INTEGER REFERENCES categories(id),
    name              VARCHAR(120) NOT NULL,
    org               VARCHAR(120) NOT NULL,           -- 발표 기관
    source_desc       VARCHAR(200),                    -- src (원문 자료명)
    unit              VARCHAR(30),
    chart_kind        chart_kind   NOT NULL DEFAULT 'line',
    trend_direction   trend_direction,                 -- good: 값이 오르는게 호전인지/악화인지
    reference_value   NUMERIC,                         -- ref (기준선, 예: PMI 50)
    is_estimate       BOOLEAN      NOT NULL DEFAULT FALSE,
    source_url        TEXT,
    schedule_cycle    VARCHAR(30),                      -- '매월','분기','연 1회' 등
    schedule_when     VARCHAR(60),
    schedule_time     VARCHAR(30),
    schedule_next     VARCHAR(60),
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,  -- soft delete / 노출 여부
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_indicators_country_scope ON indicators (country_id, scope) WHERE is_active;
CREATE INDEX idx_indicators_category      ON indicators (category_id);

-- ── 5. 현재값 스냅샷 (1:1) ───────────────────────────────────────────────
CREATE TABLE indicator_snapshots (
    indicator_id    BIGINT PRIMARY KEY REFERENCES indicators(id) ON DELETE CASCADE,
    current_value   NUMERIC,
    previous_value  NUMERIC,
    as_of_label     VARCHAR(80),         -- sub 필드, 예: '2026년 6월 · 전년비 +5.8%'
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6. 단기 추이 (최근 5~6개 시점 미니 차트) ──────────────────────────────
CREATE TABLE indicator_series_points (
    id            BIGSERIAL PRIMARY KEY,
    indicator_id  BIGINT NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    period_label  VARCHAR(20) NOT NULL,     -- '1월', '25Q2', '6.1~10' 등
    value         NUMERIC NOT NULL,
    is_confirmed  BOOLEAN NOT NULL DEFAULT FALSE,  -- ver: 확정치 여부(점선/실선 구분)
    sort_order    SMALLINT NOT NULL,
    UNIQUE (indicator_id, sort_order)
);

-- ── 7. 11년 연도별 궤적 (card_style='full'인 지표만 사용) ─────────────────
CREATE TABLE indicator_year_history (
    id            BIGSERIAL PRIMARY KEY,
    indicator_id  BIGINT NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    year          SMALLINT NOT NULL,
    value         NUMERIC NOT NULL,
    note          TEXT,                    -- 연도별 한 줄 해설
    UNIQUE (indicator_id, year)
);

CREATE TABLE indicator_year_summary (
    indicator_id  BIGINT PRIMARY KEY REFERENCES indicators(id) ON DELETE CASCADE,
    year_unit     VARCHAR(20),             -- yr.u
    year_label    VARCHAR(80),             -- yr.lab
    arc_text      TEXT                     -- 11년 흐름 종합 해설
);

-- ── 8. 보조 수치 (2~4개 key-value) ───────────────────────────────────────
CREATE TABLE indicator_extras (
    id            BIGSERIAL PRIMARY KEY,
    indicator_id  BIGINT NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    label         VARCHAR(80)  NOT NULL,
    value         VARCHAR(200) NOT NULL,
    sort_order    SMALLINT NOT NULL
);

-- ── 9. 서술형 콘텐츠 (정의/중요성/확인포인트 — 각 1건) ────────────────────
CREATE TABLE indicator_details (
    indicator_id     BIGINT PRIMARY KEY REFERENCES indicators(id) ON DELETE CASCADE,
    what_text        TEXT,     -- 정의
    importance_text  TEXT,     -- 중요성
    watch_text       TEXT      -- 확인 포인트
);

-- ── 10. 분석 포인트 (거시 'why' 3~4단 / 미시 경량카드 'analysis' 공용) ─────
CREATE TABLE indicator_analysis_points (
    id            BIGSERIAL PRIMARY KEY,
    indicator_id  BIGINT NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    sort_order    SMALLINT NOT NULL,
    content       TEXT NOT NULL,
    UNIQUE (indicator_id, sort_order)
);

-- ── 11. 국가별 11개 고정순서 매핑 ────────────────────────────────────────
CREATE TABLE concept_mappings (
    country_id    SMALLINT NOT NULL REFERENCES countries(id),
    concept_id    SMALLINT NOT NULL REFERENCES concepts(id),
    indicator_id  BIGINT   NOT NULL REFERENCES indicators(id),
    PRIMARY KEY (country_id, concept_id)
);

-- ── 12. 발표 일정 캘린더 ──────────────────────────────────────────────────
CREATE TABLE calendar_events (
    id            BIGSERIAL PRIMARY KEY,
    country_id    SMALLINT NOT NULL REFERENCES countries(id),
    indicator_id  BIGINT REFERENCES indicators(id),   -- 지표 카드와 매칭 안 될 수도 있어 NULL 허용
    event_date    DATE NOT NULL,
    event_label   VARCHAR(120) NOT NULL,               -- '단칸 9월 조사 (BOJ)' 등
    sort_order    SMALLINT
);

CREATE INDEX idx_calendar_country_date ON calendar_events (country_id, event_date);

-- ── 13. 상관관계 매트릭스 ─────────────────────────────────────────────────
-- 매트릭스에 노출할 지표 축(어떤 지표들을 격자에 넣을지)과 실제 계수를 분리한다.
CREATE TABLE correlation_axis (
    country_id    SMALLINT NOT NULL REFERENCES countries(id),
    indicator_id  BIGINT   NOT NULL REFERENCES indicators(id),
    sort_order    SMALLINT NOT NULL,
    PRIMARY KEY (country_id, indicator_id)
);

CREATE TABLE correlations (
    id              BIGSERIAL PRIMARY KEY,
    country_id      SMALLINT NOT NULL REFERENCES countries(id),
    indicator_a_id  BIGINT   NOT NULL REFERENCES indicators(id),
    indicator_b_id  BIGINT   NOT NULL REFERENCES indicators(id),
    coefficient     NUMERIC(4,3) NOT NULL CHECK (coefficient BETWEEN -1 AND 1),
    explanation     TEXT,
    UNIQUE (country_id, indicator_a_id, indicator_b_id),
    CHECK (indicator_a_id <> indicator_b_id)
);

CREATE INDEX idx_correlations_pair ON correlations (indicator_a_id, indicator_b_id);

-- ── 14. 사용자 & 인증 ─────────────────────────────────────────────────────
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    auth_provider   auth_provider NOT NULL,
    provider_uid    VARCHAR(120),           -- 게스트는 NULL
    email           VARCHAR(160),
    name            VARCHAR(80)  NOT NULL,
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (auth_provider, provider_uid)
);

-- ── 15. 구독 ──────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status               subscription_status NOT NULL DEFAULT 'trial',
    plan                 subscription_plan   NOT NULL DEFAULT 'none',
    trial_started_at     TIMESTAMPTZ,
    trial_ends_at        TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)   -- 사용자당 구독 레코드 1건 (이력이 필요하면 별도 history 테이블 분리)
);

-- ── 16. 사용자별 심볼 재정의 (RN 앱의 '시세 심볼 편집' 기능) ────────────────
CREATE TABLE user_symbol_overrides (
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    indicator_id  BIGINT NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    symbol        VARCHAR(20) NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, indicator_id)
);

-- ── 17. 사용자별 편집값 (설정 탭의 '수동 수정' — RN 앱 over 상태) ──────────
CREATE TABLE user_indicator_edits (
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    indicator_id  BIGINT NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    override_value    NUMERIC,
    override_previous  NUMERIC,
    override_as_of     VARCHAR(80),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, indicator_id)
);

COMMIT;

-- ============================================================================
-- 초기 데이터 예시 (국가 5개, 개념 11개) — 실제 배포 시 seed 스크립트로 분리 권장
-- ============================================================================
INSERT INTO countries (code, name, sort_order) VALUES
    ('US', '미국',   1),
    ('KR', '한국',   2),
    ('JP', '일본',   3),
    ('EA', '유로존', 4),
    ('CN', '중국',   5);

INSERT INTO concepts (name, sort_order) VALUES
    ('기준금리',      1),
    ('통화량',        2),
    ('GDP',           3),
    ('산업생산지수',   4),
    ('CPI',            5),
    ('PPI',            6),
    ('Core CPI',        7),
    ('실업률',          8),
    ('비농업 고용자',    9),
    ('경상수지',        10),
    ('환율',            11);
