import { useEffect, useState } from "react";
import { count, ITEM, MEMORY, LINK } from "@gonaim/domain";

const API = "http://localhost:8787/api";

interface Known {
  id: string; type: string; title: string;
  sensitivity: string; source_uri: string | null; created_at: string;
}

interface Receipt {
  deleted: Record<string, number>;
  retained: { what: string; count: number; why: string }[];
  externalRemnants: { what: string; where: string; action: string }[];
  complete: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  subscription: "اشتراك", invoice: "فاتورة", want: "رغبة",
  obligation: "التزام", possession: "مقتنى", person: "شخص",
};

export function Known({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [items, setItems] = useState<Known[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const res = await fetch(`${API}/known`);
      const body = await res.json();
      if (!res.ok) { setError(body.message ?? body.error); return; }
      setItems(body.entities as Known[]);
    } catch { setError("الخادم لا يستجيب."); }
  }

  async function doForget() {
    if (picked.size === 0) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/forget`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ entityIds: [...picked], reason: "طلب المالك" }),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.message ?? body.error ?? "فشل الحذف"); return; }
      setReceipt(body as Receipt);
      setPicked(new Set());
      await load();
      onChanged();
    } catch { setError("تعذّر الوصول إلى الخادم."); }
    finally { setBusy(false); }
  }

  const toggle = (id: string) => setPicked((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div className="capture">
      <div className="capture-head">
        <span className="label">ما تعرفه القاعدة عنك</span>
        <button className="x" onClick={onClose} aria-label="إغلاق">✕</button>
      </div>

      {error && <div className="capture-error"><strong>خطأ</strong><p>{error}</p></div>}

      {receipt && (
        <div className={`receipt ${receipt.complete ? "clean" : ""}`}>
          {/* §23.4: ممنوع عرض "نُسي" إذا بقي أثر مشتق */}
          <strong>{receipt.complete ? "نُسي بالكامل" : "حُذف — مع بقايا معلَنة"}</strong>

          <div className="ev-row">
            <span className="m observed">●</span>
            <span>
              حُذف: {count(receipt.deleted["entities"] ?? 0, ITEM)} ·
              {" "}{count(receipt.deleted["memories"] ?? 0, MEMORY)} ·
              {" "}{count(receipt.deleted["relations"] ?? 0, LINK)}
            </span>
          </div>

          {receipt.retained.map((r, i) => (
            <div key={i} style={{ marginTop: 9 }}>
              <div style={{ fontSize: 13, color: "var(--electric-yellow)" }}>
                بقي: {r.what} ({r.count})
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted-400)" }}>{r.why}</div>
            </div>
          ))}

          {receipt.externalRemnants.map((r, i) => (
            <div key={i} style={{ marginTop: 9 }}>
              <div style={{ fontSize: 13, color: "var(--alert-red)" }}>خارج قدرتنا: {r.what}</div>
              <div className="ev-row"><span className="ltr">{r.where}</span></div>
              <div style={{ fontSize: 12.5, color: "var(--muted-400)" }}>{r.action}</div>
            </div>
          ))}
        </div>
      )}

      {items && items.length === 0 && !receipt && (
        <div className="silent"><strong>لا شيء</strong>القاعدة فارغة.</div>
      )}

      {items && items.length > 0 && (
        <div className="review">
          <span className="label">{count(items.length, ITEM)} — اختر ما تريد نسيانه</span>
          {items.map((e) => (
            <label className={`cand ${picked.has(e.id) ? "danger" : ""}`} key={e.id}>
              <input type="checkbox" checked={picked.has(e.id)} onChange={() => toggle(e.id)} />
              <div>
                <div className="cand-top">
                  <span className="tag">{TYPE_LABEL[e.type] ?? e.type}</span>
                  <strong>{e.title}</strong>
                  {e.sensitivity === "sensitive" && <span className="tag" style={{ color: "var(--alert-red)" }}>حساس</span>}
                </div>
                {e.source_uri && (
                  <div className="cand-ev">
                    أصله خارجي — الحذف هنا لا يمسّه: <span className="ltr">{e.source_uri}</span>
                  </div>
                )}
              </div>
            </label>
          ))}

          <div className="capture-actions">
            <span className="label">الحذف فعل مسجَّل ولا يُتراجع عنه</span>
            <button className="primary danger" onClick={doForget} disabled={picked.size === 0 || busy}>
              {busy ? "يحذف…" : `انسَ ${picked.size}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
