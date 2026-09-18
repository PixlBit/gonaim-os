import type { Persona } from "@gonaim/couple";

/**
 * البصمة.
 *
 * سداسي فيه محاور الشخصية الستة، وضلع لكل واحد بلونه. والقاعدة التي تجعله
 * صادقًا: **المحور غير المقاس لا يُرسَم عند الصفر**. الصفر موقع على الشكل
 * يعني "قليل جدًا"، والمجهول ليس قليلًا — فيُترك رأسه فارغًا بدائرة مجوّفة،
 * ويمر الضلع من المحاور المقاسة وحدها، وتُذكر المحاور الناقصة تحت الشكل.
 *
 * ولهذا لا يظهر شكل كامل لمن لم تُقَس منه ثلاثة محاور: ثلاث نقاط أقل
 * ضلعًا، وما دونها نقاط بلا ادعاء.
 */

const R = 78;
const CENTER = 100;
const SIZE = 200;

export function Fingerprint({ people }: { people: Persona[] }) {
  const axes = people[0]?.axes ?? [];
  if (axes.length === 0) return null;
  const n = axes.length;

  const point = (i: number, value: number) => {
    // البداية من الأعلى، ثم عكس عقارب الساعة — لأن القراءة عربية
    const angle = -Math.PI / 2 - (i / n) * Math.PI * 2;
    const r = (value / 100) * R;
    return [CENTER + Math.cos(angle) * r, CENTER + Math.sin(angle) * r] as const;
  };

  return (
    <div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="radar" role="img" aria-label="بصمة الأنماط">
        {[25, 50, 75, 100].map((ring) => (
          <polygon
            key={ring}
            points={axes.map((_, i) => point(i, ring).join(",")).join(" ")}
            fill="none"
            stroke="var(--line)"
            strokeWidth="0.7"
          />
        ))}
        {axes.map((_, i) => {
          const [x, y] = point(i, 100);
          return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="var(--line)" strokeWidth="0.5" />;
        })}

        {people.map((p) => {
          const measured = p.axes
            .map((a, i) => ({ a, i }))
            .filter((x): x is { a: typeof x.a & { score: number }; i: number } => x.a.score !== null);
          const path = measured.map(({ a, i }) => point(i, a.score).join(",")).join(" ");
          return (
            <g key={p.key}>
              {measured.length >= 3 && (
                <polygon
                  points={path}
                  fill={p.accent}
                  fillOpacity="0.14"
                  stroke={p.accent}
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 6px ${p.accent}88)` }}
                />
              )}
              {p.axes.map((a, i) => {
                const [x, y] = point(i, a.score ?? 100);
                return a.score === null ? (
                  <circle key={a.id} cx={x} cy={y} r="2.2" fill="none" stroke="var(--dust)"
                          strokeWidth="0.8" strokeDasharray="1.5 1.5" />
                ) : (
                  <circle key={a.id} cx={x} cy={y} r="2.6" fill={p.accent} />
                );
              })}
            </g>
          );
        })}

        {axes.map((a, i) => {
          const [x, y] = point(i, 124);
          return (
            <text key={a.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                  fill="var(--muted)" fontSize="8">
              {a.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/** ساعات النشاط — من يظهر متى، من السجل. */
export function Clock({ people }: { people: Persona[] }) {
  const max = Math.max(1, ...people.flatMap((p) => p.hours));
  return (
    <div className="clock">
      {Array.from({ length: 24 }, (_, h) => (
        <div key={h} className="hour" title={`${h}:00`}>
          {people.map((p) => (
            <i
              key={p.key}
              style={{
                height: `${((p.hours[h] ?? 0) / max) * 100}%`,
                background: p.accent,
                boxShadow: (p.hours[h] ?? 0) > 0 ? `0 0 8px ${p.accent}` : "none",
              }}
            />
          ))}
          {h % 6 === 0 && <span>{h}</span>}
        </div>
      ))}
    </div>
  );
}
