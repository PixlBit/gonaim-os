import { useState } from "react";
import { arDate, fmt, short, today, type Actor, type Expense } from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Meter, Money as Cash, Sheet, Tile, Who } from "../ui/bits.js";
import { colorFor, Split, Trail } from "../ui/charts.js";

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
      <h1 className="title">الفلوس</h1>
      <p className="sub">
        {space.settings.budget > 0
          ? `الميزانية ${fmt(space.settings.budget)} ${space.settings.currency} · ${m.gap > 0 ? `المتوقع أعلى منها بـ${short(m.gap)}` : `المتوقع جوّاها بـ${short(-m.gap)}`}`
          : "الميزانية لسه مش متحددة — حدّدوها من الإعدادات."}
      </p>

      <section className="block">
        <div className="tiles stagger">
          <Tile k="دخل الصندوق" v={<Cash n={m.inPot} space={space} />} n={`${space.contributions.length} إيداع`} />
          <Tile k="اتصرف فعلًا" v={<Cash n={m.spent} space={space} />} n={`${short(m.spent - m.byCategory.reduce((n, c) => n + c.amount, 0))} منها عفش`} tone="down" />
          <Tile k="لسه مخطط" v={<Cash n={m.committed} space={space} />} n={`${m.unpriced} حاجة من غير سعر`} tone="warn" />
          <Tile
            k="المتوقع الكلي"
            v={<Cash n={m.projected} space={space} />}
            n={space.settings.budget > 0 ? `${Math.round((m.projected / space.settings.budget) * 100)}٪ من الميزانية` : "—"}
            tone={m.gap > 0 ? "down" : "up"}
          />
        </div>
      </section>

      {space.settings.budget > 0 && (
        <section className="block">
          <div className="head"><span className="label">استهلاك الميزانية</span><hr /></div>
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
              <span><i style={{ background: "var(--violet)" }} />اتدفع · {fmt(m.spent)}</span>
              <span><i style={{ background: "var(--dust)" }} />مخطط · {fmt(m.committed)}</span>
              <span>
                <i style={{ background: m.gap > 0 ? "var(--red)" : "var(--green)" }} />
                {m.gap > 0 ? `عجز متوقع · ${fmt(m.gap)}` : `فايض متوقع · ${fmt(-m.gap)}`}
              </span>
            </div>
            {m.weeklyBurn > 0 && (
              <p className="sub" style={{ margin: "14px 0 0" }}>
                بتصرفوا <b className="num">{fmt(Math.round(m.weeklyBurn))}</b> في الأسبوع
                {m.runwayWeeks !== null && ` — الباقي يكفي ${Math.round(m.runwayWeeks)} أسبوع بالمعدل ده`}
                {m.drift !== 0 && ` · الأسعار طلعت ${m.driftPct > 0 ? "أعلى" : "أقل"} من المتوقع بـ${Math.abs(m.driftPct)}٪`}
              </p>
            )}
          </div>
        </section>
      )}

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 380px" }}>
          <div className="head"><span className="label">المسار التراكمي</span><hr /></div>
          <div className="panel" style={{ padding: "18px 16px 12px" }}>
            <Trail
              data={trail}
              {...(space.settings.budget > 0 ? { ceiling: space.settings.budget } : {})}
              unit={(n) => `${short(n)} ${space.settings.currency}`}
            />
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 320px" }}>
          <div className="head"><span className="label">راح فين</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            <Split parts={parts} unit={(n) => `${short(n)}`} />
          </div>
        </section>
      </div>

      <section className="block">
        <div className="head"><span className="label">مين دفع كام</span><hr /></div>
        <div className="tiles">
          {(["him", "her", "both"] as Actor[]).map((a) => (
            <div key={a} className="panel tile">
              <div className="k">{a === "both" ? "إحنا" : space.people[a].name}</div>
              <div className="v small" style={{ color: a === "him" ? space.people.him.accent : a === "her" ? space.people.her.accent : "var(--cyan)" }}>
                {fmt(m.paid[a])} {space.settings.currency}
              </div>
              <div className="n">دخل الصندوق منه {fmt(m.contributed[a])}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 340px" }}>
          <div className="head">
            <span className="label">المصاريف</span>
            <hr />
            <button className="btn tiny primary" onClick={() => setExpense("new")}>+ مصروف</button>
          </div>
          {space.expenses.length > 0 ? (
            <div className="rows">
              {space.expenses.slice(0, 40).map((e) => (
                <div key={e.id} className="line">
                  <div className="grow">
                    <div className="t">{e.title}<span className="chip">{e.category}</span></div>
                    <div className="m">{arDate(e.at)}{e.note ? ` · ${e.note}` : ""}</div>
                  </div>
                  <Who actor={e.paidBy} space={space} />
                  <span className="price real">{fmt(e.amount)}</span>
                  <button className="iconbtn" onClick={() => setExpense(e)} aria-label="عدّل">✎</button>
                  <button className="iconbtn danger" onClick={() => setKill(e)} aria-label="امسح">✕</button>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="مفيش مصاريف متسجلة" note="العفش بيتسجل في العش، وده للقاعة والفستان والشبكة وخلافه." />
          )}
        </section>

        <section className="block" style={{ flex: "1 1 280px" }}>
          <div className="head">
            <span className="label">الصندوق</span>
            <hr />
            <button className="btn tiny" onClick={() => setPot(true)}>+ إيداع</button>
          </div>
          {space.contributions.length > 0 ? (
            <div className="rows">
              {space.contributions.slice(0, 20).map((c) => (
                <div key={c.id} className="line">
                  <Who actor={c.who} space={space} />
                  <div className="grow">
                    <div className="t"><span className="num">{fmt(c.amount)}</span></div>
                    <div className="m">{arDate(c.at)}{c.note ? ` · ${c.note}` : ""}</div>
                  </div>
                  <button
                    className="iconbtn danger"
                    disabled={busy}
                    onClick={() => void act({ type: "contribution.remove", id: c.id })}
                    aria-label="امسح"
                  >✕</button>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="الصندوق فاضي" note="سجّلوا اللي بتحوّشوه، فالمقارنة بين الداخل والخارج هي اللي بتقول الحقيقة." />
          )}
        </section>
      </div>

      {expense && <ExpenseSheet expense={expense === "new" ? null : expense} onClose={() => setExpense(null)} />}
      {pot && <PotSheet onClose={() => setPot(false)} />}
      {kill && (
        <Confirm
          text={`هتمسح مصروف «${kill.title}».`}
          onNo={() => setKill(null)}
          onYes={() => { void act({ type: "expense.remove", id: kill.id }); setKill(null); }}
        />
      )}
    </>
  );
}

const CATEGORIES = ["قاعة", "فستان", "بدلة", "شبكة", "دبل", "مصور", "كوافير", "دي جي", "كوشة", "دعوات", "ورق", "عربية", "شهر عسل", "حاجة تانية"];

function ExpenseSheet({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const [title, setTitle] = useState(expense?.title ?? "");
  const [category, setCategory] = useState(expense?.category ?? CATEGORIES[0]!);
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
    <Sheet title={expense ? "تعديل المصروف" : "مصروف جديد"} onClose={onClose}>
      <Field label="على إيه">
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="عربون القاعة" />
      </Field>
      <div className="row">
        <Field label="الباب">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label={`المبلغ (${space.settings.currency})`}>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" dir="ltr" autoComplete="off" />
        </Field>
      </div>
      <div className="row">
        <Field label="التاريخ">
          <input type="date" value={at} onChange={(e) => setAt(e.target.value)} dir="ltr" />
        </Field>
        <Field label="مين دفع">
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as Actor)}>
            <option value="both">إحنا</option>
            <option value="him">{space.people.him.name}</option>
            <option value="her">{space.people.her.name}</option>
          </select>
        </Field>
      </div>
      <Field label="ملاحظة">
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button className="btn primary" disabled={busy || !title.trim() || !amount} onClick={() => void save()}>احفظ</button>
      </div>
    </Sheet>
  );
}

function PotSheet({ onClose }: { onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const [who, setWho] = useState<Actor>("him");
  const [amount, setAmount] = useState("");
  const [at, setAt] = useState(today());
  const [note, setNote] = useState("");

  return (
    <Sheet title="إيداع في الصندوق" onClose={onClose}>
      <div className="row">
        <Field label="مين">
          <select value={who} onChange={(e) => setWho(e.target.value as Actor)}>
            <option value="him">{space.people.him.name}</option>
            <option value="her">{space.people.her.name}</option>
            <option value="both">إحنا</option>
          </select>
        </Field>
        <Field label={`المبلغ (${space.settings.currency})`}>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" dir="ltr" autoFocus />
        </Field>
      </div>
      <div className="row">
        <Field label="التاريخ">
          <input type="date" value={at} onChange={(e) => setAt(e.target.value)} dir="ltr" />
        </Field>
        <Field label="ملاحظة">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="مرتب الشهر، هدية…" />
        </Field>
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button
          className="btn primary"
          disabled={busy || !amount}
          onClick={async () => {
            const n = Number(amount);
            if (!Number.isFinite(n) || n < 0) return;
            if (await act({ type: "contribution.add", who, amount: n, at, note: note || null })) onClose();
          }}
        >
          سجّل
        </button>
      </div>
    </Sheet>
  );
}
