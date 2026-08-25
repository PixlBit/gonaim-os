import { useState } from "react";
import { SignalCard } from "./SignalCard.js";
import { Capture } from "./Capture.js";
import { Export } from "./Export.js";
import { Known } from "./Known.js";
import { useLife, isColdStart } from "./useLife.js";
import "./tokens.css";
import "./app.css";

const BUDGET = 3;

export default function App() {
  const [blackout, setBlackout] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const { state, reload } = useLife();

  const data = state.phase === "ready" ? state.data : null;
  // Blackout يوقف كل شيء فورًا — لا "عند الحدث التالي" §30.6
  const surfaced = blackout ? [] : data?.surfaced ?? [];
  const inbox = blackout ? [] : data?.inbox ?? [];
  const below = blackout ? [] : data?.belowThreshold ?? [];
  const total = surfaced.length + inbox.length + below.length;
  const cold = data ? isColdStart(data) : false;

  return (
    <div className="shell">
      <header className="bar">
        <div className="brand"><b>GONAIM</b><span>//</span><b>OS</b></div>
        <div className="screen">Dossier</div>
        <div className="spacer" />
        <div className="state">
          <i className={`dot ${blackout ? "off" : state.phase === "ready" ? "observing" : ""}`} />
          <span className="label">
            {blackout ? "local only" : state.phase === "ready" ? "observing" : "no source"}
          </span>
        </div>
        <button className="blackout-btn"
                style={{ color: "var(--electric-yellow)", borderColor: "rgba(242,201,76,.35)" }}
                onClick={() => setCapturing(true)}>
          capture
        </button>
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
          {blackout ? "المراقبة موقوفة. البيانات المحلية فقط."
            : state.phase === "loading" ? "يقرأ…"
            : state.phase === "unavailable" ? state.message
            : cold ? "لا أعرف عنك شيئًا بعد."
            : `${surfaced.length + inbox.length} إشارة عبرت البوابة من ${total} ملاحظة`}
        </p>

        {/* بداية باردة ليست شاشة خطأ — طريق واضح للأمام */}
        {state.phase === "ready" && cold && !blackout && (
          <div className="silent">
            <strong>ابدأ بقول ما تعرفه</strong>
            اشتراكاتك، فاتورة معلّقة، رد لم ترسله، شيء تريده.
            <div style={{ marginTop: 14 }}>
              <button className="primary" onClick={() => setCapturing(true)}>افتح المدخل</button>
            </div>
          </div>
        )}

        {state.phase === "unavailable" && (
          <div className="silent">
            <strong>{state.kind === "no_database" ? "لا توجد قاعدة بيانات" : "الخادم غير متاح"}</strong>
            {state.kind === "no_database"
              ? "اضبط DATABASE_URL وشغّل npm run migrate."
              : "شغّل npm run dev:api في نافذة أخرى."}
          </div>
        )}

        {state.phase === "ready" && !cold && (
          <>
            <section className="section">
              <span className="label">يستحق انتباهك الآن</span>
              {surfaced.length > 0 ? surfaced.map((sig) => <SignalCard key={sig.id} signal={sig} />) : (
                /* الصمت حالة نجاح، لا فراغ — Expansion §6 */
                <div className="silent">
                  <strong>لا شيء يستحق مقاطعتك</strong>
                  {blackout ? "Blackout مفعّل — لا استيعاب ولا استنتاج."
                    : "النظام فحص كل المجالات وقرر الصمت."}
                </div>
              )}
            </section>

            {inbox.length > 0 && (
              <section className="section">
                <span className="label">الوارد — لا يقاطع</span>
                {inbox.map((sig) => <SignalCard key={sig.id} signal={sig} />)}
              </section>
            )}

            {below.length > 0 && (
              <section className="section">
                <span className="label">تحت عتبة الإشارة — {below.length}</span>
                {below.map((sig) => (
                  <div className="ev-row" key={sig.id}>
                    <span className="m observed">●</span>
                    <span>{sig.headline}</span>
                    <span className="tag rel">{sig.relevance.toFixed(2)}</span>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </main>

      <aside className="drawer">
        <div className="brief">
          <span className="label">handler brief</span>
          <p>
            {blackout ? "لا رؤية. الالتقاطات المحلية غير المرسلة باقية على الجهاز."
              : state.phase !== "ready" ? "لا مصدر متصل — لا شيء أُستنتج."
              : cold ? "لم أرَ شيئًا بعد. كل ما سيظهر هنا سيأتي مما تقوله أنت."
              : surfaced.find((x) => x.ruleCode === "cross.cash_window")?.whyNow
                ?? "لا تقاطع بين المجالات في هذه النافذة."}
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

        {data && !cold && (
          <div className="brief">
            <span className="label">
              <button className="linky" onClick={() => setReviewing(true)}>ما تعرفه القاعدة ↗</button>
            </span>
            <ul>
              <li>اشتراكات: {data.counts["subscriptions"] ?? 0}</li>
              <li>فواتير مفتوحة: {data.counts["invoices"] ?? 0}</li>
              <li>رغبات: {data.counts["wants"] ?? 0}</li>
              <li>التزامات: {data.counts["obligations"] ?? 0}</li>
            </ul>
          </div>
        )}

        <div className="brief">
          <span className="label">مصدر الأرقام</span>
          <ul><li>كل ما هنا مُدخَل يدويًا ومؤكَّد منك</li></ul>
        </div>

        <div className="brief">
          <span className="label">بياناتك</span>
          <button className="blackout-btn"
                  style={{ color: "var(--bone-100)", borderColor: "var(--steel-800)" }}
                  onClick={() => setExporting(true)}>
            export my mind
          </button>
        </div>
      </aside>

      {exporting && <Export onClose={() => setExporting(false)} />}
      {reviewing && <Known onClose={() => setReviewing(false)} onChanged={reload} />}
      {capturing && (
        <Capture
          today={data?.today ?? new Date().toISOString().slice(0, 10)}
          onClose={() => setCapturing(false)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
