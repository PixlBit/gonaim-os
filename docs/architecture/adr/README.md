# Architecture Decision Records — GONAIM//OS

كل ADR يسجل قرارًا معماريًا واحدًا: السياق، القرار، النتائج، والبدائل المرفوضة ولماذا.

القاعدة: **لا يُلغى ADR، يُستبدل.** لو تغيّر القرار، يُنشأ ADR جديد بحالة `Accepted`
ويُحدَّث القديم إلى `Superseded by ADR-XXXX`. هذا هو نفس منطق `Conflict Frame`
في BLACKBOX — لا نستبدل القديم بصمت.

| ADR | العنوان | الحالة |
| --- | --- | --- |
| [0001](0001-platform-shape.md) | شكل المنصة — PWA + Browser Companion + Windows Companion لاحقًا | Accepted |
| [0002](0002-postgres-not-graph-db.md) | Postgres + pgvector بدل Graph Database | Accepted |
| [0003](0003-claude-is-not-the-memory.md) | Claude محرك تفكير، BLACKBOX هي الذاكرة | Accepted |
| [0004](0004-memory-write-protocol.md) | لا كتابة مباشرة للذاكرة — مسار Candidate إلزامي | Accepted |
| [0005](0005-embeddings-dual-mode.md) | Embeddings بوضعين: Privacy محلي / Convenience سحابي | Accepted |
| [0006](0006-secrets-never-in-client.md) | لا أسرار في المتصفح — كل نداء AI عبر Worker | Accepted |
| [0007](0007-per-action-autonomy.md) | الاستقلال يُمنح لكل فعل ولكل مصدر، لا للنظام كله | Accepted |
| [0008](0008-interruption-budget.md) | بوابة تسجيل + ميزانية مقاطعة قبل أي إشعار | Accepted |
| [0009](0009-external-first-storage.md) | External-first: الأصل يبقى في مصدره | Accepted |
