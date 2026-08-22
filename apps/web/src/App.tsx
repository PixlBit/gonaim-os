import { useMemo, useState } from "react";
import { ALL_RULES, runRules } from "@gonaim/rules";
import { snapshot } from "./seed.js";
import { SignalCard } from "./SignalCard.js";
import { Capture } from "./Capture.js";
import "./tokens.css";
import "./app.css";

const BUDGET = 3;

export default function App() {
  const [blackout, setBlackout] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [seen] = useState<ReadonlySet<string>>(new Set());
  const [capturing, setCapturing] = useState(false);

  const result = useMemo(
    () => runRules(ALL_RULES, { snapshot, alreadySurfaced: seen },
                   { interruptionBudget: BUDGET, quietHours: quiet }),
    [quiet, seen],
  );

  // Blackout يوقف كل شيء فورًا — لا "عند الحدث التالي" §30.6
  const surfaced = blackout ? [] : result.surfaced;
  const inbox = blackout ? [] : result.inbox;
  const spent = BUDGET - result.budgetRemaining;

  return (
    <div className="shell">
      <header className="bar">
        <div className="brand"><b>GONAIM</b><span>//</span><b>OS</b></div>
        <div className="screen">Dossier</div>
        <div className="spacer" />
        <div className="state">
          <i className={`dot ${blackout ? "off" : "observing"}`} />
          <span className="label">{blackout ? "local only" : "observing"}</span>
        </div>
        <button className="blackout-btn"
                style={{ color: "var(--electric-yellow)", borderColor: "rgba(242,201,76,.35)" }}
                onClick={() => setCapturing(true)}>
          capture
        </button>
        <span className="label mono">09:42:17</span>
        <button
          className={`blackout-btn ${blackout ? "armed" : ""}`}
          onClick={() => setBlackout((b) => !b)}
        >
          {blackout ? "blackout active" : "blackout"}
        </button>
      </header>

      <nav className="rail">
        {["◫", "◈", "▤", "◉", "⌸", "⚙"].map((g, i) => (
          <button key={g} aria-current={i === 0} aria-label={`world-${i}`}>{g}</button>
        ))}
      </nav>

      <main className="stage">
        <h1>أحمد غنيم</h1>
        <p className="sub">
          {blackout
            ? "المراقبة موقوفة. البيانات المحلية فقط."
            : `${surfaced.length + inbox.length} إشارة عبرت البوابة من ${
                surfaced.length + inbox.length + result.belowThreshold.length} ملاحظة`}
        </p>

        <section className="section">
          <span className="label">يستحق انتباهك الآن</span>
          {surfaced.length > 0 ? (
            surfaced.map((s) => <SignalCard key={s.id} signal={s} />)
          ) : (
            /* الصمت حالة نجاح، لا فراغ — Expansion §6 */
            <div className="silent">
              <strong>لا شيء يستحق مقاطعتك</strong>
              {blackout
                ? "Blackout مفعّل — لا استيعاب ولا استنتاج."
                : quiet
                  ? "ساعات هدوء. كل شيء انتقل إلى الوارد."
                  : "النظام فحص كل المجالات وقرر الصمت."}
            </div>
          )}
        </section>

        {inbox.length > 0 && (
          <section className="section">
            <span className="label">الوارد — لا يقاطع</span>
            {inbox.map((s) => <SignalCard key={s.id} signal={s} />)}
          </section>
        )}

        {/* الشفافية عن الصمت جزء من الثقة */}
        {!blackout && result.belowThreshold.length > 0 && (
          <section className="section">
            <span className="label">تحت عتبة الإشارة — {result.belowThreshold.length}</span>
            {result.belowThreshold.map((s) => (
              <div className="ev-row" key={s.id}>
                <span className="m observed">●</span>
                <span>{s.headline}</span>
                <span className="tag rel">{s.relevance.toFixed(2)}</span>
              </div>
            ))}
          </section>
        )}
      </main>

      <aside className="drawer">
        <div className="brief">
          <span className="label">handler brief</span>
          <p>
            {blackout
              ? "لا رؤية. الالتقاطات المحلية غير المرسلة باقية على الجهاز."
              : "ثلاثة مجالات تتقاطع في نفس النافذة الزمنية: اشتراكات تتجدد، مستحق متأخر عن معتاد عميله، ورغبة نزل سعرها."}
          </p>
        </div>

        <div className="brief">
          <span className="label">ما لم أصل إليه</span>
          <ul className="not-accessed">
            <li>محتوى الرسائل الخاصة</li>
            <li>الحساب البنكي</li>
            <li>ما يُكتب أثناء الكتابة</li>
            <li>أي مجلد خارج القائمة المسموحة</li>
          </ul>
        </div>

        <div className="brief">
          <span className="label">مصدر الأرقام</span>
          <ul>
            <li>الاشتراكات: إدخال يدوي · كشف حساب</li>
            <li>الفاتورة: بريد بعنوان محدد</li>
            <li>الأسعار: صفحات مثبتة</li>
          </ul>
        </div>

        <div className="brief">
          <span className="label">ميزانية المقاطعة</span>
          <div className="budget">
            {Array.from({ length: BUDGET }, (_, i) => (
              <i key={i} className={i < spent ? "spent" : ""} />
            ))}
          </div>
          <p className="label" style={{ marginTop: 6 }}>
            {spent} / {BUDGET} مصروفة اليوم
          </p>
        </div>

        <div className="brief">
          <span className="label">ساعات الهدوء</span>
          <button className="blackout-btn" style={{ color: "var(--signal-cyan)", borderColor: "rgba(56,215,223,.3)" }}
                  onClick={() => setQuiet((q) => !q)}>
            {quiet ? "quiet on" : "quiet off"}
          </button>
        </div>
      </aside>

      {capturing && <Capture today={snapshot.today} onClose={() => setCapturing(false)} />}
    </div>
  );
}
