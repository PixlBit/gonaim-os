import { useState } from "react";
import type { Candidate } from "@gonaim/intake";

const API = "http://localhost:8787/api/extract";

interface Extraction {
  candidates: Candidate[];
  unresolved: { text: string; whyUnresolved: string }[];
  rejectedCount: number;
}

type State =
  | { phase: "idle" }
  | { phase: "extracting" }
  | { phase: "review"; data: Extraction }
  /** `hint` يفرّق بين خادم غير مشغَّل وخادم مشغَّل بلا مفتاح — نصيحة خاطئة أسوأ من لا نصيحة. */
  | { phase: "error"; message: string; hint: "start_server" | "set_key" | null };

const KIND_LABEL: Record<Candidate["kind"], string> = {
  subscription: "اشتراك", invoice: "فاتورة", want: "رغبة",
  obligation: "التزام", possession: "مقتنى",
};

export function Capture({ today, onClose }: { today: string; onClose: () => void }) {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  async function run() {
    if (!text.trim()) return;
    setState({ phase: "extracting" });
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, today }),
      });
      const body = await res.json();
      if (!res.ok) {
        setState({
          phase: "error",
          message: body.message ?? body.error ?? "فشل الاستخلاص",
          hint: body.error === "no_credentials" ? "set_key" : null,
        });
        return;
      }
      setState({ phase: "review", data: body as Extraction });
      // لا شيء مقبول تلقائيًا. المراجعة فعل، لا موافقة ضمنية. ADR-0004
      setAccepted(new Set());
    } catch {
      setState({
        phase: "error",
        message: "تعذّر الوصول إلى الخادم المحلي على 8787 — إمّا أنه لا يعمل، أو أن أصل الصفحة غير مسموح به.",
        hint: "start_server",
      });
    }
  }

  const toggle = (i: number) =>
    setAccepted((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <div className="capture">
      <div className="capture-head">
        <span className="label">dead drop — قول حياتك بلغتك</span>
        <button className="x" onClick={onClose} aria-label="إغلاق">✕</button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
        placeholder="مشترك في OpenAI بـ٧٥ ريال بيتجدد ٢٧، وعندي فاتورة ٨٥٠٠ عند Studio Client من أول أغسطس، والعميل ده بيدفع عادة خلال أسبوعين…"
        rows={4}
      />

      <div className="capture-actions">
        <span className="label">Ctrl+Enter للاستخلاص</span>
        <button className="primary" onClick={run} disabled={state.phase === "extracting" || !text.trim()}>
          {state.phase === "extracting" ? "يستخلص…" : "استخلص"}
        </button>
      </div>

      {state.phase === "error" && (
        <div className="capture-error">
          <strong>المدخل غير متاح</strong>
          <p>{state.message}</p>
          {state.hint === "start_server" && (
            <p className="label">تشغيل الخادم: <span className="ltr">npm run dev -w @gonaim/api</span></p>
          )}
          {state.hint === "set_key" && (
            <p className="label">
              الخادم يعمل، لكن بلا مفتاح: <span className="ltr">export ANTHROPIC_API_KEY=…</span>
            </p>
          )}
        </div>
      )}

      {state.phase === "review" && (
        <div className="review">
          <span className="label">
            {state.data.candidates.length} مرشح — لا شيء يُحفظ قبل تأكيدك
          </span>

          {state.data.candidates.map((c, i) => (
            <label className={`cand ${accepted.has(i) ? "on" : ""}`} key={i}>
              <input type="checkbox" checked={accepted.has(i)} onChange={() => toggle(i)} />
              <div>
                <div className="cand-top">
                  <span className="tag">{KIND_LABEL[c.kind]}</span>
                  <strong>{"title" in c ? c.title : c.what}</strong>
                  <span className="tag rel">{c.confidence.toFixed(2)}</span>
                </div>
                {/* النص الذي أنتج هذه الحقيقة — بوابة ربط المصدر مرئية */}
                <div className="cand-ev">من كلامك: «{c.evidenceText}»</div>
              </div>
            </label>
          ))}

          {state.data.unresolved.length > 0 && (
            <div className="unresolved">
              <span className="label">لم يُحسم — {state.data.unresolved.length}</span>
              {state.data.unresolved.map((u, i) => (
                <div className="ev-row" key={i}>
                  <span className="m inferred">◇</span>
                  <span>{u.text || "—"} · {u.whyUnresolved}</span>
                </div>
              ))}
            </div>
          )}

          <div className="capture-actions">
            <span className="label">
              {state.data.rejectedCount > 0 && `${state.data.rejectedCount} مرشح رُفض لعدم استناده لنصك`}
            </span>
            <button className="primary" disabled={accepted.size === 0}>
              احفظ {accepted.size} مؤكَّدًا
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
