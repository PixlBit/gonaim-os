import { useId } from "react";
import { short } from "@gonaim/couple";

/**
 * رسوم بلا مكتبة.
 *
 * والزمن هنا يجري من اليمين إلى اليسار مثل النص: أقدم شهر عند اليمين.
 * SVG لا يعرف الاتجاه، فالقلب يدوي — وبدونه يقرأ العربي الرسم بالعكس
 * ويرى صعودًا حيث يوجد هبوط.
 *
 * ثلاثة أشكال تكفي كل ما تحتاجه هذه المساحة، وكل واحد منها ~40 سطر SVG.
 * مكتبة رسم تضيف مئات الكيلوبايت وتفرض لغتها البصرية على الواجهة — وهذه
 * واجهة لها لغتها. والأهم: الرسم هنا يقرأ الأرقام كما هي، فلا طبقة تفسير
 * بينك وبين ما حدث فعلًا.
 */

export interface Point { label: string; value: number }

/** أعمدة — للإنفاق الشهري وإنجاز الأسابيع. */
export function Bars({ data, height = 132, unit }: {
  data: Point[]; height?: number; unit?: ((n: number) => string) | undefined;
}) {
  const id = useId();
  if (data.length === 0) return <Blank />;

  const w = 100;
  const max = Math.max(...data.map((d) => d.value), 1);
  const gap = data.length > 18 ? 0.6 : 1.6;
  // عمود واحد لا يملأ العرض: عمود بعرض الشاشة يبدو لوحًا ملوّنًا لا رسمًا.
  // فيُحَدّ العرض ويُوسَّط ما رُسم.
  const bw = Math.min((w - gap * (data.length - 1)) / data.length, 9);
  const used = bw * data.length + gap * (data.length - 1);
  const x0 = (w - used) / 2;
  const top = 14, bottom = 16;
  const plot = height - top - bottom;

  return (
    <>
      <svg className="chart" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none"
           style={{ height }} role="img">
        <defs>
          <linearGradient id={`gv${id}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#5B21B6" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const h = Math.max(1.5, (d.value / max) * plot);
          // القلب: العمود الأول عند اليمين
          const x = w - bw - (x0 + i * (bw + gap));
          return (
            <g key={d.label}>
              <title>{`${d.label}: ${unit ? unit(d.value) : d.value}`}</title>
              <rect
                x={x} y={top + plot - h} width={bw} height={h} rx={1.2}
                fill={`url(#gv${id})`}
                style={{ animation: `rise .6s cubic-bezier(.22,1,.36,1) ${0.03 * i}s both` }}
              />
            </g>
          );
        })}
        <line x1="0" y1={top + plot} x2={w} y2={top + plot} className="axis" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
        <span className="label">{data[0]?.label}</span>
        <span className="label">{unit ? unit(max) : short(max)} ↑</span>
        <span className="label">{data[data.length - 1]?.label}</span>
      </div>
    </>
  );
}

/** منحنى تراكمي — لمسار الإنفاق مقابل الميزانية. */
export function Trail({ data, ceiling, height = 150, unit }: {
  data: Point[]; ceiling?: number | undefined; height?: number; unit?: ((n: number) => string) | undefined;
}) {
  const id = useId();
  if (data.length < 2) return <Blank note="محتاج شهرين على الأقل عشان يبان خط." />;

  const w = 100, top = 12, bottom = 16;
  const plot = height - top - bottom;
  const max = Math.max(...data.map((d) => d.value), ceiling ?? 0, 1);
  const x = (i: number) => w - (i / (data.length - 1)) * w;
  const y = (v: number) => top + plot - (v / max) * plot;

  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(d.value).toFixed(2)}`).join(" ");
  // المسار يبدأ عند اليمين وينتهي عند اليسار، فالإغلاق يمر بالزاويتين بنفس الترتيب
  const area = `${path} L0,${top + plot} L${w},${top + plot} Z`;

  return (
    <>
      <svg className="chart" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none"
           style={{ height }} role="img">
        <defs>
          <linearGradient id={`gv2${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
          <linearGradient id={`ga${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(168,85,247,.35)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0)" />
          </linearGradient>
        </defs>
        {ceiling !== undefined && ceiling > 0 && (
          <g>
            <line x1="0" y1={y(ceiling)} x2={w} y2={y(ceiling)}
                  stroke="#FB4D6D" strokeWidth="1" strokeDasharray="3 2"
                  vectorEffect="non-scaling-stroke" opacity="0.7" />
          </g>
        )}
        <path d={area} fill={`url(#ga${id})`} />
        <path d={path} stroke={`url(#gv2${id})`} fill="none" strokeWidth="2"
              vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={d.label} cx={x(i)} cy={y(d.value)} r="1.6" fill="#F2E9FF">
            <title>{`${d.label}: ${unit ? unit(d.value) : d.value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
        <span className="label">{data[0]?.label}</span>
        {ceiling !== undefined && ceiling > 0
          ? <span className="label" style={{ color: "var(--red)" }}>— الميزانية</span>
          : null}
        <span className="label">{data[data.length - 1]?.label}</span>
      </div>
    </>
  );
}

export interface Part { label: string; value: number; color: string }

/** شريط مقسوم + مفتاح — لتوزيع المصروف على الأبواب. */
export function Split({ parts, unit }: { parts: Part[]; unit?: ((n: number) => string) | undefined }) {
  const total = parts.reduce((n, p) => n + p.value, 0);
  if (total <= 0) return <Blank />;

  return (
    <>
      <div style={{ display: "flex", height: 13, borderRadius: 7, overflow: "hidden", border: "1px solid var(--line)" }}>
        {parts.map((p, i) => (
          <div
            key={p.label}
            title={`${p.label}: ${unit ? unit(p.value) : p.value}`}
            style={{
              width: `${(p.value / total) * 100}%`,
              background: p.color,
              boxShadow: `0 0 14px ${p.color}66`,
              animation: `rise .5s cubic-bezier(.22,1,.36,1) ${0.04 * i}s both`,
            }}
          />
        ))}
      </div>
      <div className="legend">
        {parts.map((p) => (
          <span key={p.label}>
            <i style={{ background: p.color }} />
            {p.label} · <span className="num">{unit ? unit(p.value) : p.value}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function Blank({ note }: { note?: string | undefined }) {
  return (
    <div style={{
      border: "1px dashed var(--line)", borderRadius: 10, padding: "22px 14px",
      textAlign: "center", color: "var(--dust)", fontSize: 13,
    }}>
      {note ?? "لسه مفيش أرقام كفاية للرسم."}
    </div>
  );
}

/** ألوان ثابتة للأبواب — نفس الباب بنفس اللون في كل شاشة. */
export const PALETTE = [
  "#A855F7", "#F472B6", "#22D3EE", "#FBBF24", "#34D399",
  "#818CF8", "#FB7185", "#2DD4BF", "#F59E0B", "#C084FC",
];

export function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length] ?? "#A855F7";
}
