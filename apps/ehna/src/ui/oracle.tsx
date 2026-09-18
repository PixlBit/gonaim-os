import { useState } from "react";
import { api, type ApiError, type Brief, type OracleKind } from "../api.js";
import { useSpace } from "../store.js";

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

const HINTS: Record<OracleKind, string> = {
  letter: "بياخد سجل آخر شهر ويكتب منه رسالة قصيرة تتقري بعد سنين.",
  advice: "بيقرا الفروق اللي كتبتوها عن نفسكم + الأرقام، ويطلع بـ٣ خطوات.",
  gift: "بيقرا ملف الطرف التاني وقايمة حاجاته، ويقترح أفكار.",
  week: "بيرتب الأسبوع الجاي من المهام والمواعيد المكتوبة.",
  story: "بيحوّل الذكرى لحكاية قصيرة من تفاصيلها هي بس.",
};

export function Oracle({ kind, targetId, title }: {
  kind: OracleKind; targetId?: string; title?: string;
}) {
  const { features, act, busy } = useSpace();
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
      if (res.offline && features.oracle) setNote("النموذج مردّش — دي الوقايع زي ما هي.");
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
        <span className="label">{title ?? "طبقة اختيارية"}</span>
        <span className={`chip ${features.oracle ? "on" : ""}`}>
          {features.oracle ? "شغّالة" : "مقفولة — بترجّع الوقايع بس"}
        </span>
      </div>
      <p className="hint">{HINTS[kind]}</p>

      <div className="row" style={{ gap: 8 }}>
        <button className="btn ghost" disabled={working} onClick={() => void preview()}>
          شوف اللي هيتبعت
        </button>
        <button className="btn primary" disabled={working} onClick={() => void send()}>
          {working ? "…" : features.oracle ? "ابعت" : "اعرض الوقايع"}
        </button>
      </div>

      {note && <div className="err" style={{ color: "var(--amber)", borderColor: "rgba(251,191,36,.35)", background: "rgba(251,191,36,.06)" }}>{note}</div>}

      {brief && !text && (
        <div className="brief-box">
          <span className="label">التعليمات</span>
          <pre>{brief.system}</pre>
          <span className="label">الوقايع اللي بتتبعت</span>
          <pre>{brief.text}</pre>
          <span className="label">اللي عمره ما بيتبعت</span>
          <ul>{brief.withheld.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}

      {text && (
        <div className="oracle-out">
          <div className="text">{text}</div>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn ghost tiny" onClick={() => { setText(null); setBrief(null); }}>
              امسحها
            </button>
            <button className="btn ghost tiny" disabled={busy || saved} onClick={() => void keep()}>
              {saved ? "اتحفظت في «بينا»" : "احفظها كرسالة"}
            </button>
            {brief && (
              <button className="btn ghost tiny" onClick={() => setText(null)}>
                رجّعني لللي اتبعت
              </button>
            )}
            <span className="label" style={{ alignSelf: "center" }}>
              {isOffline ? "صيغة حتمية — بلا نموذج" : "اقتراح — مش محفوظ لحد ما تحفظه"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
