-- EHNA//OS — مساحة الاثنين
--
-- مخزَن المساحة سطر واحد في جدول واحد. هذا ليس اختصارًا: المساحة تخص
-- شخصين بالضبط، وكل كتابة فيها ذرّية بطبيعتها، فالوثيقة الواحدة تعطي
-- ما تعطيه المعاملات الموزّعة بلا تعقيدها — ونسخة احتياطية تُقرأ بالعين.
--
-- التزامن محكوم بـ`rev`: التحديث يشترط النسخة التي قرأها العميل، فمن
-- كتب متأخرًا يُرفض ويعيد القراءة. بدون ذلك، اثنان على تليفونين يمحو
-- أحدهما عمل الآخر بصمت.
--
-- الجداول هنا أحادية المستأجر (لا `owner_id`): من يصل إلى القاعدة يصل
-- إلى المساحة كلها، والحارس هو الخادم لا سياسة صف. RLS مفعّلة رغم ذلك
-- بمنع كامل للدور العام — حتى لا يفتح مفتاح `anon` مسرّب شيئًا.

create table ehna_vault (
  id          smallint primary key default 1,
  rev         bigint   not null,
  doc         jsonb    not null,
  updated_at  timestamptz not null default now(),
  -- سطر واحد فقط. القيد في القاعدة لا في نية التطبيق.
  constraint ehna_vault_single_row check (id = 1),
  constraint ehna_vault_rev_forward check (rev > 0)
);

create table ehna_photo (
  id          text primary key,
  mime        text not null,
  bytes       bytea not null,
  created_at  timestamptz not null default now(),
  -- الاسم يحدده الخادم بصيغة ثابتة؛ القيد يمنع أي شيء آخر من الدخول
  constraint ehna_photo_id_shape check (id ~ '^ph_[0-9a-f]{24}\.(jpg|png|webp|gif)$'),
  constraint ehna_photo_mime_allowed check (mime in ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  -- 8MB سقف الصورة الواحدة. الواجهة تصغّر قبل الرفع، وهذا هو الحد الأخير.
  constraint ehna_photo_size check (octet_length(bytes) between 1 and 8 * 1024 * 1024)
);

alter table ehna_vault enable row level security;
alter table ehna_photo enable row level security;

-- لا سياسة = لا وصول لأي دور غير المالك (`postgres`/service_role تتجاوز RLS).
-- الخادم وحده يتصل بالقاعدة، ومفتاح عام مسرّب لا يقرأ حرفًا.
