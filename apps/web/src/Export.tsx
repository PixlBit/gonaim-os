import { useEffect, useState } from "react";
import { count, RECORD, FILE } from "@gonaim/domain";

const API = "http://localhost:8787/api";

interface Bundle {
  manifest: {
    generatedAt: string;
    owner: string;
    schemaVersion: string;
    counts: Record<string, number>;
    notIncluded: { what: string; why: string; where?: string }[];
  };
  files: { name: string; mime: string; content: string }[];
}

export function Export({ onClose }: { onClose: () => void }) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/export`);
        const body = await res.json();
        if (!res.ok) { setError(body.message ?? body.error ?? "فشل التصدير"); return; }
        setBundle(body as Bundle);
      } catch { setError("الخادم لا يستجيب."); }
    })();
  }, []);

  function download(name: string, mime: string, content: string) {
    const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
    const a = document.createElement("a");
    a.href = url; a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const total = bundle
    ? Object.values(bundle.manifest.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="capture">
      <div className="capture-head">
        <span className="label">export my mind</span>
        <button className="x" onClick={onClose} aria-label="إغلاق">✕</button>
      </div>

      {error && <div className="capture-error"><strong>لم يُصدَّر</strong><p>{error}</p></div>}

      {bundle && (
        <>
          <p className="why">
            {count(total, RECORD)} · {count(bundle.files.length, FILE)} ·
            مخطط بـ{bundle.manifest.schemaVersion.split(" · ").length} هجرات
          </p>

          <div className="review">
            <span className="label">الملفات</span>
            {bundle.files.map((f) => (
              <label className="cand" key={f.name}
                     onClick={() => download(f.name, f.mime, f.content)}
                     style={{ cursor: "pointer" }}>
                <div>
                  <div className="cand-top">
                    <span className="tag">{f.name.split(".").pop()}</span>
                    <strong className="ltr">{f.name}</strong>
                    <span className="tag rel ltr">{fmtSize(f.content)}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* أهم قسم: تصدير يوحي بالاكتمال وهو ناقص أسوأ من ناقص معلَن */}
          <div className="unresolved">
            <span className="label">ما ليس في هذا التصدير</span>
            {bundle.manifest.notIncluded.map((n, i) => (
              <div key={i} style={{ marginBottom: 9 }}>
                <div style={{ fontSize: 13 }}>{n.what}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted-400)" }}>{n.why}</div>
                {n.where && <div className="ev-row"><span className="ltr">{n.where}</span></div>}
              </div>
            ))}
          </div>

          <div className="capture-actions">
            <span className="label">التصدير نفسه فعل مسجَّل في سجل التدقيق</span>
            <button className="primary"
                    onClick={() => bundle.files.forEach((f) => download(f.name, f.mime, f.content))}>
              نزّل الكل
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const fmtSize = (s: string): string => {
  const b = new TextEncoder().encode(s).length;
  return b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`;
};
