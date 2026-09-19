import { useEffect, useRef, useState } from "react";
import { useApp } from "../store.js";
import type { ApiError } from "../api.js";
import { useTongue } from "../lang.js";

/**
 * الباب.
 *
 * لا يقول شيئًا عمّن بالداخل: لا أسماء ولا صور ولا "أهلًا يا …". من يفتح
 * الرابط بالصدفة يجب أن يرى بابًا مغلقًا، لا بطاقة تعريف باثنين. الكرتان
 * المضيئتان زينة لا معلومة.
 *
 * المعرّف وحده يُحفظ في هذا المتصفح بعد أول دخول ناجح — تسهيل على صاحب
 * الجهاز، وهو أصلًا يعرف معرّفه.
 */

const REMEMBER = "ehna.handle";

export function Gate({ note }: { note?: string | undefined }) {
  const { signIn, busy } = useApp();
  const { t } = useTongue();
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(note ?? null);
  const pw = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER);
      if (saved) { setHandle(saved); pw.current?.focus(); }
    } catch { /* متصفح يمنع التخزين — الحقل يبقى فاضي فقط */ }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signIn(handle, password);
      try { localStorage.setItem(REMEMBER, handle.trim().toLowerCase()); } catch { /* لا يضر */ }
    } catch (err) {
      setPassword("");
      setError((err as ApiError).message);
      pw.current?.focus();
    }
  }

  return (
    <div className="gate">
      <div className="panel hot box rise">
        <div className="logo" lang="en">EHNA//OS</div>
        <div className="tag">{t("مساحة خاصة · لاتنين بس", "A private space · for two, only")}</div>

        <div className="pair" aria-hidden="true">
          <div className="gate-orb him"><span className="orb" /></div>
          <div className="gate-orb her"><span className="orb" /></div>
        </div>

        <form onSubmit={(e) => void submit(e)}>
          <label className="field">
            <span>{t("المعرّف", "Handle")}</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              autoComplete="username"
              spellCheck={false}
              dir="ltr"
              required
            />
          </label>
          <label className="field">
            <span>{t("كلمة السر", "Password")}</span>
            <input
              ref={pw}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              dir="ltr"
              required
            />
          </label>

          {error && <div className="err">{error}</div>}

          <button className="btn primary" style={{ width: "100%", marginTop: 14 }} disabled={busy}>
            {busy ? t("بيفتح…", "Opening…") : t("ادخل", "Enter")}
          </button>
        </form>

        <div className="foot">
          {t("مفيش تسجيل هنا. الحسابان اتعملا مرة واحدة من الخادم،",
             "There is no sign-up here. The two accounts were made once, from the server,")}
          <br />
          {t("ومفيش طريق تالت للدخول.", "and there is no third way in.")}
        </div>
      </div>
    </div>
  );
}
