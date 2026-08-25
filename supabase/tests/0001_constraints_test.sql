\set ON_ERROR_STOP off
\set QUIET on
insert into users (id, email, display_name)
values ('00000000-0000-0000-0000-000000000001','ahmgonaim@gmail.com','Ahmed Gonaim');

\echo '--- 1. حدث مرصود ومعه confidence  => لازم يترفض'
insert into events (owner_id,event_type,occurred_at,source,sensitivity,observed_or_inferred,confidence,fingerprint)
values ('00000000-0000-0000-0000-000000000001','browser.tab.focused',now(),'lens','private','observed',0.9,'fp_a');

\echo '--- 2. حدث مستنتج بلا confidence  => لازم يترفض'
insert into events (owner_id,event_type,occurred_at,source,sensitivity,observed_or_inferred,fingerprint)
values ('00000000-0000-0000-0000-000000000001','browser.intent.started',now(),'lens','private','inferred','fp_b');

\echo '--- 3. حدث سليم  => لازم ينجح'
insert into events (owner_id,event_type,occurred_at,source,sensitivity,observed_or_inferred,fingerprint)
values ('00000000-0000-0000-0000-000000000001','browser.tab.focused',now(),'lens','private','observed','fp_ok');

\echo '--- 4. نفس الـfingerprint مرتين  => لازم يترفض'
insert into events (owner_id,event_type,occurred_at,source,sensitivity,observed_or_inferred,fingerprint)
values ('00000000-0000-0000-0000-000000000001','browser.tab.focused',now(),'lens','private','observed','fp_ok');

\echo '--- 5. ذاكرة sensitive ومعها embedding سحابي  => لازم يترفض'
insert into memories (owner_id,kind,statement,confidence,confidence_reason,sensitivity,embedding,created_by)
values ('00000000-0000-0000-0000-000000000001','sensitive','رصيد الحساب',0.9,'مصدر واحد','sensitive','[0.1]','cortex');

\echo '--- 6. ذاكرة vaulted ومعها embedding  => لازم يترفض'
insert into memories (owner_id,kind,statement,confidence,confidence_reason,sensitivity,embedding,created_by)
values ('00000000-0000-0000-0000-000000000001','identity','رقم الإقامة',0.9,'وثيقة','vaulted','[0.1]','manual');

\echo '--- 7. ذاكرة private ومعها embedding  => لازم ينجح'
insert into memories (id,owner_id,kind,statement,confidence,confidence_reason,sensitivity,embedding,created_by)
values ('00000000-0000-0000-0000-0000000000aa','00000000-0000-0000-0000-000000000001','preference','لا Neon زائد',0.85,'تكرر في ٣ مراجعات','private','[0.1]','cortex');

\echo '--- 8. memory_source بلا أي ربط  => لازم يترفض'
insert into memory_sources (memory_id) values ('00000000-0000-0000-0000-0000000000aa');

\echo '--- 9. أداة external_action على L4  => لازم يترفض (السقف الصلب)'
insert into tool_permissions (owner_id,agent,tool,risk,autonomy)
values ('00000000-0000-0000-0000-000000000001','producer','send_email','external_action','l4');

\echo '--- 10. أداة destructive على L5  => لازم يترفض'
insert into tool_permissions (owner_id,agent,tool,risk,autonomy)
values ('00000000-0000-0000-0000-000000000001','archivist','delete_drive_file','destructive','l5');

\echo '--- 11. أداة archive على L4  => لازم ينجح'
insert into tool_permissions (owner_id,agent,tool,risk,autonomy)
values ('00000000-0000-0000-0000-000000000001','archivist','backup_folder','write_reversible','l4');

\echo '--- 12. علاقة بين عقدة ونفسها  => لازم يترفض'
insert into entities (id,owner_id,type,title) values
 ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-000000000001','project','Paper World');
insert into entity_relations (owner_id,from_entity_id,to_entity_id,relation_type,confidence,reason)
values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000b1','relates_to',0.5,'x');

\echo '--- 13. حساب XP  => 400 × 0.9 × 0.8 = 288'
insert into xp_events (owner_id,domain,label,base_value,evidence_confidence,personal_importance)
values ('00000000-0000-0000-0000-000000000001','creative','Master reference locked',400,0.9,0.8);
select xp from xp_events where label='Master reference locked';

\echo '--- 14. حذف كيان له دليل  => لازم ينجح (لا يخالف must_bind_something)'
insert into entities (id,owner_id,type,title) values
 ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-000000000001','want','عنصر بدليل');
insert into memories (id,owner_id,kind,statement,confidence,confidence_reason,sensitivity,created_by)
 values ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-000000000001','preference','تفضيل',0.9,'س','private','cortex');
insert into memory_sources (memory_id,entity_id)
 values ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000c1');
delete from entities where id='00000000-0000-0000-0000-0000000000c1';
select count(*) as remaining_links from memory_sources
 where memory_id='00000000-0000-0000-0000-0000000000c2';
