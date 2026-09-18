import { useEffect, useState } from "react";
import { useApp } from "./store.js";
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

const SCREENS: Array<{ id: ScreenId; glyph: string; name: string; title: string }> = [
  { id: "pulse",    glyph: "✦", name: "النبض",     title: "Pulse" },
  { id: "plan",     glyph: "◫", name: "الخطة",     title: "Plan" },
  { id: "nest",     glyph: "⌂", name: "العش",      title: "Nest" },
  { id: "money",    glyph: "◈", name: "الفلوس",    title: "Ledger" },
  { id: "signal",   glyph: "◉", name: "التحليل",   title: "Signal" },
  { id: "dates",    glyph: "◷", name: "المواعيد",  title: "Dates" },
  { id: "memories", glyph: "❖", name: "الذكريات",  title: "Memory" },
  { id: "us",       glyph: "♥", name: "إحنا",      title: "Us" },
  { id: "persona",  glyph: "◐", name: "الأنماط",   title: "Patterns" },
  { id: "settings", glyph: "⚙", name: "الإعدادات", title: "Config" },
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

  const sky = (
    <>
      <div className="sky" />
      <div className="grid-floor" />
      <div className="grain" />
    </>
  );

  if (phase.kind === "loading") {
    return <>{sky}<div className="gate"><div className="label">بيفتح…</div></div></>;
  }

  if (phase.kind === "gate") return <>{sky}<Gate note={phase.note} /></>;

  if (phase.kind === "blank" || phase.kind === "down") {
    return (
      <>{sky}
        <div className="gate">
          <div className="panel hot box" style={{ padding: 28, maxWidth: 440, textAlign: "center" }}>
            <div className="logo" style={{ fontSize: 24 }}>EHNA//OS</div>
            <p style={{ color: "var(--muted)", marginTop: 14 }}>{phase.message}</p>
            <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => window.location.reload()}>
              جرّب تاني
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
          <div className="brand"><b>إحنا</b>EHNA//OS</div>
          {SCREENS.map((s) => (
            <button
              key={s.id}
              aria-current={s.id === screen}
              onClick={() => go(s.id)}
              title={s.name}
            >
              <i>{s.glyph}</i>
              <span>{s.name}</span>
              {((s.id === "pulse" && urgent) || (s.id === "us" && waiting > 0)) && <em className="pip" />}
            </button>
          ))}
        </nav>

        <div className="main">
          <header className="topbar">
            <div className="screen-name">{current.title}</div>
            <div className="spacer" />
            {problem && (
              <button className="chip bad" onClick={clearProblem} title="اضغط عشان تخفيه">
                {problem}
              </button>
            )}
            <div className="who">
              <i className="dotcolor" style={{ color: you.accent }} />
              {you.name}
            </div>
            <i className={`beat${busy ? " busy" : ""}`} title={busy ? "بيتحفظ" : "متصل"} />
            <button className="iconbtn" onClick={() => void signOut()} title="اقفل الجلسة">⏻</button>
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
