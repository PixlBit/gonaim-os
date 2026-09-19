import { useState } from "react";
import { api, type ApiError, type Brief, type OracleKind } from "../api.js";
import type { Text } from "@gonaim/couple";
import { useSpace } from "../store.js";
import { useTongue } from "../lang.js";

/**
 * الطبقة الاختيارية.
 *
 * ثلاث قواعد تحكم هذه اللوحة، وهي ما يجعلها مقبولة في مساحة خاصة:
 *
 *  1. **تشوف قبل ما تبعت.** الزر الأول يبني النص ويعرضه كاملًا — تعليمات
 *     ووقائع — بلا نداء خارجي. الإرسال قرار ثانٍ منفصل.
 *  2. **الناتج اقتراح.** لا يُحفظ في المساحة إلا لو ضغطت "احفظها"،
 *     وساعتها يُحفظ كرسالة بخطك أنت لا ككلام النظام.
 *  3. **من غير مفتاح الشاشة شغّالة.** الزر يرجع نفس الوقائع مرتبة، ومكتوب
 *     عليها إنها حتمية. الطبقة دي زيادة، مش شرط.
 */

const HINTS: Record<OracleKind, Text> = {
  letter: { ar: "بياخد سجل آخر شهر ويكتب منه رسالة قصيرة تتقري بعد سنين.",
            en: "Takes the last month's log and writes a short letter to be read years from now." },
  advice: { ar: "بيقرا الفروق اللي كتبتوها عن نفسكم + الأرقام، ويطلع بـ٣ خطوات.",
            en: "Reads the differences you declared plus the numbers, and returns three steps." },
  gift:   { ar: "بيقرا ملف الطرف التاني وقايمة حاجاته، ويقترح أفكار.",
            en: "Reads the other's profile and their list, and suggests ideas." },
  week:   { ar: "بيرتب الأسبوع الجاي من المهام والمواعيد المكتوبة.",
            en: "Orders the week ahead from the tasks and appointments already written." },
  story:  { ar: "بيحوّل الذكرى لحكاية قصيرة من تفاصيلها هي بس.",
            en: "Turns a memory into a short story, from its own details only." },
};

export function Oracle({ kind, targetId, title }: {
  kind: OracleKind; targetId?: string; title?: string;
}) {
  const { features, act, busy } = useSpace();
  const { t, s } = useTongue();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [isOffline, setOffline] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [saved, setSaved] = useState(false);

  async function preview() {
    setWorking(true); setNote(null);
    try {
      const res = await api.brief(kind, targetId);
      setBrief(res.brief);
    } catch (err) { setNote((err as ApiError).message); }
    finally { setWorking(false); }
  }

  async function send() {
    setWorking(true); setNote(null); setSaved(false);
    try {
      const res = await api.oracle(kind, targetId);
      setText(res.text);
      setOffline(Boolean(res.offline));
      setBrief(res.brief);
      if (res.offline && features.oracle) setNote(t("النموذج مردّش — دي الوقايع زي ما هي.", "The model did not answer — these are the facts as they are."));
    } catch (err) { setNote((err as ApiError).message); }
    finally { setWorking(false); }
  }

  async function keep() {
    if (!text) return;
    const ok = await act({ type: "note.send", body: text });
    if (ok) setSaved(true);
  }

  return (
    <div className="panel oracle">
      <div className="oracle-head">
        <span className="label">{title ?? t("طبقة اختيارية", "Optional layer")}</span>
        <span className={`chip ${features.oracle ? "on" : ""}`}>
          {features.oracle ? t("شغّالة", "on") : t("مقفولة — بترجّع الوقايع بس", "off — facts only")}
        </span>
      </div>
      <p className="hint">{s(HINTS[kind])}</p>

      <div className="row" style={{ gap: 8 }}>
        <button className="btn ghost" disabled={working} onClick={() => void preview()}>
          {t("شوف اللي هيتبعت", "See what would be sent")}
        </button>
        <button className="btn primary" disabled={working} onClick={() => void send()}>
          {working ? "…" : features.oracle ? t("ابعت", "Send") : t("اعرض الوقايع", "Show the facts")}
        </button>
      </div>

      {note && <div className="err" style={{ color: "var(--amber)", borderColor: "rgba(251,191,36,.35)", background: "rgba(251,191,36,.06)" }}>{note}</div>}

      {brief && !text && (
        <div className="brief-box">
          <span className="label">{t("التعليمات", "The instructions")}</span>
          <pre>{brief.system}</pre>
          <span className="label">{t("الوقايع اللي بتتبعت", "The facts that would be sent")}</span>
          <pre>{brief.text}</pre>
          <span className="label">{t("اللي عمره ما بيتبعت", "What is never sent")}</span>
          <ul>{brief.withheld.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}

      {text && (
        <div className="oracle-out">
          <div className="text">{text}</div>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn ghost tiny" onClick={() => { setText(null); setBrief(null); }}>
              {t("امسحها", "Discard")}
            </button>
            <button className="btn ghost tiny" disabled={busy || saved} onClick={() => void keep()}>
              {saved ? t("اتحفظت في «بينا»", "Saved to “Between us”") : t("احفظها كرسالة", "Save it as a note")}
            </button>
            {brief && (
              <button className="btn ghost tiny" onClick={() => setText(null)}>
                {t("رجّعني لللي اتبعت", "Back to what was sent")}
              </button>
            )}
            <span className="label" style={{ alignSelf: "center" }}>
              {isOffline
                ? t("صيغة حتمية — بلا نموذج", "Deterministic — no model involved")
                : t("اقتراح — مش محفوظ لحد ما تحفظه", "A suggestion — not saved until you save it")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
