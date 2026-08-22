\set QUIET on
\set uid '''00000000-0000-0000-0000-000000000001'''
insert into users (id,email,display_name) values (:uid,'ahmgonaim@gmail.com','Ahmed Gonaim');

-- اشتراك: مستهلك كريدت قليل ويجدد قريب
insert into entities (id,owner_id,type,title,sensitivity) values
 ('11111111-0000-0000-0000-000000000001',:uid,'subscription','OpenAI Plus','sensitive');
insert into subscriptions (entity_id,owner_id,provider,amount,currency,cycle,renews_on,
                           credit_included,credit_used,credit_unit,amount_source)
 values ('11111111-0000-0000-0000-000000000001',:uid,'OpenAI',75.00,'SAR','monthly',
         date '2026-08-27', 100, 8, 'messages','manual');

-- فاتورة: أرسلها ولم تُدفع، والمعتاد مع هذا الطرف ١٤ يومًا
insert into entities (id,owner_id,type,title,sensitivity) values
 ('11111111-0000-0000-0000-000000000002',:uid,'invoice','Invoice #6021','sensitive');
insert into invoices (entity_id,owner_id,direction,counterparty,amount,currency,
                      issued_on,typical_days,amount_source)
 values ('11111111-0000-0000-0000-000000000002',:uid,'incoming','Studio Client',8500.00,'SAR',
         date '2026-08-04', 14, 'email');

-- رغبة: سماعة — ٤ زيارات من متجرين خلال ١٠ أيام (نفس نمط THE SHADOW)
insert into entities (id,owner_id,type,title,sensitivity) values
 ('11111111-0000-0000-0000-000000000003',:uid,'want','Sony WH-1000XM5','private');
insert into wish_items (entity_id,owner_id,state,target_price,why_want,
                        revisits_30d,distinct_stores,last_revisit_at)
 values ('11111111-0000-0000-0000-000000000003',:uid,'watching_price',1200,
         array['حساسية للضوضاء','تصميم أسود بسيط'],4,2,now());
insert into price_observations (entity_id,owner_id,price,store,source_uri,observed_at,pct_change) values
 ('11111111-0000-0000-0000-000000000003',:uid,1499,'amazon.sa','https://amazon.sa/…',now()-interval '9 days',null),
 ('11111111-0000-0000-0000-000000000003',:uid,1420,'jarir.com','https://jarir.com/…',now()-interval '4 days',-0.053),
 ('11111111-0000-0000-0000-000000000003',:uid,1319,'amazon.sa','https://amazon.sa/…',now(),-0.120);

-- التزام: رد مهني لم يُرسل
insert into entities (id,owner_id,type,title,sensitivity) values
 ('11111111-0000-0000-0000-000000000004',:uid,'obligation','رد على عرض تعاون','sensitive');
insert into obligations (entity_id,owner_id,kind,what,noted_from,typical_reply_days,last_contact_at)
 values ('11111111-0000-0000-0000-000000000004',:uid,'reply_owed','رد على عرض تعاون',
         'email',3,now()-interval '9 days');

\set QUIET on
\pset border 0
\pset footer off
\echo ''
\echo '════ القواعد الحتمية — بلا أي نموذج ════'
\echo ''

-- sub.renewal_approaching + sub.credit_underused
select '⟡ ' || e.title || ' — يتجدد بعد ' || (s.renews_on - current_date) || ' أيام بمبلغ '
       || s.amount || ' ' || s.currency
       || ' · مستهلك ' || round(100.0*s.credit_used/s.credit_included) || '٪ من الكريدت'
       as "money"
from subscriptions s join entities e on e.id = s.entity_id
where s.cancelled_at is null and s.auto_renews
  and s.renews_on - current_date <= 7;

-- invoice.overdue_vs_typical
select '⟡ ' || e.title || ' — ' || i.amount || ' ' || i.currency || ' من ' || i.counterparty
       || ' · مر ' || (current_date - i.issued_on) || ' يومًا، والمعتاد ' || i.typical_days
       as "invoice"
from invoices i join entities e on e.id = i.entity_id
where i.paid_on is null
  and (current_date - i.issued_on) > i.typical_days * 1.25;

-- want.revisited_repeatedly + want.price_dropped
select '⟡ ' || e.title || ' — ' || w.revisits_30d || ' زيارات من متجرين · نزل ' || round(100*abs(p.pct_change)) || '٪ إلى ' || p.price || ' ' || p.currency
       || ' (' || p.store || ')'
       as "want"
from wish_items w
join entities e on e.id = w.entity_id
join lateral (select * from price_observations po
              where po.entity_id = w.entity_id order by observed_at desc limit 1) p on true
where w.state in ('want','considering','watching_price')
  and w.revisits_30d >= 3 and w.distinct_stores >= 2
  and p.pct_change <= -0.10;

-- obligation.overdue_vs_typical
select '⟡ ' || o.what || ' — آخر تواصل من ' || extract(day from now()-o.last_contact_at)::int
       || ' أيام، والمعتاد ' || o.typical_reply_days
       as "obligation"
from obligations o
where o.status='open'
  and extract(day from now()-o.last_contact_at) > o.typical_reply_days * 1.5;

\echo ''
\echo '════ cross.cash_window — القاعدة الجامعة ════'
\echo ''
with w as (select 10 as days)
select case when count(distinct domain) >= 3
  then 'نافذة سيولة خلال ' || (select days from w) || ' أيام — تقاطع '
       || count(distinct domain) || ' مجالات · صافي الضغط '
       || to_char(sum(impact),'FM999999') || ' SAR'
  else 'لا نافذة — ' || count(distinct domain) || ' مجال فقط' end as "cross_domain"
from (
  select 'money' as domain, -s.amount as impact
    from subscriptions s where s.renews_on - current_date <= (select days from w)
      and s.cancelled_at is null and s.auto_renews
  union all
  select 'receivable', i.amount from invoices i
    where i.paid_on is null and i.direction='incoming'
      and (current_date - i.issued_on) > i.typical_days
  union all
  select 'wants', -p.price from wish_items wi
    join lateral (select price from price_observations po
                  where po.entity_id=wi.entity_id order by observed_at desc limit 1) p on true
    where wi.state in ('want','considering','watching_price') and wi.revisits_30d >= 3
) x;
\echo ''
