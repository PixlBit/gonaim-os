import { useEffect, useState } from "react";
import { useApp } from "./store.js";
import { useTongue, useDocumentLang } from "./lang.js";
import { Gate } from "./screens/Gate.js";
import { Pulse } from "./screens/Pulse.js";
import { Plan } from "./screens/Plan.js";
import { Nest } from "./screens/Nest.js";
import { Money } from "./screens/Money.js";
import { Signal } from "./screens/Signal.js";
import { Dates } from "./screens/Dates.js";
import { Memories } from "./screens/Memories.js";
import { Us } from "./screens/Us.js";
import { Patterns } from "./screens/Patterns.js";
import { Settings } from "./screens/Settings.js";

/**
 * الهيكل.
 *
 * تسع شاشات على شريط واحد. التوجيه بالـhash لا بمكتبة: تحديث الصفحة يبقي
 * مكانك، وزر الرجوع يعمل، والحزمة لا تحمل راوترًا كاملًا لتسعة أسماء.
 */

export type ScreenId =
  | "pulse" | "plan" | "nest" | "money" | "signal"
  | "dates" | "memories" | "us" | "persona" | "settings";

/**
 * الأسماء اختيار، لا ترجمة.
 *
 * «الفلوس» صارت **الميزان**: الشاشة لا تعدّ نقودًا، بل تزن الداخل بالخارج
 * والمتوقَّع بالميزانية — و«الميزان» في العربية يحمل المعنيين معًا، كفّة
 * وحسابًا. و«التحليل» صارت **المرصد**: التحليل فعل يُطلب، والمرصد مكان
 * يعمل وأنت نائم — وهذا وصف الشاشة بدقة، فهي تقيس الإيقاع بلا أن تُسأل.
 * و«الإعدادات» صارت **الضبط**: أقصر، وعربية أصيلة، وتتّسع في الشريط بلا
 * قصّ.
 *
 * وما بقي بقي: «النبض» و«العش» و«إحنا» لا يُحسَّن عليها.
 */
const SCREENS: Array<{ id: ScreenId; glyph: string; ar: string; en: string }> = [
  { id: "pulse",    glyph: "✦", ar: "النبض",    en: "Pulse" },
  { id: "plan",     glyph: "◫", ar: "الخطة",    en: "Plan" },
  { id: "nest",     glyph: "⌂", ar: "العش",     en: "Nest" },
  { id: "money",    glyph: "◈", ar: "الميزان",  en: "Ledger" },
  { id: "signal",   glyph: "◉", ar: "المرصد",   en: "Signal" },
  { id: "dates",    glyph: "◷", ar: "المواعيد", en: "Dates" },
  { id: "memories", glyph: "❖", ar: "الذكريات", en: "Memories" },
  { id: "us",       glyph: "♥", ar: "إحنا",     en: "Us" },
  { id: "persona",  glyph: "◐", ar: "الأنماط",  en: "Patterns" },
  { id: "settings", glyph: "⚙", ar: "الضبط",    en: "Config" },
];

function useHashScreen(): [ScreenId, (id: ScreenId) => void] {
  const read = (): ScreenId => {
    const raw = window.location.hash.replace("#", "") as ScreenId;
    return SCREENS.some((s) => s.id === raw) ? raw : "pulse";
  };
  const [id, setId] = useState<ScreenId>(read);
  useEffect(() => {
    const onHash = () => setId(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return [id, (next) => { window.location.hash = next; setId(next); }];
}

export function App() {
  const { phase, busy, problem, clearProblem, signOut } = useApp();
  const [screen, go] = useHashScreen();
  const { lang, t } = useTongue();
  useDocumentLang(lang);

  const sky = (
    <>
      <div className="sky" />
      <div className="grid-floor" />
      <div className="grain" />
    </>
  );

  if (phase.kind === "loading") {
    return <>{sky}<div className="gate"><div className="label">{t("بيفتح…", "Opening…")}</div></div></>;
  }

  if (phase.kind === "gate") return <>{sky}<Gate note={phase.note} /></>;

  if (phase.kind === "blank" || phase.kind === "down") {
    return (
      <>{sky}
        <div className="gate">
          <div className="panel hot box" style={{ padding: 28, maxWidth: 440, textAlign: "center" }}>
            <div className="logo" lang="en" style={{ fontSize: 24 }}>EHNA//OS</div>
            <p style={{ color: "var(--muted)", marginTop: 14 }}>{phase.message}</p>
            <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => window.location.reload()}>
              {t("جرّب تاني", "Try again")}
            </button>
          </div>
        </div>
      </>
    );
  }

  const { state } = phase;
  const you = state.space.people[state.me];
  const urgent = state.report.attention.some((a) => a.level === "now");
  const waiting = state.report.life.unreadForMe + state.report.life.capsuleReady
    + state.report.life.openDecisions;

  const current = SCREENS.find((s) => s.id === screen) ?? SCREENS[0]!;

  return (
    <>
      {sky}
      <div className="shell">
        <nav className="rail">
          <div className="brand"><b>{t("إحنا", "EHNA")}</b><span className="os" lang="en">EHNA//OS</span></div>
          {SCREENS.map((s) => (
            <button
              key={s.id}
              aria-current={s.id === screen}
              onClick={() => go(s.id)}
              title={lang === "ar" ? s.ar : s.en}
            >
              <i>{s.glyph}</i>
              <span>{lang === "ar" ? s.ar : s.en}</span>
              {((s.id === "pulse" && urgent) || (s.id === "us" && waiting > 0)) && <em className="pip" />}
            </button>
          ))}
        </nav>

        <div className="main">
          <header className="topbar">
            {/* اللغة الأخرى عمدًا: الشريط الجانبي كتب اسم الشاشة بلغتك، فلا
                معنى لتكراره هنا — وهذا السطر يبقي المساحة ثنائية في العين. */}
            <div className="screen-name" lang={lang === "ar" ? "en" : "ar"}>
              {lang === "ar" ? current.en : current.ar}
            </div>
            <div className="spacer" />
            {problem && (
              <button className="chip bad" onClick={clearProblem} title={t("اضغط عشان تخفيه", "Tap to dismiss")}>
                {problem}
              </button>
            )}
            <div className="who">
              <i className="dotcolor" style={{ color: you.accent }} />
              {you.name}
            </div>
            <i className={`beat${busy ? " busy" : ""}`} title={busy ? t("بيتحفظ", "Saving") : t("متصل", "Connected")} />
            <button className="iconbtn" onClick={() => void signOut()} title={t("اقفل الجلسة", "Sign out")}>⏻</button>
          </header>

          <main className="stage">
            <div className="wrap" key={screen}>
              {screen === "pulse" && <Pulse go={go} />}
              {screen === "plan" && <Plan />}
              {screen === "nest" && <Nest />}
              {screen === "money" && <Money />}
              {screen === "signal" && <Signal />}
              {screen === "dates" && <Dates />}
              {screen === "memories" && <Memories />}
              {screen === "us" && <Us />}
              {screen === "persona" && <Patterns />}
              {screen === "settings" && <Settings />}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
