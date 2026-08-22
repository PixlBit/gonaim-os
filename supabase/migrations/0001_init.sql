-- GONAIM//OS — Initial schema
-- Source: Master Blueprint §29, ADR-0002, ADR-0004
-- كل جدول عليه RLS. لا استثناء. Supabase تحذر صراحة من الجداول المكشوفة بلا RLS.

create extension if not exists "pgcrypto";
create extension if not exists "vector";
create extension if not exists "pg_trgm";

-- ─────────────────────────────────────────────────────────────
-- ENUMS — التصنيفات الحاكمة
-- ─────────────────────────────────────────────────────────────

create type sensitivity_zone as enum (
  'open', 'private', 'sensitive', 'vaulted', 'ephemeral', 'never_observe'
);

create type entity_state as enum (
  'active', 'dormant', 'archived', 'contradicted', 'source_unavailable'
);

create type memory_kind as enum (
  'identity', 'preference', 'negative_preference', 'episodic', 'semantic',
  'procedural', 'relationship', 'prospective', 'counterfactual', 'decision', 'sensitive'
);

create type memory_status as enum (
  'candidate', 'active', 'contested', 'historical', 'forgotten'
);

create type observation_mode as enum ('observed', 'inferred');

create type risk_tier as enum (
  'read', 'analyze', 'draft', 'write_reversible', 'external_action', 'destructive'
);

create type action_status as enum (
  'proposed', 'awaiting_approval', 'approved', 'rejected',
  'executing', 'succeeded', 'failed', 'expired'
);

create type autonomy_level as enum ('l0', 'l1', 'l2', 'l3', 'l4', 'l5');

create type signal_tier as enum ('below_threshold', 'inbox', 'nudge', 'window', 'interrupt', 'block');

-- ─────────────────────────────────────────────────────────────
-- OWNER
-- ─────────────────────────────────────────────────────────────

create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  display_name  text not null,
  locale        text not null default 'ar-SA',
  timezone      text not null default 'Asia/Riyadh',
  created_at    timestamptz not null default now()
);

-- الدستور الشخصي — أعلى من أي Goal أو Agent (Expansion §2.1)
create table personal_constitution (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references users(id) on delete cascade,
  clause          text not null,
  clause_type     text not null check (clause_type in
                    ('never_do','never_trade','work_shape','cooling_period','no_cloud','success_definition')),
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  superseded_by   uuid references personal_constitution(id)
);

-- ─────────────────────────────────────────────────────────────
-- ENTITIES + RELATIONS  (ADR-0002)
-- ─────────────────────────────────────────────────────────────

create table entities (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references users(id) on delete cascade,
  type          text not null,
  title         text not null,
  summary       text,
  state         entity_state not null default 'active',
  sensitivity   sensitivity_zone not null default 'private',
  -- ADR-0009: الأصل يبقى في مصدره
  source_uri    text,
  external_id   text,
  external_provider text,
  checksum      text,
  last_sync_at  timestamptz,
  source_health text not null default 'ok' check (source_health in ('ok','stale','unavailable','revoked')),
  metadata      jsonb not null default '{}'::jsonb,
  search_tsv    tsvector generated always as (
                  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,''))
                ) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index entities_owner_type_idx on entities (owner_id, type, state);
create index entities_search_idx     on entities using gin (search_tsv);
create index entities_trgm_idx       on entities using gin (title gin_trgm_ops);
create unique index entities_external_idx
  on entities (owner_id, external_provider, external_id)
  where external_id is not null;

create table entity_relations (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references users(id) on delete cascade,
  from_entity_id  uuid not null references entities(id) on delete cascade,
  to_entity_id    uuid not null references entities(id) on delete cascade,
  relation_type   text not null,
  weight          numeric(4,3) not null default 0.500 check (weight between 0 and 1),
  confidence      numeric(4,3) not null check (confidence between 0 and 1),
  -- §5.2: كل علاقة لها سبب. بلا سبب، لا علاقة.
  reason          text not null,
  source_event_id uuid,
  valid_from      timestamptz not null default now(),
  valid_to        timestamptz,
  created_at      timestamptz not null default now(),
  constraint no_self_relation check (from_entity_id <> to_entity_id)
);

create index relations_from_idx on entity_relations (from_entity_id, relation_type) where valid_to is null;
create index relations_to_idx   on entity_relations (to_entity_id, relation_type)   where valid_to is null;

-- ─────────────────────────────────────────────────────────────
-- EVENTS — طبقة الحقيقة الخام
-- ─────────────────────────────────────────────────────────────

create table events (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references users(id) on delete cascade,
  event_type          text not null,
  occurred_at         timestamptz not null,
  ingested_at         timestamptz not null default now(),
  source              text not null,
  source_uri          text,
  sensitivity         sensitivity_zone not null,
  observed_or_inferred observation_mode not null,
  confidence          numeric(4,3) check (confidence between 0 and 1),
  payload             jsonb not null default '{}'::jsonb,
  entity_ids          uuid[] not null default '{}',
  session_id          text,
  -- منع التكرار: نفس الحدث لا يُسجَّل مرتين
  fingerprint         text not null,
  occurrence_count    int not null default 1,
  blackout_at_ingest  boolean not null default false,
  -- الملاحظة المباشرة ليست احتمالًا
  constraint observed_has_no_confidence
    check (observed_or_inferred = 'inferred' or confidence is null),
  constraint inferred_has_confidence
    check (observed_or_inferred = 'observed' or confidence is not null)
);

create unique index events_fingerprint_idx on events (owner_id, fingerprint);
create index events_time_idx    on events (owner_id, occurred_at desc);
create index events_type_idx    on events (owner_id, event_type, occurred_at desc);
create index events_entity_idx  on events using gin (entity_ids);

-- ─────────────────────────────────────────────────────────────
-- MEMORY  (ADR-0003, ADR-0004)
-- ─────────────────────────────────────────────────────────────

create table memories (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references users(id) on delete cascade,
  kind           memory_kind not null,
  statement      text not null,
  status         memory_status not null default 'candidate',
  confidence     numeric(4,3) not null check (confidence between 0 and 1),
  confidence_reason text not null,
  sensitivity    sensitivity_zone not null,
  evidence_count int not null default 1,
  -- ADR-0005: لا embedding للمناطق الحساسة قبل V2
  embedding      vector(1024),
  embedding_model text,
  pinned         boolean not null default false,
  -- §24.7: التفضيلات تحمل تاريخًا ويمكن أن تنتهي
  valid_from     timestamptz not null default now(),
  valid_to       timestamptz,
  last_confirmed_at timestamptz,
  created_by     text not null check (created_by in ('cortex','rule','manual')),
  reviewed_at    timestamptz,
  reviewed_by    text,
  created_at     timestamptz not null default now(),
  constraint sensitive_has_no_cloud_embedding
    check (sensitivity not in ('sensitive','vaulted','never_observe') or embedding is null)
);

create index memories_recall_idx on memories (owner_id, kind, status) where status = 'active';
create index memories_vector_idx on memories using hnsw (embedding vector_cosine_ops);

-- بوابة الكتابة: بلا مصدر لا توجد ذاكرة
create table memory_sources (
  id         uuid primary key default gen_random_uuid(),
  memory_id  uuid not null references memories(id) on delete cascade,
  event_id   uuid references events(id) on delete set null,
  entity_id  uuid references entities(id) on delete set null,
  source_uri text,
  excerpt    text,
  noted_at   timestamptz not null default now(),
  constraint must_bind_something
    check (event_id is not null or entity_id is not null or source_uri is not null)
);

create index memory_sources_memory_idx on memory_sources (memory_id);

-- §5.3 Expansion: لا استبدال صامت
create table memory_conflicts (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references users(id) on delete cascade,
  memory_a_id    uuid not null references memories(id) on delete cascade,
  memory_b_id    uuid not null references memories(id) on delete cascade,
  question       text not null,
  resolution     text check (resolution in
                   ('opinion_changed','source_a_wrong','source_b_wrong','both_valid_over_time','unresolved')),
  resolved_at    timestamptz,
  created_at     timestamptz not null default now()
);

-- Proof of Forgetting (§23.4 Expansion)
create table purge_receipts (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references users(id) on delete cascade,
  requested_at      timestamptz not null default now(),
  deleted_counts    jsonb not null,
  retained_items    jsonb not null default '[]'::jsonb,
  external_remnants jsonb not null default '[]'::jsonb,
  complete          boolean not null
);

-- ─────────────────────────────────────────────────────────────
-- SIGNALS  (ADR-0008)
-- ─────────────────────────────────────────────────────────────

create table signals (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references users(id) on delete cascade,
  signal_type     text not null,
  headline        text not null,
  why_now         text not null,
  suggested_move  text,
  tier            signal_tier not null,
  -- الدرجات مفصولة حتى تكون المعايرة ممكنة
  goal_match        numeric(4,3) not null,
  urgency           numeric(4,3) not null,
  novelty           numeric(4,3) not null,
  evidence_strength numeric(4,3) not null,
  timing_fit        numeric(4,3) not null,
  interruption_cost numeric(4,3) not null,
  relevance         numeric(4,3) not null,
  produced_by     text not null check (produced_by in ('rule','cortex')),
  sensitivity     sensitivity_zone not null default 'private',
  feedback        text check (feedback in ('useful','wrong','too_late','already_knew','never_this_type')),
  feedback_at     timestamptz,
  surfaced_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index signals_open_idx on signals (owner_id, tier, created_at desc) where feedback is null;

create table signal_evidence (
  id        uuid primary key default gen_random_uuid(),
  signal_id uuid not null references signals(id) on delete cascade,
  event_id  uuid references events(id) on delete set null,
  memory_id uuid references memories(id) on delete set null,
  entity_id uuid references entities(id) on delete set null,
  note      text,
  constraint must_reference_evidence
    check (event_id is not null or memory_id is not null or entity_id is not null)
);

create unique index signal_evidence_unique_idx on signal_evidence
  (signal_id, coalesce(event_id, memory_id, entity_id));

-- ميزانية المقاطعة اليومية
create table interruption_budget (
  owner_id   uuid not null references users(id) on delete cascade,
  day        date not null,
  allowed    int not null default 3,
  spent      int not null default 0,
  primary key (owner_id, day)
);

-- ─────────────────────────────────────────────────────────────
-- PERMISSIONS + ACTIONS  (ADR-0007)
-- ─────────────────────────────────────────────────────────────

create table connectors (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references users(id) on delete cascade,
  provider      text not null,
  display_name  text not null,
  status        text not null default 'disconnected'
                check (status in ('disconnected','connected','error','revoked')),
  -- الأربعة مفاتيح، لا مفتاح واحد (Expansion §4.6)
  can_observe   boolean not null default false,
  can_remember  boolean not null default false,
  can_infer     boolean not null default false,
  can_act       boolean not null default false,
  scopes        text[] not null default '{}',
  allowlist     text[] not null default '{}',
  last_sync_at  timestamptz,
  health        text not null default 'unknown',
  created_at    timestamptz not null default now(),
  unique (owner_id, provider)
);

create table tool_permissions (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references users(id) on delete cascade,
  agent         text not null,
  tool          text not null,
  risk          risk_tier not null,
  autonomy      autonomy_level not null default 'l1',
  daily_limit   int,
  updated_at    timestamptz not null default now(),
  updated_by    text not null default 'manual',
  unique (owner_id, agent, tool),
  -- السقف الصلب: لا فعل خارجي أو مدمر يتجاوز L3 مهما كان الإعداد
  constraint hard_ceiling_on_dangerous_tools
    check (risk not in ('external_action','destructive') or autonomy in ('l0','l1','l2','l3'))
);

create table ai_actions (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references users(id) on delete cascade,
  agent         text not null,
  tool          text not null,
  arguments     jsonb not null default '{}'::jsonb,
  risk          risk_tier not null,
  status        action_status not null default 'proposed',
  why           text not null,
  will_access   text[] not null default '{}',
  will_not_do   text[] not null default '{}',
  evidence_ids  uuid[] not null default '{}',
  proposed_at   timestamptz not null default now(),
  decided_at    timestamptz,
  executed_at   timestamptz,
  result        jsonb,
  error         text,
  expires_at    timestamptz not null default (now() + interval '24 hours')
);

create index actions_pending_idx on ai_actions (owner_id, status, proposed_at desc)
  where status in ('proposed','awaiting_approval');

create table audit_log (
  id          bigserial primary key,
  owner_id    uuid not null references users(id) on delete cascade,
  at          timestamptz not null default now(),
  actor       text not null,
  action      text not null,
  target_type text,
  target_id   uuid,
  risk        risk_tier,
  outcome     text not null check (outcome in ('allowed','denied','executed','failed')),
  reason      text,
  detail      jsonb not null default '{}'::jsonb
);

create index audit_time_idx on audit_log (owner_id, at desc);

-- ─────────────────────────────────────────────────────────────
-- GOALS + XP  (§19، Expansion §7-8)
-- ─────────────────────────────────────────────────────────────

create table goals (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references users(id) on delete cascade,
  level         text not null check (level in ('north_star','era','arc','quest','experiment','next_move')),
  parent_id     uuid references goals(id) on delete cascade,
  title         text not null,
  desired_outcome text,
  non_negotiables text[] not null default '{}',
  evidence_of_progress text[] not null default '{}',
  origin        text not null default 'explicit' check (origin in ('explicit','candidate','detected')),
  status        text not null default 'active'
                check (status in ('active','completed','abandoned','superseded','awaiting_approval')),
  -- §7.2: الهدف المتروك ليس فشلًا — نحفظ السبب
  closed_reason text,
  closed_at     timestamptz,
  created_at    timestamptz not null default now()
);

create table xp_events (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references users(id) on delete cascade,
  domain              text not null check (domain in
                        ('creative','career','focus','social','finance','system','wellbeing')),
  label               text not null,
  base_value          int not null,
  evidence_confidence numeric(4,3) not null,
  personal_importance numeric(4,3) not null,
  novelty             numeric(4,3) not null default 1.0,
  completion          numeric(4,3) not null default 1.0,
  xp                  int generated always as (
                        round(base_value * evidence_confidence * personal_importance
                              * novelty * completion)::int
                      ) stored,
  source_event_id     uuid references events(id) on delete set null,
  -- §19.3: غنيم يستطيع تعديل أو حذف أي XP event
  removed             boolean not null default false,
  removed_reason      text,
  occurred_at         timestamptz not null default now()
);

create index xp_domain_idx on xp_events (owner_id, domain, occurred_at desc) where removed = false;

-- ─────────────────────────────────────────────────────────────
-- RLS — على كل جدول، بلا استثناء
-- ─────────────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'users','personal_constitution','entities','entity_relations','events',
    'memories','memory_sources','memory_conflicts','purge_receipts',
    'signals','signal_evidence','interruption_budget','connectors',
    'tool_permissions','ai_actions','audit_log','goals','xp_events'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

create policy owner_all on entities
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on events
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on memories
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on signals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on ai_actions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on goals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on xp_events
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on connectors
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on tool_permissions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on personal_constitution
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on entity_relations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on memory_conflicts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on purge_receipts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on interruption_budget
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_read on users
  for select using (id = auth.uid());

-- الجداول التابعة ترث الملكية عبر الأب
create policy owner_via_memory on memory_sources
  for all using (exists (
    select 1 from memories m where m.id = memory_id and m.owner_id = auth.uid()
  ));
create policy owner_via_signal on signal_evidence
  for all using (exists (
    select 1 from signals s where s.id = signal_id and s.owner_id = auth.uid()
  ));

-- سجل التدقيق: قراءة فقط للمالك. الكتابة من الخادم حصرًا.
create policy owner_read_audit on audit_log
  for select using (owner_id = auth.uid());
