import type { Signal } from "@gonaim/domain";

const TIER_LABEL: Record<string, string> = {
  interrupt: "interrupt", window: "window", nudge: "nudge",
  inbox: "inbox", whisper: "whisper", below_threshold: "below",
};

export function SignalCard({ signal }: { signal: Signal }) {
  return (
    <article className={`sig tier-${signal.tier}`}>
      <div className="sig-top">
        <h3>{signal.headline}</h3>
        <span className="tag">{TIER_LABEL[signal.tier]}</span>
        <span className="tag rel">{signal.relevance.toFixed(2)}</span>
      </div>

      {/* "لماذا الآن" شرط قبول، لا حقل اختياري — §37.1 */}
      <p className="why">{signal.whyNow}</p>

      {/* حركة واحدة، لا قائمة خيارات — §5.4 */}
      {signal.suggestedMove && <div className="move">{signal.suggestedMove}</div>}

      <div className="ev">
        {signal.evidence.map((ev, i) => (
          <div className="ev-row" key={i}>
            {/* الفصل بين المرصود والمستنتج ظاهر دائمًا — §24.3 */}
            <span className={`m ${ev.mode}`} title={ev.mode === "observed" ? "مرصود" : "مستنتج"}>
              {ev.mode === "observed" ? "●" : "◇"}
            </span>
            <span className="ltr">{ev.label}</span>
            {ev.sourceUri && <a href={ev.sourceUri} target="_blank" rel="noreferrer">↗</a>}
          </div>
        ))}
      </div>
    </article>
  );
}
