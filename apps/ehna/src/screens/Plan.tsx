import { useState } from "react";
import { arDate, arSpan, today, type Actor, type Milestone, type Phase, type Priority, type Task } from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Sheet, Tabs, Who } from "../ui/bits.js";

/**
 * الخطة — المحطات والمهام.
 *
 * المحطة تاريخ متفق عليه، والمهمة شيء يُعمَل قبله. الفصل بينهما مقصود:
 * خلط "الفرح" مع "حجز الكوافير" في قائمة واحدة يجعل التاريخ يبدو مهمة
 * قابلة للتأجيل، وهو ليس كذلك.
 */

const PHASES: Array<{ id: Phase; name: string }> = [
  { id: "engagement", name: "الخطوبة" },
  { id: "prep", name: "التجهيز" },
  { id: "wedding", name: "الفرح" },
  { id: "after", name: "بعد الفرح" },
];

const KINDS: Array<{ id: Milestone["kind"]; name: string }> = [
  { id: "engagement", name: "الخطوبة" },
  { id: "katb", name: "كتب الكتاب" },
  { id: "wedding", name: "الفرح" },
  { id: "move", name: "دخول الشقة" },
  { id: "honeymoon", name: "شهر العسل" },
  { id: "custom", name: "محطة تانية" },
];

type Filter = "all" | "mine" | "theirs" | "both" | "late" | "done";

export function Plan() {
  const { space, report, me, act, busy } = useSpace();
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const [milestone, setMilestone] = useState<Milestone | "new" | null>(null);
  const [killing, setKilling] = useState<Task | null>(null);
  const t = today();

  const open = space.tasks.filter((x) => x.status !== "done");
  const tasks = space.tasks.filter((x) => {
    if (filter === "done") return x.status === "done";
    if (x.status === "done") return false;
    if (filter === "mine") return x.owner === me;
    if (filter === "theirs") return x.owner !== me && x.owner !== "both";
    if (filter === "both") return x.owner === "both";
    if (filter === "late") return x.due !== undefined && x.due < t;
    return true;
  }).sort(byUrgency);

  return (
    <>
      <h1 className="title">الخطة</h1>
      <p className="sub">
        {report.missions.open} مهمة مفتوحة · خلّصتوا {report.missions.done}
        {report.missions.velocity > 0 && ` · بتخلّصوا ${report.missions.velocity.toFixed(1)} في الأسبوع`}
        {report.missions.finishInWeeks !== null &&
          ` · بالمعدل ده تخلصوا خلال ${arSpan(Math.round(report.missions.finishInWeeks * 7))}`}
      </p>

      <section className="block">
        <div className="head">
          <span className="label">المحطات</span>
          <hr />
          <button className="btn tiny" onClick={() => setMilestone("new")}>+ محطة</button>
        </div>
        {report.countdown.all.length > 0 ? (
          <div className="tl">
            {report.countdown.all.map((m) => (
              <div key={m.id} className={`node ${m.past ? "past" : m.kind === "wedding" ? "mark" : ""}`}>
                <div className="panel line hoverable" style={{ background: "transparent" }}>
                  <button
                    className={`tick${m.done ? " on" : ""}`}
                    onClick={() => void act({ type: "milestone.done", id: m.id, done: !m.done })}
                    disabled={busy}
                    aria-label="تمّت"
                  >✓</button>
                  <div className="grow">
                    <div className="t">
                      {m.title}
                      {!m.past && !m.done && <span className="chip">{m.when}</span>}
                      {m.done && <span className="chip on">تمّت</span>}
                    </div>
                    <div className="m">{arDate(m.date)}{m.note ? ` — ${m.note}` : ""}</div>
                  </div>
                  <button className="iconbtn" onClick={() => setMilestone(m)} aria-label="عدّل">✎</button>
                  <button
                    className="iconbtn danger"
                    onClick={() => void act({ type: "milestone.remove", id: m.id })}
                    aria-label="امسح"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="مفيش تاريخ محدد"
            note="ابدأوا بتاريخ الفرح — حتى لو مبدئي. كل حساب في المنصة بيتقاس عليه."
            action={<button className="btn primary" onClick={() => setMilestone("new")}>حدّدوا التاريخ</button>}
          />
        )}
      </section>

      <section className="block">
        <div className="head">
          <span className="label">المهام</span>
          <hr />
          <button className="btn tiny primary" onClick={() => setEditing("new")}>+ مهمة</button>
        </div>

        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "الكل", count: open.length },
            { id: "mine", label: "عليا", count: open.filter((x) => x.owner === me).length },
            { id: "theirs", label: "عليها", count: open.filter((x) => x.owner !== me && x.owner !== "both").length },
            { id: "both", label: "إحنا", count: open.filter((x) => x.owner === "both").length },
            { id: "late", label: "فات معادها", count: report.missions.overdue.length },
            { id: "done", label: "خلصت", count: report.missions.done },
          ]}
        />

        {tasks.length > 0 ? (
          <div className="rows stagger">
            {tasks.map((x) => (
              <div key={x.id} className={`line${x.status === "done" ? " done" : ""}${x.due && x.due < t && x.status !== "done" ? " late" : ""}`}>
                <button
                  className={`tick${x.status === "done" ? " on" : ""}`}
                  disabled={busy}
                  onClick={() => void act({
                    type: "task.update", id: x.id,
                    patch: { status: x.status === "done" ? "todo" : "done" },
                  })}
                  aria-label="تمّت"
                >✓</button>
                <div className="grow">
                  <div className="t">
                    {x.title}
                    {x.priority === 1 && x.status !== "done" && <span className="chip bad">أساسي</span>}
                    {x.status === "blocked" && <span className="chip warn">واقفة</span>}
                    {x.status === "doing" && <span className="chip">شغالين فيها</span>}
                  </div>
                  <div className="m">
                    {PHASES.find((p) => p.id === x.phase)?.name}
                    {x.due && ` · ${x.due < t && x.status !== "done" ? "فات معادها " : "لحد "}${arDate(x.due)}`}
                    {x.note && ` · ${x.note}`}
                  </div>
                </div>
                <Who actor={x.owner} space={space} />
                <button className="iconbtn" onClick={() => setEditing(x)} aria-label="عدّل">✎</button>
                <button className="iconbtn danger" onClick={() => setKilling(x)} aria-label="امسح">✕</button>
              </div>
            ))}
          </div>
        ) : (
          <Empty title={filter === "done" ? "لسه مخلّصتوش حاجة" : "مفيش مهام هنا"} />
        )}
      </section>

      {editing && <TaskSheet task={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {milestone && <MilestoneSheet milestone={milestone === "new" ? null : milestone} onClose={() => setMilestone(null)} />}
      {killing && (
        <Confirm
          text={`هتمسح «${killing.title}» نهائي.`}
          onNo={() => setKilling(null)}
          onYes={() => { void act({ type: "task.remove", id: killing.id }); setKilling(null); }}
        />
      )}
    </>
  );
}

/** الأعجل أولًا: المتأخر، ثم صاحب الموعد، ثم الأولوية. */
function byUrgency(a: Task, b: Task): number {
  const t = today();
  const late = (x: Task) => (x.due !== undefined && x.due < t ? 0 : 1);
  if (late(a) !== late(b)) return late(a) - late(b);
  if ((a.due ?? "9999") !== (b.due ?? "9999")) return (a.due ?? "9999").localeCompare(b.due ?? "9999");
  return a.priority - b.priority;
}

function TaskSheet({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const [title, setTitle] = useState(task?.title ?? "");
  const [note, setNote] = useState(task?.note ?? "");
  const [owner, setOwner] = useState<Actor>(task?.owner ?? "both");
  const [phase, setPhase] = useState<Phase>(task?.phase ?? "prep");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 2);
  const [due, setDue] = useState(task?.due ?? "");
  const [status, setStatus] = useState<Task["status"]>(task?.status ?? "todo");

  async function save() {
    const done = task
      ? await act({
          type: "task.update", id: task.id,
          patch: { title, note: note || null, owner, phase, priority, due: due || null, status },
        })
      : await act({
          type: "task.add", title, note: note || null, owner, phase, priority, due: due || null, tags: [],
        });
    if (done) onClose();
  }

  return (
    <Sheet title={task ? "تعديل المهمة" : "مهمة جديدة"} onClose={onClose}>
      <Field label="المهمة">
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="حجز المصور" />
      </Field>
      <div className="row">
        <Field label="على مين">
          <select value={owner} onChange={(e) => setOwner(e.target.value as Actor)}>
            <option value="both">إحنا</option>
            <option value="him">{space.people.him.name}</option>
            <option value="her">{space.people.her.name}</option>
          </select>
        </Field>
        <Field label="المرحلة">
          <select value={phase} onChange={(e) => setPhase(e.target.value as Phase)}>
            {PHASES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="row">
        <Field label="الأولوية">
          <select value={priority} onChange={(e) => setPriority(Number(e.target.value) as Priority)}>
            <option value={1}>أساسي — ميتأجلش</option>
            <option value={2}>مهم</option>
            <option value={3}>يستنى</option>
          </select>
        </Field>
        <Field label="آخر ميعاد">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} dir="ltr" />
        </Field>
      </div>
      {task && (
        <Field label="الحالة">
          <select value={status} onChange={(e) => setStatus(e.target.value as Task["status"])}>
            <option value="todo">لسه</option>
            <option value="doing">شغالين فيها</option>
            <option value="blocked">واقفة على حاجة</option>
            <option value="done">خلصت</option>
          </select>
        </Field>
      )}
      <Field label="ملاحظة">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="تفاصيل، أرقام، لينكات…" />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button className="btn primary" disabled={busy || !title.trim()} onClick={() => void save()}>
          {task ? "احفظ" : "زوّد"}
        </button>
      </div>
    </Sheet>
  );
}

function MilestoneSheet({ milestone, onClose }: { milestone: Milestone | null; onClose: () => void }) {
  const { act, busy } = useSpace();
  const [kind, setKind] = useState<Milestone["kind"]>(milestone?.kind ?? "wedding");
  const [title, setTitle] = useState(milestone?.title ?? "الفرح");
  const [date, setDate] = useState(milestone?.date ?? "");
  const [note, setNote] = useState(milestone?.note ?? "");

  async function save() {
    const done = await act({
      type: "milestone.set",
      ...(milestone ? { id: milestone.id } : {}),
      kind, title, date, note: note || null,
    });
    if (done) onClose();
  }

  return (
    <Sheet title={milestone ? "تعديل المحطة" : "محطة جديدة"} onClose={onClose}>
      <Field label="النوع">
        <select
          value={kind}
          onChange={(e) => {
            const k = e.target.value as Milestone["kind"];
            setKind(k);
            const preset = KINDS.find((x) => x.id === k)?.name;
            if (preset && k !== "custom") setTitle(preset);
          }}
        >
          {KINDS.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
      </Field>
      <Field label="الاسم">
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="التاريخ">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" required />
      </Field>
      <Field label="ملاحظة">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="القاعة، الميعاد، أي تفصيلة" />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button className="btn primary" disabled={busy || !date || !title.trim()} onClick={() => void save()}>
          احفظ
        </button>
      </div>
    </Sheet>
  );
}
