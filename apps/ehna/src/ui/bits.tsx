import { useEffect, type ReactNode } from "react";
import type { Actor, PersonKey, Space } from "@gonaim/couple";
import { money as fmtMoney } from "@gonaim/couple";
import { useTongue } from "../lang.js";

/** قطع صغيرة تتكرر في كل شاشة. كل واحدة تفعل شيئًا واحدًا. */

export function Sheet({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  const { t } = useTongue();
  // Escape يقفل: نافذة لا تُقفَل بالكيبورد تحبس من يكتب بسرعة
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="veil" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`panel hot sheet${wide ? " wide" : ""}`} role="dialog" aria-modal="true">
        <header>
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onClose} aria-label={t("اقفل", "Close")}>✕</button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

/** حلقة تقدّم — الرقم في وسطها، والقوس يرسم نفسه عند الظهور. */
export function Ring({ value, size = 96, caption, tone = "hot" }: {
  value: number; size?: number; caption?: string | undefined; tone?: "hot" | "cool" | "warm" | undefined;
}) {
  // ٪ في العربية و% في الإنجليزية: نفس المعنى، ورمزان مختلفان لا يُخلطان
  const pct = useTongue().t("٪", "%");
  const stroke = 7;
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const to = len * (1 - Math.max(0, Math.min(100, value)) / 100);
  const id = `ring-${tone}`;
  const colors: Record<string, [string, string]> = {
    hot: ["#A855F7", "#F472B6"],
    cool: ["#22D3EE", "#A855F7"],
    warm: ["#FBBF24", "#FB4D6D"],
  };
  const [a, b] = colors[tone] ?? colors["hot"]!;

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={a} />
            <stop offset="100%" stopColor={b} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A1747" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={len}
          style={{
            // @ts-expect-error — متغير CSS مخصص للحركة
            "--len": len, "--to": to,
            strokeDashoffset: to,
            animation: "draw 1.1s cubic-bezier(0.22,1,0.36,1) both",
            filter: "drop-shadow(0 0 7px rgba(168,85,247,.55))",
          }}
        />
      </svg>
      <div className="mid">
        <b>{value}<span style={{ fontSize: 12 }}>{pct}</span></b>
        {caption ? <span>{caption}</span> : null}
      </div>
    </div>
  );
}

export function Meter({ value, tone }: { value: number; tone?: "cool" | "warn" | undefined }) {
  return (
    <div className="meter">
      <i className={tone ?? ""} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Tile({ k, v, n, tone }: {
  k: string; v: ReactNode; n?: ReactNode; tone?: "up" | "down" | "hot" | "warn" | "small" | undefined;
}) {
  return (
    <div className="panel tile hoverable">
      <div className="k">{k}</div>
      <div className={`v${tone ? ` ${tone}` : ""}`}>{v}</div>
      {n ? <div className="n">{n}</div> : null}
    </div>
  );
}

const ACTOR_CLASS: Record<Actor, string> = { him: "him", her: "her", both: "both" };

export function Who({ actor, space }: { actor: Actor; space: Space }) {
  const { t } = useTongue();
  const name = actor === "both" ? t("إحنا", "Us") : space.people[actor].name;
  return <span className={`chip ${ACTOR_CLASS[actor]}`}>{name}</span>;
}

/**
 * نسخة الدالة — لمن يحتاج الاسم نصًّا لا عنصرًا.
 *
 * تأخذ `us` بدل أن تنادي `useTongue`: تُستدعى داخل `map` و`sort` وأماكن
 * ليست مكوّنات، وقاعدة الخطّافات في React تمنع ذلك.
 */
export function actorName(actor: Actor, space: Space, us = "إحنا"): string {
  return actor === "both" ? us : space.people[actor].name;
}

export function personColor(key: PersonKey, space: Space): string {
  return space.people[key].accent;
}

export function Empty({ title, note, action }: { title: string; note?: string | undefined; action?: ReactNode }) {
  return (
    <div className="silent">
      <strong>{title}</strong>
      {note}
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function Money({ n, space, tone }: { n: number; space: Space; tone?: string | undefined }) {
  return <span className={`num${tone ? ` ${tone}` : ""}`}>{fmtMoney(n, space.settings.currency)}</span>;
}

/** زر تبويب بسيط — يُستخدم للتصفية داخل الشاشات. */
export function Tabs<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: Array<{ id: T; label: string; count?: number | undefined }>;
}) {
  return (
    <div className="row" style={{ gap: 7, marginBottom: 14 }}>
      {options.map((o) => (
        <button
          key={o.id}
          className={`btn ghost${value === o.id ? " primary" : ""}`}
          style={{ flex: "0 0 auto" }}
          onClick={() => onChange(o.id)}
        >
          {o.label}{o.count === undefined ? "" : ` · ${o.count}`}
        </button>
      ))}
    </div>
  );
}

/** تأكيد قبل حذف. الحذف هنا نهائي، فالسؤال ليس ترفًا. */
export function Confirm({ text, onYes, onNo }: { text: string; onYes: () => void; onNo: () => void }) {
  const { t } = useTongue();
  return (
    <Sheet title={t("متأكد؟", "Are you sure?")} onClose={onNo}>
      <p style={{ color: "var(--muted)" }}>{text}</p>
      <div className="row" style={{ marginTop: 18 }}>
        <button className="btn ghost" onClick={onNo}>{t("لأ، سيبه", "No, keep it")}</button>
        <button className="btn danger" onClick={onYes}>{t("أيوه، امسحه", "Yes, delete it")}</button>
      </div>
    </Sheet>
  );
}
