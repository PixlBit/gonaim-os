-- تصحيح: روابط الأدلة كانت تُفرَّغ بدل أن تُحذف.
--
-- `memory_sources` و`signal_evidence` يحمل كلٌّ منهما قيدًا يشترط وجود ربط
-- واحد على الأقل (`must_bind_something` / `must_reference_evidence`)، بينما
-- مفاتيحهما الأجنبية كانت `on delete set null`.
--
-- النتيجة: حذف كيان يُفرِّغ الصف فيصير مخالفًا لقيده هو نفسه، فيفشل الحذف
-- بخطأ لا علاقة له بما طُلب. أي أن **النسيان كان مستحيلًا** على أي كيان
-- يحمل دليلًا — وهو ما ظهر أول ما شُغِّل حذف حقيقي.
--
-- الصواب دلاليًا هو الحذف لا التفريغ: رابط دليل فقد طرفه لم يعد يصف شيئًا.
-- والذاكرة نفسها تبقى ما دام لها مصدر آخر — وهو ما يتكفّل به forget().

alter table memory_sources
  drop constraint memory_sources_event_id_fkey,
  add  constraint memory_sources_event_id_fkey
       foreign key (event_id) references events(id) on delete cascade;

alter table memory_sources
  drop constraint memory_sources_entity_id_fkey,
  add  constraint memory_sources_entity_id_fkey
       foreign key (entity_id) references entities(id) on delete cascade;

alter table signal_evidence
  drop constraint signal_evidence_event_id_fkey,
  add  constraint signal_evidence_event_id_fkey
       foreign key (event_id) references events(id) on delete cascade;

alter table signal_evidence
  drop constraint signal_evidence_memory_id_fkey,
  add  constraint signal_evidence_memory_id_fkey
       foreign key (memory_id) references memories(id) on delete cascade;

alter table signal_evidence
  drop constraint signal_evidence_entity_id_fkey,
  add  constraint signal_evidence_entity_id_fkey
       foreign key (entity_id) references entities(id) on delete cascade;
