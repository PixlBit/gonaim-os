-- GONAIM//OS — Life domains
-- Source: Expansion §3 (خريطة الحياة), §36 (أمثلة جاسوسية), Blueprint §18, §21, §29.1
--
-- النمط: entities هي العمود الفقري للعلاقات. الجداول هنا "أوجه" (facets) للمجالات
-- التي تحتاج حقولًا منظمة تعمل عليها قواعد حتمية. لا يوجد مجال بلا entity — حتى
-- تبقى العلاقات بين المجالات ممكنة، فالقيمة كلها في الربط بينها.

-- ─────────────────────────────────────────────────────────────
-- سجل الأنواع — الأنواع بيانات، لا كود
-- ─────────────────────────────────────────────────────────────

create table entity_types (
  code        text primary key,
  domain      text not null,
  label_ar    text not null,
  label_en    text not null,
  facet_table text
);

insert into entity_types (code, domain, label_ar, label_en, facet_table) values
  ('person',       'social',   'شخص',        'Person',       null),
  ('subscription', 'money',    'اشتراك',      'Subscription', 'subscriptions'),
  ('invoice',      'money',    'فاتورة',      'Invoice',      'invoices'),
  ('want',         'wants',    'رغبة',        'Want',         'wish_items'),
  ('possession',   'objects',  'مقتنى',       'Possession',   'possessions'),
  ('obligation',   'social',   'التزام',      'Obligation',   'obligations'),
  ('place',        'places',   'مكان',        'Place',        null),
  ('skill',        'learning', 'مهارة',       'Skill',        null),
  ('opportunity',  'career',   'فرصة',        'Opportunity',  null),
  ('project',      'creative', 'مشروع',       'Project',      null),
  ('idea',         'creative', 'فكرة',        'Idea',         null),
  ('account',      'digital',  'حساب',        'Account',      null),
  ('decision',     'identity', 'قرار',        'Decision',     null);

-- ─────────────────────────────────────────────────────────────
-- المال — قواعد حتمية بالكامل، تعمل من أول يوم
-- ─────────────────────────────────────────────────────────────

create table subscriptions (
  entity_id        uuid primary key references entities(id) on delete cascade,
  owner_id         uuid not null references users(id) on delete cascade,
  provider         text not null,
  amount           numeric(12,2) not null check (amount >= 0),
  currency         char(3) not null default 'SAR',
  cycle            text not null check (cycle in ('monthly','yearly','quarterly','one_time')),
  renews_on        date,
  auto_renews      boolean not null default true,
  -- الكريدت: أساس قاعدة "اشتراك يستهلك كريدت أقل بكثير من قيمته" (§36)
  credit_included  numeric(12,2),
  credit_used      numeric(12,2),
  credit_unit      text,
  -- كل رقم يحمل مصدره وتاريخ آخر تحقق (§21.1) — لا خلط بين تقدير ورصيد حقيقي
  amount_source    text not null check (amount_source in ('manual','email','statement','page')),
  last_verified_at timestamptz not null default now(),
  cancelled_at     timestamptz,
  check (credit_used is null or credit_included is null or credit_used <= credit_included * 1.5)
);

create index subs_renewal_idx on subscriptions (owner_id, renews_on)
  where cancelled_at is null and auto_renews;

create table invoices (
  entity_id       uuid primary key references entities(id) on delete cascade,
  owner_id        uuid not null references users(id) on delete cascade,
  direction       text not null check (direction in ('incoming','outgoing')),
  counterparty    text not null,
  amount          numeric(12,2) not null,
  currency        char(3) not null default 'SAR',
  issued_on       date not null,
  due_on          date,
  paid_on         date,
  -- المدة المعتادة لهذا الطرف — أساس قاعدة "تأخر عن المعتاد" لا "تأخر عن رقم ثابت"
  typical_days    int,
  last_chased_at  timestamptz,
  amount_source   text not null check (amount_source in ('manual','email','pdf','statement'))
);

create index invoices_open_idx on invoices (owner_id, due_on) where paid_on is null;

-- ─────────────────────────────────────────────────────────────
-- الرغبات — سعر × وقت × تكرار اهتمام
-- ─────────────────────────────────────────────────────────────

create table wish_items (
  entity_id        uuid primary key references entities(id) on delete cascade,
  owner_id         uuid not null references users(id) on delete cascade,
  state            text not null default 'want'
                   check (state in ('want','considering','watching_price','owned','rejected','sold')),
  target_price     numeric(12,2),
  currency         char(3) not null default 'SAR',
  -- لماذا يريده — يمنع تحول القائمة إلى bookmarks بلا معنى (§18.2)
  why_want         text[] not null default '{}',
  first_seen_at    timestamptz not null default now(),
  -- عدّاد التكرار: "فتح نفس المنتج ٤ مرات من متجرين خلال ١٠ أيام" (§36)
  revisits_30d     int not null default 0,
  distinct_stores  int not null default 1,
  last_revisit_at  timestamptz,
  -- §10.4: أحيانًا أفضل اقتراح هو "لا تشترِ الآن"
  cooling_until    date,
  decided_at       timestamptz,
  decision         text check (decision in ('bought','dropped','postponed'))
);

create index wants_watch_idx on wish_items (owner_id, state)
  where state in ('want','considering','watching_price');

create table price_observations (
  id           uuid primary key default gen_random_uuid(),
  entity_id    uuid not null references entities(id) on delete cascade,
  owner_id     uuid not null references users(id) on delete cascade,
  price        numeric(12,2) not null,
  currency     char(3) not null default 'SAR',
  in_stock     boolean,
  store        text not null,
  source_uri   text not null,
  observed_at  timestamptz not null default now(),
  -- لا تنبيه على تغير تافه: الفرق يُحسب ويُخزَّن، والقاعدة تقرر
  pct_change   numeric(6,3)
);

create index prices_item_idx on price_observations (entity_id, observed_at desc);

-- ─────────────────────────────────────────────────────────────
-- الناس والالتزامات — بلا تقييم بشر، بلا قراءة شاملة
-- ─────────────────────────────────────────────────────────────

create table obligations (
  entity_id        uuid primary key references entities(id) on delete cascade,
  owner_id         uuid not null references users(id) on delete cascade,
  person_entity_id uuid references entities(id) on delete set null,
  kind             text not null check (kind in ('reply_owed','promise_made','followup','intro','payment')),
  what             text not null,
  -- المصدر إلزامي: لا التزام بلا دليل
  noted_from       text not null check (noted_from in ('manual','message','email','voice_note')),
  source_uri       text,
  due_by           date,
  -- "المدة المعتادة" لهذه العلاقة، لا رقم عام
  typical_reply_days int,
  last_contact_at  timestamptz,
  status           text not null default 'open'
                   check (status in ('open','done','released','expired')),
  -- §21.2: "released" = قرر ألا يفعلها. ليس فشلًا، ولا يُذكَّر به مجددًا
  released_reason  text,
  closed_at        timestamptz
);

create index obligations_open_idx on obligations (owner_id, due_by) where status = 'open';

create table possessions (
  entity_id       uuid primary key references entities(id) on delete cascade,
  owner_id        uuid not null references users(id) on delete cascade,
  category        text not null,
  acquired_on     date,
  purchase_price  numeric(12,2),
  currency        char(3) not null default 'SAR',
  condition       text check (condition in ('new','good','worn','broken','lost')),
  warranty_until  date,
  location        text,
  -- يربط المقتنى بالرغبة التي حلّ محلها — أساس "عندك واحدة بالفعل"
  replaces_entity_id uuid references entities(id) on delete set null
);

-- ─────────────────────────────────────────────────────────────
-- محرك القواعد الحتمية — يعمل قبل أي نموذج (§31.1)
-- ─────────────────────────────────────────────────────────────

create table rule_defs (
  code          text primary key,
  domain        text not null,
  title_ar      text not null,
  -- ما الذي يجعل هذه القاعدة تُطلق — نص مقروء، يظهر للمستخدم في "لماذا الآن"
  fires_when    text not null,
  default_tier  signal_tier not null,
  -- القواعد الحتمية لا تحمل ثقة احتمالية: إما تحققت أو لا
  requires_model boolean not null default false,
  enabled       boolean not null default true,
  params        jsonb not null default '{}'::jsonb
);

insert into rule_defs (code, domain, title_ar, fires_when, default_tier, params) values
  ('sub.renewal_approaching', 'money', 'اشتراك يقترب من التجديد',
   'renews_on - today <= lead_days AND auto_renews', 'window',
   '{"lead_days": 5}'),

  ('sub.credit_underused', 'money', 'كريدت غير مستهلك قبل التجديد',
   'credit_used / credit_included < threshold AND renews_on - today <= lead_days', 'nudge',
   '{"threshold": 0.30, "lead_days": 7}'),

  ('invoice.overdue_vs_typical', 'money', 'فاتورة تأخرت عن المعتاد لهذا الطرف',
   'today - issued_on > typical_days * factor AND paid_on IS NULL', 'nudge',
   '{"factor": 1.25}'),

  ('want.revisited_repeatedly', 'wants', 'اهتمام متكرر يستحق قرارًا',
   'revisits_30d >= min_revisits AND distinct_stores >= min_stores', 'nudge',
   '{"min_revisits": 3, "min_stores": 2}'),

  ('want.price_dropped', 'wants', 'انخفاض سعر حقيقي لعنصر مراقَب',
   'pct_change <= -min_drop AND state IN (want, considering, watching_price)', 'window',
   '{"min_drop": 0.10}'),

  ('want.already_owned', 'wants', 'لديك ما يقوم بنفس الدور',
   'possession exists with same category AND condition IN (new, good)', 'whisper',
   '{}'),

  ('obligation.overdue_vs_typical', 'social', 'رد أو وعد تجاوز المدة المعتادة',
   'today - last_contact_at > typical_reply_days * factor AND status = open', 'nudge',
   '{"factor": 1.5}'),

  ('possession.warranty_expiring', 'objects', 'ضمان يقترب من الانتهاء',
   'warranty_until - today <= lead_days', 'whisper',
   '{"lead_days": 30}'),

  -- القاعدة الجامعة: هي وحدها ما يجعل النظام يبدو من المستقبل
  ('cross.cash_window', 'cross', 'نافذة سيولة — عدة مجالات تتقاطع',
   'renewals + unpaid invoices + active wants within same window', 'interrupt',
   '{"window_days": 10, "min_domains": 3}');

create table rule_runs (
  id          bigserial primary key,
  owner_id    uuid not null references users(id) on delete cascade,
  rule_code   text not null references rule_defs(code),
  ran_at      timestamptz not null default now(),
  matched     int not null default 0,
  emitted     int not null default 0,
  suppressed  int not null default 0,
  duration_ms int
);

create index rule_runs_recent_idx on rule_runs (owner_id, rule_code, ran_at desc);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'subscriptions','invoices','wish_items','price_observations',
    'obligations','possessions','rule_runs'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format(
      'create policy owner_all on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

-- جداول مرجعية: قراءة للجميع، كتابة من الخادم
alter table entity_types enable row level security;
alter table rule_defs    enable row level security;
create policy read_all on entity_types for select using (true);
create policy read_all on rule_defs    for select using (true);
