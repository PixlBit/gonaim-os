import { useState } from "react";
import {
  fmtHour, fmtHourEn, TRAIT_LABELS, traitText,
  type ChoiceTrait, type Persona, type SyncInsight, type Text,
} from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Field } from "../ui/bits.js";
import { Clock, Fingerprint } from "../ui/radar.js";
import { Oracle } from "../ui/oracle.js";
import { useTongue, type Tongue } from "../lang.js";

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

const KIND_LABEL: Record<SyncInsight["kind"], Text> = {
  friction:   { ar: "احتكاك", en: "friction" },
  complement: { ar: "تكامل",  en: "complement" },
  echo:       { ar: "تشابه",  en: "echo" },
};

export function Patterns() {
  const { space, report, me, you, them } = useSpace();
  const sync = report.sync;
  const mine = me === "him" ? sync.him : sync.her;
  const theirs = me === "him" ? sync.her : sync.him;
  const [editing, setEditing] = useState(false);
  const tongue = useTongue();
  const { lang, t, s } = tongue;
  const hour = (h: number) => (lang === "ar" ? fmtHour(h) : fmtHourEn(h));

  return (
    <>
      <h1 className="title">{t("الأنماط", "Patterns")}</h1>
      <p className="sub">
        {t("اللي قلتوه عن نفسكم، واللي بتعملوه فعلًا — جنب بعض.",
           "What you said about yourselves, and what you actually do — side by side.")}
        {sync.declared.him + sync.declared.her === 0
          && t(" ابدأوا باللي إنت عايز تقوله عن نفسك.", " Start with what you want to say about yourself.")}
      </p>

      <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 330px" }}>
          <div className="head"><span className="label">{t("البصمة", "Fingerprint")}</span><hr /></div>
          <div className="panel" style={{ padding: "16px 12px 12px" }}>
            <Fingerprint people={[sync.him, sync.her]} />
            <div className="legend" style={{ justifyContent: "center" }}>
              {[sync.him, sync.her].map((p) => (
                <span key={p.key}><i style={{ background: p.accent }} />{p.name}</span>
              ))}
            </div>
            <p className="footnote" style={{ marginTop: 12, lineHeight: 1.9, textAlign: "center" }}>
              {t("الدايرة المفرّغة = محور لسه مش مقاس. مبيتحطش صفر مكانه.",
                 "A hollow ring means an axis with no measurement yet. Zero is never put in its place.")}
              {[sync.him, sync.her]
                .filter((p) => p.axes.filter((a) => a.score !== null).length < 4)
                .map((p) => t(` بصمة ${p.name} لسه ناقصة — ${p.axes.filter((a) => a.score !== null).length} محاور من ${p.axes.length}.`,
                              ` ${p.name}'s print is still partial — ${p.axes.filter((a) => a.score !== null).length} of ${p.axes.length} axes.`))
                .join("")}
            </p>
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 330px" }}>
          <div className="head"><span className="label">{t("أوقات النشاط", "Active hours")}</span><hr /></div>
          <div className="panel" style={{ padding: "18px 16px 12px" }}>
            <Clock people={[sync.him, sync.her]} />
            <p className="sub" style={{ margin: "14px 0 0" }}>
              {sync.overlap === null
                ? t("لسه مفيش نشاط كفاية عشان يتقاس.", "Not enough activity yet to measure.")
                : t(`تطابق الإيقاع ${sync.overlap}٪.`, `Your rhythms overlap ${sync.overlap}%.`)}
              {sync.him.peakHour !== null
                && t(` ${sync.him.name} أنشط ${hour(sync.him.peakHour)}.`, ` ${sync.him.name} peaks at ${hour(sync.him.peakHour)}.`)}
              {sync.her.peakHour !== null
                && t(` ${sync.her.name} أنشط ${hour(sync.her.peakHour)}.`, ` ${sync.her.name} peaks at ${hour(sync.her.peakHour)}.`)}
            </p>
          </div>
        </section>
      </div>

      <section className="block">
        <div className="head">
          <span className="label">{t("اللي قلتوه عن نفسكم", "What you said about yourselves")}</span>
          <hr />
          <button className="btn tiny primary" onClick={() => setEditing((v) => !v)}>
            {editing ? t("خلصت", "Done") : t("عدّل بتاعي", "Edit mine")}
          </button>
        </div>

        {editing ? <TraitsEditor /> : (
          <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
            <Card person={mine} label={t(`${you.name} — إنت`, `${you.name} — you`)} tongue={tongue} />
            <Card person={theirs} label={them.name} tongue={tongue} />
          </div>
        )}
      </section>

      <section className="block">
        <div className="head"><span className="label">{t("إحنا مع بعض", "The two of us")}</span><hr /></div>
        {sync.insights.length > 0 ? (
          <div className="attn-grid">
            {sync.insights.map((i) => (
              <div key={i.code} className={`panel attn ${i.kind === "friction" ? "soon" : i.kind === "complement" ? "watch" : "watch"}`}>
                <h3>
                  {s(i.title)}
                  <span className={`chip ${i.kind === "friction" ? "warn" : i.kind === "complement" ? "both" : ""}`}
                        style={{ marginInlineStart: 8 }}>
                    {s(KIND_LABEL[i.kind])}
                  </span>
                </h3>
                <p>{s(i.why)}</p>
                {i.move && <div className="move">{s(i.move)}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="silent">
            <strong>{t("لسه مفيش ملاحظات", "No notes yet")}</strong>
            {t("الملاحظات بتظهر لما الاتنين يكتبوا اختياراتهم، أو لما يبقى في سلوك كفاية يتقاس عليه.",
               "Notes appear once you have both written your choices, or once there is enough behaviour to measure.")}
          </div>
        )}
      </section>

      <section className="block">
        <div className="head"><span className="label">{t("المحاور ودليلها", "The axes and their evidence")}</span><hr /></div>
        <div className="panel" style={{ padding: 18 }}>
          {mine.axes.map((axis, idx) => {
            const other = theirs.axes[idx];
            return (
              <div key={axis.id} className="axis-row">
                <div className="axis-name">{s(axis.name)}</div>
                <div className="axis-bars">
                  <Bar persona={mine} value={axis.score} tongue={tongue} />
                  <Bar persona={theirs} value={other?.score ?? null} tongue={tongue} />
                </div>
                <div className="axis-why">
                  <span style={{ color: mine.accent }}>{mine.name}:</span> {s(axis.evidence)}
                  <br />
                  <span style={{ color: theirs.accent }}>{theirs.name}:</span> {other && s(other.evidence)}
                </div>
              </div>
            );
          })}
          <p className="footnote" style={{ marginTop: 14, lineHeight: 1.9 }}>
            {t("المحاور نسبية بين الاتنين، مش درجات مطلقة. و«الإنفاق» بيقيس الفرق عن تقديرك إنت — مش إسراف ولا بخل.",
               "The axes are relative between the two of you, not absolute scores. And “Spending” measures the gap from your own estimate — not extravagance or thrift.")}
          </p>
        </div>
      </section>

      <section className="block">
        <div className="head"><span className="label">{t("تقرأ الأنماط بصوت عالي", "Read the patterns aloud")}</span><hr /></div>
        <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
          <div style={{ flex: "1 1 340px" }}><Oracle kind="advice" title={t("نصيحة من أنماطنا", "Advice from our patterns")} /></div>
          <div style={{ flex: "1 1 340px" }}><Oracle kind="gift" title={t(`أفكار لـ${them.name}`, `Ideas for ${them.name}`)} /></div>
        </div>
      </section>

      <p className="footnote" style={{ lineHeight: 2, marginBottom: 40 }}>
        {t(`كل رقم هنا اتحسب من ${space.log.length} سطر في السجل ومن اللي مكتوب في المساحة. مفيش اختبار شخصية ولا تصنيف — في سلوك مسجَّل وإعلان كتبتوه بنفسكم.`,
           `Every number here was computed from ${space.log.length} log lines and what is written in the space. No personality test, no typing — just recorded behaviour and what you declared yourselves.`)}
      </p>
    </>
  );
}

function Bar({ persona, value, tongue }: { persona: Persona; value: number | null; tongue: Tongue }) {
  if (value === null) {
    return (
      <div className="axis-bar empty" title={tongue.t(`${persona.name}: لسه مش مقاس`, `${persona.name}: not measured yet`)}>
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

function Card({ person, label, tongue }: { person: Persona; label: string; tongue: Tongue }) {
  const { t, s } = tongue;
  const said = CHOICES.flatMap((c) => {
    const text = traitText(c, person.traits[c]);
    return text ? [{ c, text: s(text) }] : [];
  });

  return (
    <div className="panel" style={{ padding: 18, flex: "1 1 320px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <i className="dotcolor" style={{ color: person.accent }} />
        <strong>{label}</strong>
      </div>
      {said.length === 0 && !person.traits.joy && !person.traits.friction ? (
        <p className="sub" style={{ margin: 0 }}>{t("لسه ما كتبش حاجة.", "Nothing written yet.")}</p>
      ) : (
        <>
          <div className="rows" style={{ gap: 6 }}>
            {said.map(({ c, text }) => (
              <div key={c} style={{ display: "flex", gap: 10, fontSize: 13.5 }}>
                <span style={{ color: "var(--dust)", flex: "0 0 40%" }}>{s(TRAIT_LABELS[c].label)}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          {(person.traits.joy || person.traits.friction || person.traits.recharge) && (
            <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12, fontSize: 13.5, lineHeight: 1.9 }}>
              {person.traits.joy && <div>{t("بيفرحه", "Lifts them")}: {person.traits.joy}</div>}
              {person.traits.friction && <div>{t("بيضايقه", "Wears them down")}: {person.traits.friction}</div>}
              {person.traits.recharge && <div>{t("بيشحن بـ", "Recharges with")}: {person.traits.recharge}</div>}
            </div>
          )}
        </>
      )}
      {person.signature && (
        <p className="footnote" style={{ marginTop: 14, lineHeight: 1.8 }}>
          {t("من سلوكه", "From behaviour")}: {s(person.signature)}
        </p>
      )}
    </div>
  );
}

function TraitsEditor() {
  const { space, me, act, busy } = useSpace();
  const { t, s } = useTongue();
  const current = space.people[me].traits ?? {};
  const [draft, setDraft] = useState(current);

  const set = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value === "" ? undefined : value }));

  return (
    <div className="panel" style={{ padding: 20 }}>
      <p className="sub" style={{ marginTop: 0 }}>
        {t("ده بتاعك إنت وحدك — الطرف التاني بيشوفه ومش بيعدّله. سيب أي حاجة فاضية لو مش متأكد.",
           "This is yours alone — the other of you can see it but cannot edit it. Leave anything blank if you are unsure.")}
      </p>
      <div className="row">
        {CHOICES.map((c) => (
          <Field key={c} label={s(TRAIT_LABELS[c].label)}>
            <select value={(draft[c] as string | undefined) ?? ""} onChange={(e) => set(c, e.target.value)}>
              <option value="">—</option>
              {Object.entries(TRAIT_LABELS[c].options as Record<string, Text>).map(([k, v]) => (
                <option key={k} value={k}>{s(v)}</option>
              ))}
            </select>
          </Field>
        ))}
      </div>
      <Field label={t("اللي بيفرحني", "What lifts me")}>
        <input value={draft.joy ?? ""} onChange={(e) => set("joy", e.target.value)}
               placeholder={t("حاجة صغيرة تفرق معاك", "A small thing that makes a difference")} />
      </Field>
      <Field label={t("اللي بيضايقني", "What wears me down")}>
        <input value={draft.friction ?? ""} onChange={(e) => set("friction", e.target.value)}
               placeholder={t("أصعب سطر هنا، وأهمه", "The hardest line here, and the most useful")} />
      </Field>
      <Field label={t("بشحن طاقتي بـ", "I recharge with")}>
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
        {t("احفظ", "Save")}
      </button>
    </div>
  );
}
