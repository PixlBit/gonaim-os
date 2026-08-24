import type { Sql } from "postgres";
import { audit } from "./audit.js";
import { count, DAY } from "@gonaim/domain";

/**
 * Export my mind — §5.6، §13.5
 *
 * البيانات ملك غنيم. هذا الوعد لا يُختبر إلا بتصدير يعمل فعلًا ويُقرأ
 * خارج النظام. ثلاث صيغ لأن لكلٍّ غرضًا مختلفًا:
 *   JSON      — إعادة الاستيراد وقراءة الآلة
 *   Markdown  — قراءة بشرية بعد سنوات، بلا أي أداة
 *   CSV       — جداول ومحاسبة
 *
 * والأهم: قسم `notIncluded`. ADR-0009 يبقي الأصل في مصدره، فالتصدير
 * يحمل الروابط لا الملفات. تصدير يوحي بأنه كامل وهو ليس كذلك أسوأ من
 * تصدير يعلن حدوده.
 */

export interface ExportFile { name: string; mime: string; content: string }
export interface ExportBundle {
  manifest: ExportManifest;
  files: ExportFile[];
}

export interface ExportManifest {
  generatedAt: string;
  owner: string;
  schemaVersion: string;
  counts: Record<string, number>;
  /** ما ليس في هذا الملف، ولماذا. */
  notIncluded: { what: string; why: string; where?: string }[];
}

export async function exportMind(sql: Sql, ownerId: string): Promise<ExportBundle> {
  const [
    user, entities, relations, events, memories, subs, invoices,
    wants, prices, obligations, possessions, xp, auditRows, migrations,
  ] = await Promise.all([
    sql`select id, email, display_name, locale, timezone, created_at from users where id = ${ownerId}`,
    sql`select * from entities where owner_id = ${ownerId} order by created_at`,
    sql`select * from entity_relations where owner_id = ${ownerId}`,
    sql`select * from events where owner_id = ${ownerId} order by occurred_at`,
    sql`select id, kind, statement, status, confidence, confidence_reason, sensitivity,
               evidence_count, pinned, valid_from, valid_to, created_by, created_at
        from memories where owner_id = ${ownerId}`,
    sql`select * from subscriptions where owner_id = ${ownerId}`,
    sql`select * from invoices where owner_id = ${ownerId}`,
    sql`select * from wish_items where owner_id = ${ownerId}`,
    sql`select * from price_observations where owner_id = ${ownerId} order by observed_at`,
    sql`select * from obligations where owner_id = ${ownerId}`,
    sql`select * from possessions where owner_id = ${ownerId}`,
    sql`select * from xp_events where owner_id = ${ownerId} and removed = false`,
    sql`select at, actor, action, outcome, target_type, reason from audit_log
        where owner_id = ${ownerId} order by at`,
    sql`select name, applied_at from schema_migrations order by name`,
  ]);

  const counts = {
    entities: entities.length, relations: relations.length, events: events.length,
    memories: memories.length, subscriptions: subs.length, invoices: invoices.length,
    wants: wants.length, priceObservations: prices.length,
    obligations: obligations.length, possessions: possessions.length,
    xpEvents: xp.length, auditEntries: auditRows.length,
  };

  // العُقد التي أصلها خارجي — الرابط موجود، الملف لا
  const external = entities.filter((e) => e["source_uri"] !== null);

  const manifest: ExportManifest = {
    generatedAt: new Date().toISOString(),
    owner: String(user[0]?.["email"] ?? ownerId),
    schemaVersion: migrations.map((m) => String(m["name"])).join(" · "),
    counts,
    notIncluded: [
      { what: "الملفات والصور الأصلية",
        why: "النظام يحفظ الروابط والبيانات الوصفية، والأصل يبقى في مصدره (ADR-0009).",
        where: `${external.length} عقدة تحمل رابطًا خارجيًا — راجع entities[].source_uri` },
      { what: "متجهات البحث الدلالي (embeddings)",
        why: "مشتقّة وقابلة لإعادة التوليد، وحجمها بلا فائدة للقراءة البشرية." },
      { what: "المفاتيح والتوكنز",
        why: "لا تُصدَّر أبدًا. تُدار في خزنة منفصلة وتُلغى، لا تُنسخ." },
      { what: "ما نُقِّح قبل الحفظ",
        why: "أرقام الحسابات والأسرار نُقّحت عند الاستقبال، فهي غير موجودة أصلًا لتُصدَّر." },
    ],
  };

  const files: ExportFile[] = [
    json("manifest.json", manifest),
    json("nodes.json", {
      user: user[0] ?? null, entities, relations, events, memories,
      subscriptions: subs, invoices, wants, priceObservations: prices,
      obligations, possessions, xpEvents: xp,
    }),
    json("audit.json", auditRows),
    { name: "life.md", mime: "text/markdown", content: markdown(manifest, {
      entities, subs, invoices, wants, obligations, possessions,
    }) },
    csv("subscriptions.csv", subs),
    csv("invoices.csv", invoices),
    csv("wants.csv", wants),
    csv("obligations.csv", obligations),
    csv("possessions.csv", possessions),
    csv("events.csv", events),
  ];

  await audit(sql, ownerId, {
    actor: "owner", action: "export_mind", outcome: "executed",
    detail: { files: files.length, ...counts },
  });

  return { manifest, files };
}

const json = (name: string, data: unknown): ExportFile => ({
  name, mime: "application/json",
  content: JSON.stringify(data, null, 2),
});

type Row = Record<string, unknown>;

function csv(name: string, rows: Row[]): ExportFile {
  if (rows.length === 0) return { name, mime: "text/csv", content: "" };
  const cols = Object.keys(rows[0]!);
  const cell = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString()
      : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return {
    name, mime: "text/csv",
    // BOM حتى تفتح العربية صحيحة في Excel بلا خطوات إضافية
    content: "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n"),
  };
}

function markdown(m: ExportManifest, d: {
  entities: Row[]; subs: Row[]; invoices: Row[];
  wants: Row[]; obligations: Row[]; possessions: Row[];
}): string {
  const L: string[] = [];
  L.push("# GONAIM//OS — تصدير كامل", "");
  L.push(`> **المالك:** ${m.owner}`);
  L.push(`> **التاريخ:** ${m.generatedAt.slice(0, 10)}`);
  L.push(`> **إصدار المخطط:** ${m.schemaVersion}`, "");
  L.push("هذا الملف مقروء بلا أي أداة. لو توقّف المنتج، تبقى الخريطة مفهومة.", "");
  L.push("---", "");

  section(L, "الاشتراكات", d.subs, (s) =>
    `**${s["provider"]}** — ${s["amount"]} ${s["currency"]} / ${s["cycle"]}` +
    (s["renews_on"] ? ` · يتجدد ${day(s["renews_on"])}` : "") +
    (s["credit_included"] ? ` · كريدت ${s["credit_used"] ?? 0}/${s["credit_included"]}` : "") +
    (s["cancelled_at"] ? " · ملغى" : ""));

  section(L, "الفواتير", d.invoices, (i) =>
    `**${i["counterparty"]}** — ${i["amount"]} ${i["currency"]} · ` +
    `${i["direction"] === "incoming" ? "مستحق لك" : "عليك"} · صدرت ${day(i["issued_on"])}` +
    (i["typical_days"] ? ` · المعتاد ${count(Number(i["typical_days"]), DAY)}` : " · المعتاد غير معروف") +
    (i["paid_on"] ? ` · سُددت ${day(i["paid_on"])}` : " · مفتوحة"));

  section(L, "الرغبات", d.wants, (w) => {
    const e = d.entities.find((x) => x["id"] === w["entity_id"]);
    const why = Array.isArray(w["why_want"]) && w["why_want"].length
      ? ` — ${(w["why_want"] as string[]).join(" · ")}` : "";
    return `**${e?.["title"] ?? "—"}** (${w["state"]})` +
      (w["target_price"] ? ` · مستهدف ${w["target_price"]} ${w["currency"]}` : "") + why;
  });

  section(L, "الالتزامات", d.obligations, (o) =>
    `**${o["what"]}** (${o["kind"]}) · ${o["status"]}` +
    (o["typical_reply_days"] ? ` · المعتاد ${count(Number(o["typical_reply_days"]), DAY)}` : "") +
    (o["released_reason"] ? ` · متروك: ${o["released_reason"]}` : ""));

  section(L, "المقتنيات", d.possessions, (p) => {
    const e = d.entities.find((x) => x["id"] === p["entity_id"]);
    return `**${e?.["title"] ?? p["category"]}** — ${p["category"]}` +
      (p["condition"] ? ` · ${p["condition"]}` : "");
  });

  L.push("## ما ليس في هذا التصدير", "");
  for (const n of m.notIncluded) {
    L.push(`### ${n.what}`, "", n.why, "");
    if (n.where) L.push(`\`${n.where}\``, "");
  }

  L.push("---", "", "## الأعداد", "");
  for (const [k, v] of Object.entries(m.counts)) L.push(`- ${k}: ${v}`);
  L.push("");
  return L.join("\n");
}

function section(L: string[], title: string, rows: Row[], line: (r: Row) => string): void {
  L.push(`## ${title} (${rows.length})`, "");
  if (rows.length === 0) L.push("_لا شيء بعد._", "");
  else { for (const r of rows) L.push(`- ${line(r)}`); L.push(""); }
}

const day = (v: unknown): string =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
