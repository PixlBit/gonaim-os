import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ExtractionResult } from "./schema.js";
import { prepass, type Prepass } from "./prepass.js";
import { normalizeText } from "./normalize.js";
import { redact, assertClean, type Redaction } from "@gonaim/security";

/**
 * التعليمات ثابتة عبر كل الطلبات — توضع في بادئة مخبأة.
 * أي بايت متغيّر هنا يُبطل الـcache لكل ما بعده، فالتاريخ والنص
 * يذهبان في رسالة المستخدم، لا هنا.
 */
const SYSTEM = `أنت طبقة الاستخلاص في GONAIM//OS. مهمتك تحويل كلام المالك عن حياته إلى مرشحين منظّمين.

قواعد ملزمة:

1. لا تستخلص إلا ما قيل. لا تكمل الناقص من المعقول.
2. كل مرشح يحمل evidenceText: المقطع الحرفي من النص الذي أنتجه، منسوخًا بلا تعديل.
   لو لم تجد مقطعًا يسند المعلومة، لا تُنشئ المرشح.
3. الأرقام والتواريخ تأتي من التلميحات المحسوبة مسبقًا. لو تعارض فهمك معها، اتبع التلميح.
4. المدة المعتادة (typicalDays / typicalReplyDays) لا تُخمَّن أبدًا. لو لم يذكرها المالك، اتركها null.
   عتبة عامة مخترعة تُنتج تنبيهات مزعجة لاحقًا.
5. ما فهمته لكن لم تستطع تصنيفه أو نقصته معلومة يذهب إلى unresolved مع سبب واضح.
   إعلان الفجوة أفضل من ملئها.
6. confidence يعكس يقينك في هذا المرشح تحديدًا، لا في النص كله.
7. لا تُنشئ مرشحًا عن شخص آخر إلا بصفته طرفًا في التزام أو فاتورة تخص المالك.`;

export interface ExtractOptions {
  today: string;
  client?: Anthropic;
  model?: string;
}

export interface ExtractOutcome {
  result: ExtractionResult;
  prepass: Prepass;
  /** مرشحون رُفضوا لأن نصهم الشاهد غير موجود في كلام المالك. */
  rejected: { candidate: unknown; reason: string }[];
  /** ما نُقِّح قبل الإرسال. يُعرض للمالك: ما رآه النموذج ليس كل ما كتب. */
  redactions: Redaction[];
}

export async function extract(rawText: string, opts: ExtractOptions): Promise<ExtractOutcome> {
  // التنقيح أولًا. ما يُنقَّح لا يصل إلى النموذج، ولا إلى الـprepass، ولا
  // إلى أي مقارنة لاحقة — فالنص المنقّح هو النص الوحيد من هنا فصاعدًا.
  const safe = redact(rawText);
  // الطبقة الثانية (ADR-0006): تأكيد قبل الحد الخارجي. تحمي من مسار جديد
  // يستدعي extract بنص سبق أن مر بعميل قديم أو بتنقيح ناقص.
  assertClean(safe.text);

  const pre = prepass(safe.text, opts.today);
  const client = opts.client ?? new Anthropic();

  const response = await client.messages.parse({
    model: opts.model ?? "claude-opus-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    // البادئة الثابتة فقط تُخبَّأ. النص واليوم متغيران ويأتيان بعدها.
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildUserMessage(safe.text, pre, opts.today) }],
    output_config: { format: zodOutputFormat(ExtractionResult) },
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    return { result: { candidates: [], unresolved: [] }, prepass: pre, rejected: [], redactions: safe.redactions };
  }
  return { ...enforceSourceBinding(parsed, pre.normalized), prepass: pre, redactions: safe.redactions };
}

export function buildUserMessage(_safeText: string, pre: Prepass, today: string): string {
  const money = pre.money.length
    ? pre.money.map((m) => `  "${m.text}" → ${m.amount} ${m.currency}`).join("\n")
    : "  (لا مبالغ مرصودة)";
  const dates = pre.dates.length
    ? pre.dates.map((d) => `  "${d.text}" → ${d.iso}${d.kind === "day_only" ? "  [يوم بلا شهر — تخمين يحتاج تأكيدًا]" : ""}`).join("\n")
    : "  (لا تواريخ مرصودة)";

  return `اليوم: ${today}

مبالغ محسوبة مسبقًا (اتبعها حرفيًا):
${money}

تواريخ محسوبة مسبقًا (اتبعها حرفيًا):
${dates}

نص المالك (بعد التطبيع والتنقيح):
"""
${pre.normalized}
"""

ما ظهر كـ[REDACTED_…] أو [PERSON_…] منقّح عمدًا. عامله كقيمة معتمة موجودة،
ولا تحاول تخمين ما تحته.`;
}

/**
 * البوابة الثانية من ADR-0004، مفروضة في الكود لا في التعليمات.
 *
 * النموذج قد يكتب evidenceText معقولًا لم يُقَل. نتحقق أن المقطع موجود
 * فعلًا في نص المالك — فلا تدخل حقيقة مصدرها النموذج نفسه.
 */
export function enforceSourceBinding(
  result: ExtractionResult,
  normalizedSource: string,
): { result: ExtractionResult; rejected: { candidate: unknown; reason: string }[] } {
  // نطبّع الطرفين: النموذج يرى النص المطبَّع والأصل معًا، وقد يقتبس من أيهما.
  // مقارنة خام ترفض مرشحًا سليمًا لمجرد اختلاف كشيدة أو مسافة — رفض كاذب
  // أسوأ من قبول، لأنه يُسقط حقيقة قالها المالك فعلًا.
  const haystack = normalizeText(normalizedSource).toLowerCase();
  const kept: ExtractionResult["candidates"] = [];
  const rejected: { candidate: unknown; reason: string }[] = [];

  for (const c of result.candidates) {
    const needle = normalizeText(c.evidenceText).toLowerCase();
    if (needle.length === 0) {
      rejected.push({ candidate: c, reason: "بلا نص شاهد" });
      continue;
    }
    if (!haystack.includes(needle)) {
      rejected.push({ candidate: c, reason: `النص الشاهد غير موجود في كلام المالك: "${c.evidenceText}"` });
      continue;
    }
    kept.push(c);
  }

  return {
    result: {
      candidates: kept,
      // ما رُفض لا يختفي — يظهر كفجوة معلنة
      unresolved: [
        ...result.unresolved,
        ...rejected.map((r) => ({
          text: String((r.candidate as { evidenceText?: string }).evidenceText ?? ""),
          whyUnresolved: r.reason,
        })),
      ],
    },
    rejected,
  };
}
