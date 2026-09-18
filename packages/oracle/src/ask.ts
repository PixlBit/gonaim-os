import Anthropic from "@anthropic-ai/sdk";
import type { Brief } from "./brief.js";

/**
 * النداء.
 *
 * طبقة رقيقة عمدًا: تبني الرسالة، تنادي، تعيد نصًا. لا أدوات، ولا قدرة
 * على قراءة أو كتابة أي شيء في المساحة — ما يعود **اقتراح نصي** يقرؤه
 * صاحبه ويقرر. النموذج هنا ضيف لا وكيل.
 *
 * والمفتاح يعيش على الخادم وحده (ADR-0006): هذه الوحدة لا تُستورَد في
 * حزمة المتصفح أبدًا، و`npm run scan` يفشّل البناء لو ظهر مفتاح فيها.
 */

export interface OracleConfig {
  apiKey: string;
  model?: string;
  /** للاختبار — عميل بديل. */
  client?: Anthropic;
}

export interface OracleAnswer {
  text: string;
  model: string;
}

export const DEFAULT_MODEL = "claude-opus-5";

export class OracleError extends Error {
  constructor(readonly code: "no_key" | "failed" | "empty", message: string) {
    super(message);
    this.name = "OracleError";
  }
}

export async function ask(cfg: OracleConfig, brief: Brief): Promise<OracleAnswer> {
  if (!cfg.apiKey && !cfg.client) {
    throw new OracleError("no_key", "مفيش مفتاح — الطبقة دي متعطّلة.");
  }
  const model = cfg.model ?? DEFAULT_MODEL;
  const client = cfg.client ?? new Anthropic({ apiKey: cfg.apiKey });

  let response;
  try {
    response = await client.messages.create({
      model,
      max_tokens: 1200,
      // التعليمات ثابتة لكل نوع، فتُخبَّأ ولا تُعاد محاسبتها كل مرة
      system: [{ type: "text", text: brief.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: brief.text }],
    });
  } catch (err) {
    // تفصيل المزوّد لا يصل إلى المتصفح
    throw new OracleError("failed", err instanceof Error && err.message.includes("401")
      ? "المفتاح مرفوض."
      : "النموذج مردّش. جرّب تاني بعد شوية.");
  }

  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("\n")
    .trim();

  if (!text) throw new OracleError("empty", "الرد رجع فاضي.");
  return { text, model };
}
