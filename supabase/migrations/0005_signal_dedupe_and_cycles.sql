-- الإشارات كانت تُحسب عند كل طلب ولا تُخزَّن.
--
-- الأثر: `alreadySurfaced` يصل فارغًا دائمًا، فـNovelty لا تنخفض أبدًا،
-- فنفس الإشارة تُعرض كأنها جديدة في كل مرة. وهو بالضبط ما تحذّر منه §39:
-- "Notification overload → تجاهل النظام".
--
-- `dedupe_key` هو المفتاح الثابت الذي تنتجه القاعدة لنفس الملاحظة
-- (`rule.code:entity:discriminator`). فريد لكل مالك، فالتشغيل الثاني
-- يتعرّف على ما عُرض ولا يعيده.

alter table signals add column dedupe_key text;
alter table signals add column rule_code  text;

-- الإشارات القائمة (إن وُجدت) بلا مفتاح — نملؤها بمعرّفها حتى لا تتصادم
update signals set dedupe_key = id::text where dedupe_key is null;
alter table signals alter column dedupe_key set not null;

create unique index signals_dedupe_idx on signals (owner_id, dedupe_key);
create index signals_rule_idx on signals (owner_id, rule_code, created_at desc);


-- سجل الدورات: ماذا شغّل النظام، ومتى، وبماذا خرج.
--
-- بدونه لا يمكن معرفة إن كانت الدورة توقفت — ونظام يراقب حياتك وهو
-- نفسه غير مراقَب ليس نظامًا يُعتمد عليه.
create table cycle_runs (
  id            bigserial primary key,
  owner_id      uuid not null references users(id) on delete cascade,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  status        text not null default 'running'
                check (status in ('running','ok','failed','skipped_blackout')),
  -- ما رصدته القواعد مقابل ما عبر البوابة فعلًا
  findings      int not null default 0,
  surfaced      int not null default 0,
  inboxed       int not null default 0,
  below         int not null default 0,
  suppressed    int not null default 0,
  purged_events int not null default 0,
  duration_ms   int,
  error         text
);

create index cycle_runs_recent_idx on cycle_runs (owner_id, started_at desc);

alter table cycle_runs enable row level security;
alter table cycle_runs force row level security;
create policy owner_all on cycle_runs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
