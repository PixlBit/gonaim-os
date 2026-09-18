import { useState } from "react";
import { fmtHour, TRAIT_LABELS, traitText, type ChoiceTrait, type Persona, type SyncInsight } from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Field } from "../ui/bits.js";
import { Clock, Fingerprint } from "../ui/radar.js";
import { Oracle } from "../ui/oracle.js";

/**
 * الأنماط.
 *
 * شاشة مبنية على تمييز واحد: **ما قلته عن نفسك** مقابل **ما فعلته**.
 * الأول إعلان، والثاني قياس، والفرق بينهما ليس فضيحة — هو أنفع ما هنا،
 * لأنه الوحيد الذي لا يستطيع أحدكما رؤيته وحده.
 *
 * ولا حكم في أي سطر: لا "نمط قوي" ولا "توافق ٨٧٪". فروق موصوفة، ولكل
 * فرق دليله وخطوة عملية.
 */
const CHOICES: ChoiceTrait[] = [
  "loveLanguage", "decisionStyle", "stressStyle", "energyTime", "conflict", "planning", "money",
];

const KIND_LABEL: Record<SyncInsight["kind"], string> = {
  friction: "احتكاك",
  complement: "تكامل",
  echo: "تشابه",
};

export function Patterns() {
  const { space, report, me, you, them } = useSpace();
  const sync = report.sync;
  const mine = me === "him" ? sync.him : sync.her;
  const theirs = me === "him" ? sync.her : sync.him;
  const [editing, setEditing] = useState(false);

  return (
    <>
      <h1 className="title">الأنماط</h1>
      <p className="sub">
        اللي قلتوه عن نفسكم، واللي بتعملوه فعلًا — جنب بعض.
        {sync.declared.him + sync.declared.her === 0 && " ابدأوا باللي إنت عايز تقوله عن نفسك."}
      </p>

      <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 330px" }}>
          <div className="head"><span className="label">البصمة</span><hr /></div>
          <div className="panel" style={{ padding: "16px 12px 12px" }}>
            <Fingerprint people={[sync.him, sync.her]} />
            <div className="legend" style={{ justifyContent: "center" }}>
              {[sync.him, sync.her].map((p) => (
                <span key={p.key}><i style={{ background: p.accent }} />{p.name}</span>
              ))}
            </div>
            <p className="label" style={{ marginTop: 12, lineHeight: 1.9, textAlign: "center" }}>
              الدايرة المفرّغة = محور لسه مش مقاس. مبيتحطش صفر مكانه.
              {[sync.him, sync.her]
                .filter((p) => p.axes.filter((a) => a.score !== null).length < 4)
                .map((p) => ` بصمة ${p.name} لسه ناقصة — ${p.axes.filter((a) => a.score !== null).length} محاور من ${p.axes.length}.`)
                .join("")}
            </p>
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 330px" }}>
          <div className="head"><span className="label">أوقات النشاط</span><hr /></div>
          <div className="panel" style={{ padding: "18px 16px 12px" }}>
            <Clock people={[sync.him, sync.her]} />
            <p className="sub" style={{ margin: "14px 0 0" }}>
              {sync.overlap === null
                ? "لسه مفيش نشاط كفاية عشان يتقاس."
                : `تطابق الإيقاع ${sync.overlap}٪.`}
              {sync.him.peakHour !== null && ` ${sync.him.name} أنشط ${fmtHour(sync.him.peakHour)}.`}
              {sync.her.peakHour !== null && ` ${sync.her.name} أنشط ${fmtHour(sync.her.peakHour)}.`}
            </p>
          </div>
        </section>
      </div>

      <section className="block">
        <div className="head">
          <span className="label">اللي قلتوه عن نفسكم</span>
          <hr />
          <button className="btn tiny primary" onClick={() => setEditing((v) => !v)}>
            {editing ? "خلصت" : "عدّل بتاعي"}
          </button>
        </div>

        {editing ? <TraitsEditor /> : (
          <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
            <Card person={mine} label={`${you.name} — إنت`} />
            <Card person={theirs} label={them.name} />
          </div>
        )}
      </section>

      <section className="block">
        <div className="head"><span className="label">إحنا مع بعض</span><hr /></div>
        {sync.insights.length > 0 ? (
          <div className="attn-grid">
            {sync.insights.map((i) => (
              <div key={i.code} className={`panel attn ${i.kind === "friction" ? "soon" : i.kind === "complement" ? "watch" : "watch"}`}>
                <h3>
                  {i.title}
                  <span className={`chip ${i.kind === "friction" ? "warn" : i.kind === "complement" ? "both" : ""}`}
                        style={{ marginInlineStart: 8 }}>
                    {KIND_LABEL[i.kind]}
                  </span>
                </h3>
                <p>{i.why}</p>
                {i.move && <div className="move">{i.move}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="silent">
            <strong>لسه مفيش ملاحظات</strong>
            الملاحظات بتظهر لما الاتنين يكتبوا اختياراتهم، أو لما يبقى في سلوك كفاية يتقاس عليه.
          </div>
        )}
      </section>

      <section className="block">
        <div className="head"><span className="label">المحاور ودليلها</span><hr /></div>
        <div className="panel" style={{ padding: 18 }}>
          {mine.axes.map((axis, idx) => {
            const other = theirs.axes[idx];
            return (
              <div key={axis.id} className="axis-row">
                <div className="axis-name">{axis.name}</div>
                <div className="axis-bars">
                  <Bar persona={mine} value={axis.score} />
                  <Bar persona={theirs} value={other?.score ?? null} />
                </div>
                <div className="axis-why">
                  <span style={{ color: mine.accent }}>{mine.name}:</span> {axis.evidence}
                  <br />
                  <span style={{ color: theirs.accent }}>{theirs.name}:</span> {other?.evidence}
                </div>
              </div>
            );
          })}
          <p className="label" style={{ marginTop: 14, lineHeight: 1.9 }}>
            المحاور نسبية بين الاتنين، مش درجات مطلقة. و«الإنفاق» بيقيس الفرق عن
            تقديرك إنت — مش إسراف ولا بخل.
          </p>
        </div>
      </section>

      <section className="block">
        <div className="head"><span className="label">تقرأ الأنماط بصوت عالي</span><hr /></div>
        <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
          <div style={{ flex: "1 1 340px" }}><Oracle kind="advice" title="نصيحة من أنماطنا" /></div>
          <div style={{ flex: "1 1 340px" }}><Oracle kind="gift" title={`أفكار لـ${them.name}`} /></div>
        </div>
      </section>

      <p className="label" style={{ lineHeight: 2, marginBottom: 40 }}>
        كل رقم هنا اتحسب من {space.log.length} سطر في السجل ومن اللي مكتوب في المساحة.
        مفيش اختبار شخصية ولا تصنيف — في سلوك مسجَّل وإعلان كتبتوه بنفسكم.
      </p>
    </>
  );
}

function Bar({ persona, value }: { persona: Persona; value: number | null }) {
  if (value === null) {
    return (
      <div className="axis-bar empty" title={`${persona.name}: لسه مش مقاس`}>
        <span>—</span>
      </div>
    );
  }
  return (
    <div className="axis-bar" title={`${persona.name}: ${value}`}>
      <i style={{ width: `${value}%`, background: persona.accent, boxShadow: `0 0 10px ${persona.accent}` }} />
      <span className="num">{value}</span>
    </div>
  );
}

function Card({ person, label }: { person: Persona; label: string }) {
  const said = CHOICES.flatMap((c) => {
    const text = traitText(c, person.traits[c]);
    return text ? [{ c, text }] : [];
  });

  return (
    <div className="panel" style={{ padding: 18, flex: "1 1 320px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <i className="dotcolor" style={{ color: person.accent }} />
        <strong>{label}</strong>
      </div>
      {said.length === 0 && !person.traits.joy && !person.traits.friction ? (
        <p className="sub" style={{ margin: 0 }}>لسه ما كتبش حاجة.</p>
      ) : (
        <>
          <div className="rows" style={{ gap: 6 }}>
            {said.map(({ c, text }) => (
              <div key={c} style={{ display: "flex", gap: 10, fontSize: 13.5 }}>
                <span style={{ color: "var(--dust)", flex: "0 0 40%" }}>{TRAIT_LABELS[c].label}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          {(person.traits.joy || person.traits.friction || person.traits.recharge) && (
            <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12, fontSize: 13.5, lineHeight: 1.9 }}>
              {person.traits.joy && <div>بيفرحه: {person.traits.joy}</div>}
              {person.traits.friction && <div>بيضايقه: {person.traits.friction}</div>}
              {person.traits.recharge && <div>بيشحن بـ: {person.traits.recharge}</div>}
            </div>
          )}
        </>
      )}
      {person.signature && (
        <p className="label" style={{ marginTop: 14, lineHeight: 1.8 }}>
          من سلوكه: {person.signature}
        </p>
      )}
    </div>
  );
}

function TraitsEditor() {
  const { space, me, act, busy } = useSpace();
  const current = space.people[me].traits ?? {};
  const [draft, setDraft] = useState(current);

  const set = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value === "" ? undefined : value }));

  return (
    <div className="panel" style={{ padding: 20 }}>
      <p className="sub" style={{ marginTop: 0 }}>
        ده بتاعك إنت وحدك — الطرف التاني بيشوفه ومش بيعدّله. سيب أي حاجة فاضية لو مش متأكد.
      </p>
      <div className="row">
        {CHOICES.map((c) => (
          <Field key={c} label={TRAIT_LABELS[c].label}>
            <select value={(draft[c] as string | undefined) ?? ""} onChange={(e) => set(c, e.target.value)}>
              <option value="">—</option>
              {Object.entries(TRAIT_LABELS[c].options as Record<string, string>).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
        ))}
      </div>
      <Field label="اللي بيفرحني">
        <input value={draft.joy ?? ""} onChange={(e) => set("joy", e.target.value)} placeholder="حاجة صغيرة تفرق معاك" />
      </Field>
      <Field label="اللي بيضايقني">
        <input value={draft.friction ?? ""} onChange={(e) => set("friction", e.target.value)} placeholder="أصعب سطر هنا، وأهمه" />
      </Field>
      <Field label="بشحن طاقتي بـ">
        <input value={draft.recharge ?? ""} onChange={(e) => set("recharge", e.target.value)} />
      </Field>
      <button
        className="btn primary"
        disabled={busy}
        onClick={() => void act({
          type: "persona.set",
          traits: {
            ...Object.fromEntries(CHOICES.map((c) => [c, (draft[c] as string | undefined) ?? null])),
            joy: draft.joy ?? null,
            friction: draft.friction ?? null,
            recharge: draft.recharge ?? null,
          },
        })}
      >
        احفظ
      </button>
    </div>
  );
}
