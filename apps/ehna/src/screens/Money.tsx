import { useState } from "react";
import {
  arDate, enDate, fmt, short, shortEn, today,
  type Actor, type Expense, type Text,
} from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Meter, Money as Cash, Sheet, Tile, Who } from "../ui/bits.js";
import { colorFor, Split, Trail } from "../ui/charts.js";
import { useTongue } from "../lang.js";

/**
 * الفلوس.
 *
 * ثلاثة أرقام لا واحد: ما دخل الصندوق، وما خرج فعلًا، وما لسه مخطط له.
 * "فاضل كام" بمفرده رقم مطمئن وكاذب، لأنه لا يعرف الكشف الباقي.
 */
export function Money() {
  const { space, report, act, busy } = useSpace();
  const m = report.money;
  const [expense, setExpense] = useState<Expense | "new" | null>(null);
  const [pot, setPot] = useState(false);
  const [kill, setKill] = useState<Expense | null>(null);
  const { lang, t } = useTongue();
  const date = (d: string) => (lang === "ar" ? arDate(d) : enDate(d));
  const brief = (n: number) => (lang === "ar" ? short(n) : shortEn(n));

  // المسار التراكمي: كل شهر يحمل مجموع ما سبقه — وهو ما يُقارَن بالميزانية
  let running = 0;
  const trail = m.byMonth.map((x) => { running += x.amount; return { label: x.month.slice(2), value: running }; });

  const parts = [
    ...m.byRoom
      .filter((r) => r.spent > 0)
      .map((r, i) => ({ label: r.name, value: r.spent, color: colorFor(i) })),
    ...m.byCategory.map((c, i) => ({ label: c.category, value: c.amount, color: colorFor(i + m.byRoom.length) })),
  ].sort((a, b) => b.value - a.value).slice(0, 9);

  return (
    <>
      <h1 className="title">{t("الميزان", "Ledger")}</h1>
      <p className="sub">
        {space.settings.budget > 0
          ? t(`الميزانية ${fmt(space.settings.budget)} ${space.settings.currency} · ${m.gap > 0 ? `المتوقع أعلى منها بـ${short(m.gap)}` : `المتوقع جوّاها بـ${short(-m.gap)}`}`,
              `Budget ${fmt(space.settings.budget)} ${space.settings.currency} · projected ${m.gap > 0 ? `${shortEn(m.gap)} over` : `${shortEn(-m.gap)} under`}`)
          : t("الميزانية لسه مش متحددة — حدّدوها من الضبط.", "No budget set yet — set one in Config.")}
      </p>

      <section className="block">
        <div className="tiles stagger">
          <Tile
            k={t("دخل الصندوق", "Into the pot")}
            v={<Cash n={m.inPot} space={space} />}
            n={t(`${space.contributions.length} إيداع`, `${space.contributions.length} deposits`)}
          />
          <Tile
            k={t("اتصرف فعلًا", "Actually spent")}
            v={<Cash n={m.spent} space={space} />}
            n={t(`${short(m.spent - m.byCategory.reduce((n, c) => n + c.amount, 0))} منها عفش`,
                 `${shortEn(m.spent - m.byCategory.reduce((n, c) => n + c.amount, 0))} of it furniture`)}
            tone="down"
          />
          <Tile
            k={t("لسه مخطط", "Still planned")}
            v={<Cash n={m.committed} space={space} />}
            n={t(`${m.unpriced} حاجة من غير سعر`, `${m.unpriced} with no price`)}
            tone="warn"
          />
          <Tile
            k={t("المتوقع الكلي", "Projected total")}
            v={<Cash n={m.projected} space={space} />}
            n={space.settings.budget > 0
              ? t(`${Math.round((m.projected / space.settings.budget) * 100)}٪ من الميزانية`,
                  `${Math.round((m.projected / space.settings.budget) * 100)}% of the budget`)
              : "—"}
            tone={m.gap > 0 ? "down" : "up"}
          />
        </div>
      </section>

      {space.settings.budget > 0 && (
        <section className="block">
          <div className="head"><span className="label">{t("استهلاك الميزانية", "Budget consumed")}</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="num" style={{ color: "var(--violet-hi)" }}>{fmt(m.spent)}</span>
              <span className="num" style={{ color: "var(--dust)" }}>{fmt(space.settings.budget)}</span>
            </div>
            <Meter
              value={(m.spent / space.settings.budget) * 100}
              tone={m.spent > space.settings.budget ? "warn" : undefined}
            />
            <div className="legend" style={{ marginTop: 12 }}>
              <span><i style={{ background: "var(--violet)" }} />{t("اتدفع", "Paid")} · {fmt(m.spent)}</span>
              <span><i style={{ background: "var(--dust)" }} />{t("مخطط", "Planned")} · {fmt(m.committed)}</span>
              <span>
                <i style={{ background: m.gap > 0 ? "var(--red)" : "var(--green)" }} />
                {m.gap > 0
                  ? t(`عجز متوقع · ${fmt(m.gap)}`, `Projected shortfall · ${fmt(m.gap)}`)
                  : t(`فايض متوقع · ${fmt(-m.gap)}`, `Projected surplus · ${fmt(-m.gap)}`)}
              </span>
            </div>
            {m.weeklyBurn > 0 && (
              <p className="sub" style={{ margin: "14px 0 0" }}>
                {t("بتصرفوا ", "You are spending ")}
                <b className="num">{fmt(Math.round(m.weeklyBurn))}</b>
                {t(" في الأسبوع", " a week")}
                {m.runwayWeeks !== null
                  && t(` — الباقي يكفي ${Math.round(m.runwayWeeks)} أسبوع بالمعدل ده`,
                       ` — at that rate, what is left lasts ${Math.round(m.runwayWeeks)} weeks`)}
                {m.drift !== 0
                  && t(` · الأسعار طلعت ${m.driftPct > 0 ? "أعلى" : "أقل"} من المتوقع بـ${Math.abs(m.driftPct)}٪`,
                       ` · prices came in ${Math.abs(m.driftPct)}% ${m.driftPct > 0 ? "above" : "below"} estimate`)}
              </p>
            )}
          </div>
        </section>
      )}

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 380px" }}>
          <div className="head"><span className="label">{t("المسار التراكمي", "Running total")}</span><hr /></div>
          <div className="panel" style={{ padding: "18px 16px 12px" }}>
            <Trail
              data={trail}
              {...(space.settings.budget > 0 ? { ceiling: space.settings.budget } : {})}
              unit={(n) => `${brief(n)} ${space.settings.currency}`}
            />
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 320px" }}>
          <div className="head"><span className="label">{t("راح فين", "Where it went")}</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            <Split parts={parts} unit={brief} />
          </div>
        </section>
      </div>

      <section className="block">
        <div className="head"><span className="label">{t("مين دفع كام", "Who paid what")}</span><hr /></div>
        <div className="tiles">
          {(["him", "her", "both"] as Actor[]).map((a) => (
            <div key={a} className="panel tile">
              <div className="k">{a === "both" ? t("إحنا", "Us") : space.people[a].name}</div>
              <div className="v small" style={{ color: a === "him" ? space.people.him.accent : a === "her" ? space.people.her.accent : "var(--cyan)" }}>
                {fmt(m.paid[a])} {space.settings.currency}
              </div>
              <div className="n">{t(`دخل الصندوق منه ${fmt(m.contributed[a])}`, `${fmt(m.contributed[a])} into the pot`)}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 340px" }}>
          <div className="head">
            <span className="label">{t("المصاريف", "Expenses")}</span>
            <hr />
            <button className="btn tiny primary" onClick={() => setExpense("new")}>+ {t("مصروف", "Expense")}</button>
          </div>
          {space.expenses.length > 0 ? (
            <div className="rows">
              {space.expenses.slice(0, 40).map((e) => (
                <div key={e.id} className="line">
                  <div className="grow">
                    <div className="t"><bdi>{e.title}</bdi><span className="chip"><bdi>{e.category}</bdi></span></div>
                    <div className="m">{date(e.at)}{e.note ? ` · ${e.note}` : ""}</div>
                  </div>
                  <Who actor={e.paidBy} space={space} />
                  <span className="price real">{fmt(e.amount)}</span>
                  <button className="iconbtn" onClick={() => setExpense(e)} aria-label={t("عدّل", "Edit")}>✎</button>
                  <button className="iconbtn danger" onClick={() => setKill(e)} aria-label={t("امسح", "Delete")}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title={t("مفيش مصاريف متسجلة", "No expenses logged")}
              note={t("العفش بيتسجل في العش، وده للقاعة والفستان والشبكة وخلافه.",
                      "Furniture is logged in the Nest; this is for the venue, the dress, the jewellery and the rest.")}
            />
          )}
        </section>

        <section className="block" style={{ flex: "1 1 280px" }}>
          <div className="head">
            <span className="label">{t("الصندوق", "The pot")}</span>
            <hr />
            <button className="btn tiny" onClick={() => setPot(true)}>+ {t("إيداع", "Deposit")}</button>
          </div>
          {space.contributions.length > 0 ? (
            <div className="rows">
              {space.contributions.slice(0, 20).map((c) => (
                <div key={c.id} className="line">
                  <Who actor={c.who} space={space} />
                  <div className="grow">
                    <div className="t"><span className="num">{fmt(c.amount)}</span></div>
                    <div className="m">{date(c.at)}{c.note ? ` · ${c.note}` : ""}</div>
                  </div>
                  <button
                    className="iconbtn danger"
                    disabled={busy}
                    onClick={() => void act({ type: "contribution.remove", id: c.id })}
                    aria-label={t("امسح", "Delete")}
                  >✕</button>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title={t("الصندوق فاضي", "The pot is empty")}
              note={t("سجّلوا اللي بتحوّشوه، فالمقارنة بين الداخل والخارج هي اللي بتقول الحقيقة.",
                      "Log what you are putting aside — the comparison between in and out is what tells the truth.")}
            />
          )}
        </section>
      </div>

      {expense && <ExpenseSheet expense={expense === "new" ? null : expense} onClose={() => setExpense(null)} />}
      {pot && <PotSheet onClose={() => setPot(false)} />}
      {kill && (
        <Confirm
          text={t(`هتمسح مصروف «${kill.title}».`, `The expense “${kill.title}” will be deleted.`)}
          onNo={() => setKill(null)}
          onYes={() => { void act({ type: "expense.remove", id: kill.id }); setKill(null); }}
        />
      )}
    </>
  );
}

/**
 * الأبواب.
 *
 * القيمة المخزَّنة عربية دائمًا، ولو كانت الواجهة إنجليزية. لأن الباب
 * **بيانات** كتبها أحدهما في المساحة لا تسمية في الواجهة: لو خُزّن
 * "Venue" لمن يقرأ بالإنجليزية و"قاعة" للآخر، لصار المصروف الواحد بابين
 * في الرسم البياني، وانقسم مجموع أمام عيني من بدّل لغته.
 *
 * فالقائمة تُعرَض باللغتين وتُخزَّن بواحدة. وهي اقتراح لا حصر: الحقل نصّ
 * حر في العقد، ومن يكتب بابًا بالإنجليزية يبقى كما كتبه.
 */
const CATEGORIES: Text[] = [
  { ar: "قاعة",       en: "Venue" },
  { ar: "فستان",      en: "Dress" },
  { ar: "بدلة",       en: "Suit" },
  { ar: "شبكة",       en: "Jewellery" },
  { ar: "دبل",        en: "Rings" },
  { ar: "مصور",       en: "Photographer" },
  { ar: "كوافير",     en: "Hair & make-up" },
  { ar: "دي جي",      en: "DJ" },
  { ar: "كوشة",       en: "Stage & flowers" },
  { ar: "دعوات",      en: "Invitations" },
  { ar: "ورق",        en: "Paperwork" },
  { ar: "عربية",      en: "Car" },
  { ar: "شهر عسل",    en: "Honeymoon" },
  { ar: "حاجة تانية", en: "Something else" },
];

function ExpenseSheet({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const { t } = useTongue();
  const [title, setTitle] = useState(expense?.title ?? "");
  const [category, setCategory] = useState(expense?.category ?? CATEGORIES[0]!.ar);
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [at, setAt] = useState(expense?.at ?? today());
  const [paidBy, setPaidBy] = useState<Actor>(expense?.paidBy ?? "both");
  const [note, setNote] = useState(expense?.note ?? "");

  async function save() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) return;
    const done = expense
      ? await act({ type: "expense.update", id: expense.id, patch: { title, category, amount: n, at, paidBy, note: note || null } })
      : await act({ type: "expense.add", title, category, amount: n, at, paidBy, note: note || null });
    if (done) onClose();
  }

  return (
    <Sheet title={expense ? t("تعديل المصروف", "Edit expense") : t("مصروف جديد", "New expense")} onClose={onClose}>
      <Field label={t("على إيه", "What for")}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
               placeholder={t("عربون القاعة", "Deposit on the venue")} />
      </Field>
      <div className="row">
        <Field label={t("الباب", "Category")}>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {/* القيمة عربية دائمًا، والنص بلغة القارئ — انظر تعليق CATEGORIES */}
            {CATEGORIES.map((c) => <option key={c.ar} value={c.ar}>{t(c.ar, c.en)}</option>)}
            {/* باب كُتب سابقًا وليس في القائمة يظل مختارًا بدل أن يُبدَّل صامتًا */}
            {!CATEGORIES.some((c) => c.ar === category) && <option value={category}>{category}</option>}
          </select>
        </Field>
        <Field label={`${t("المبلغ", "Amount")} (${space.settings.currency})`}>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" dir="ltr" autoComplete="off" />
        </Field>
      </div>
      <div className="row">
        <Field label={t("التاريخ", "Date")}>
          <input type="date" value={at} onChange={(e) => setAt(e.target.value)} dir="ltr" />
        </Field>
        <Field label={t("مين دفع", "Who paid")}>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as Actor)}>
            <option value="both">{t("إحنا", "Us")}</option>
            <option value="him">{space.people.him.name}</option>
            <option value="her">{space.people.her.name}</option>
          </select>
        </Field>
      </div>
      <Field label={t("ملاحظة", "Note")}>
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
        <button className="btn primary" disabled={busy || !title.trim() || !amount} onClick={() => void save()}>
          {t("احفظ", "Save")}
        </button>
      </div>
    </Sheet>
  );
}

function PotSheet({ onClose }: { onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const { t } = useTongue();
  const [who, setWho] = useState<Actor>("him");
  const [amount, setAmount] = useState("");
  const [at, setAt] = useState(today());
  const [note, setNote] = useState("");

  return (
    <Sheet title={t("إيداع في الصندوق", "Deposit into the pot")} onClose={onClose}>
      <div className="row">
        <Field label={t("مين", "Who")}>
          <select value={who} onChange={(e) => setWho(e.target.value as Actor)}>
            <option value="him">{space.people.him.name}</option>
            <option value="her">{space.people.her.name}</option>
            <option value="both">{t("إحنا", "Us")}</option>
          </select>
        </Field>
        <Field label={`${t("المبلغ", "Amount")} (${space.settings.currency})`}>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" dir="ltr" autoFocus />
        </Field>
      </div>
      <div className="row">
        <Field label={t("التاريخ", "Date")}>
          <input type="date" value={at} onChange={(e) => setAt(e.target.value)} dir="ltr" />
        </Field>
        <Field label={t("ملاحظة", "Note")}>
          <input value={note} onChange={(e) => setNote(e.target.value)}
                 placeholder={t("مرتب الشهر، هدية…", "This month's salary, a gift…")} />
        </Field>
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
        <button
          className="btn primary"
          disabled={busy || !amount}
          onClick={async () => {
            const n = Number(amount);
            if (!Number.isFinite(n) || n < 0) return;
            if (await act({ type: "contribution.add", who, amount: n, at, note: note || null })) onClose();
          }}
        >
          {t("سجّل", "Record")}
        </button>
      </div>
    </Sheet>
  );
}
