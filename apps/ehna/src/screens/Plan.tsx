import { useState } from "react";
import {
  arDate, arSpan, enDate, enSpan, today,
  type Actor, type Milestone, type Phase, type Priority, type Task, type Text,
} from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Sheet, Tabs, Who } from "../ui/bits.js";
import { useTongue } from "../lang.js";

/**
 * الخطة — المحطات والمهام.
 *
 * المحطة تاريخ متفق عليه، والمهمة شيء يُعمَل قبله. الفصل بينهما مقصود:
 * خلط "الفرح" مع "حجز الكوافير" في قائمة واحدة يجعل التاريخ يبدو مهمة
 * قابلة للتأجيل، وهو ليس كذلك.
 */

const PHASES: Array<{ id: Phase; name: Text }> = [
  { id: "engagement", name: { ar: "الخطوبة",   en: "Engagement" } },
  { id: "prep",       name: { ar: "التجهيز",   en: "Preparation" } },
  { id: "wedding",    name: { ar: "الفرح",     en: "The wedding" } },
  { id: "after",      name: { ar: "بعد الفرح", en: "After" } },
];

// «كتب الكتاب» و«شهر العسل» لا يُترجمان بمقابل ثقافي — يُكتبان كما يُقالان:
// الأول عقد القران بصيغته المصرية، والثاني اسمه في الإنجليزية أصلًا.
const KINDS: Array<{ id: Milestone["kind"]; name: Text }> = [
  { id: "engagement", name: { ar: "الخطوبة",     en: "Engagement" } },
  { id: "katb",       name: { ar: "كتب الكتاب",  en: "Katb el-kitab" } },
  { id: "wedding",    name: { ar: "الفرح",       en: "The wedding" } },
  { id: "move",       name: { ar: "دخول الشقة",  en: "Moving in" } },
  { id: "honeymoon",  name: { ar: "شهر العسل",   en: "Honeymoon" } },
  { id: "custom",     name: { ar: "محطة تانية",  en: "Another milestone" } },
];

type Filter = "all" | "mine" | "theirs" | "both" | "late" | "done";

export function Plan() {
  const { space, report, me, act, busy } = useSpace();
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const [milestone, setMilestone] = useState<Milestone | "new" | null>(null);
  const [killing, setKilling] = useState<Task | null>(null);
  const todayStr = today();
  const { lang, t, s } = useTongue();
  const date = (d: string) => (lang === "ar" ? arDate(d) : enDate(d));

  const open = space.tasks.filter((x) => x.status !== "done");
  const tasks = space.tasks.filter((x) => {
    if (filter === "done") return x.status === "done";
    if (x.status === "done") return false;
    if (filter === "mine") return x.owner === me;
    if (filter === "theirs") return x.owner !== me && x.owner !== "both";
    if (filter === "both") return x.owner === "both";
    if (filter === "late") return x.due !== undefined && x.due < todayStr;
    return true;
  }).sort(byUrgency);

  return (
    <>
      <h1 className="title">{t("الخطة", "Plan")}</h1>
      <p className="sub">
        {t(`${report.missions.open} مهمة مفتوحة · خلّصتوا ${report.missions.done}`,
           `${report.missions.open} open · ${report.missions.done} done`)}
        {report.missions.velocity > 0
          && t(` · بتخلّصوا ${report.missions.velocity.toFixed(1)} في الأسبوع`,
               ` · ${report.missions.velocity.toFixed(1)} a week`)}
        {report.missions.finishInWeeks !== null
          && t(` · بالمعدل ده تخلصوا خلال ${arSpan(Math.round(report.missions.finishInWeeks * 7))}`,
               ` · at this pace, done in ${enSpan(Math.round(report.missions.finishInWeeks * 7))}`)}
      </p>

      <section className="block">
        <div className="head">
          <span className="label">{t("المحطات", "Milestones")}</span>
          <hr />
          <button className="btn tiny" onClick={() => setMilestone("new")}>+ {t("محطة", "Milestone")}</button>
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
                    aria-label={t("تمّت", "Done")}
                  >✓</button>
                  <div className="grow">
                    <div className="t">
                      <bdi>{m.title}</bdi>
                      {!m.past && !m.done && <span className="chip">{s(m.when)}</span>}
                      {m.done && <span className="chip on">{t("تمّت", "done")}</span>}
                    </div>
                    <div className="m">{date(m.date)}{m.note ? ` — ${m.note}` : ""}</div>
                  </div>
                  <button className="iconbtn" onClick={() => setMilestone(m)} aria-label={t("عدّل", "Edit")}>✎</button>
                  <button
                    className="iconbtn danger"
                    onClick={() => void act({ type: "milestone.remove", id: m.id })}
                    aria-label={t("امسح", "Delete")}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title={t("مفيش تاريخ محدد", "No date set")}
            note={t("ابدأوا بتاريخ الفرح — حتى لو مبدئي. كل حساب في المنصة بيتقاس عليه.",
                    "Start with the wedding date, even a provisional one. Every calculation here is measured against it.")}
            action={<button className="btn primary" onClick={() => setMilestone("new")}>
              {t("حدّدوا التاريخ", "Set the date")}
            </button>}
          />
        )}
      </section>

      <section className="block">
        <div className="head">
          <span className="label">{t("المهام", "Tasks")}</span>
          <hr />
          <button className="btn tiny primary" onClick={() => setEditing("new")}>+ {t("مهمة", "Task")}</button>
        </div>

        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: t("الكل", "All"), count: open.length },
            { id: "mine", label: t("عليا", "Mine"), count: open.filter((x) => x.owner === me).length },
            { id: "theirs", label: t("عليها", "Theirs"), count: open.filter((x) => x.owner !== me && x.owner !== "both").length },
            { id: "both", label: t("إحنا", "Us"), count: open.filter((x) => x.owner === "both").length },
            { id: "late", label: t("فات معادها", "Overdue"), count: report.missions.overdue.length },
            { id: "done", label: t("خلصت", "Done"), count: report.missions.done },
          ]}
        />

        {tasks.length > 0 ? (
          <div className="rows stagger">
            {tasks.map((x) => (
              <div key={x.id} className={`line${x.status === "done" ? " done" : ""}${x.due && x.due < todayStr && x.status !== "done" ? " late" : ""}`}>
                <button
                  className={`tick${x.status === "done" ? " on" : ""}`}
                  disabled={busy}
                  onClick={() => void act({
                    type: "task.update", id: x.id,
                    patch: { status: x.status === "done" ? "todo" : "done" },
                  })}
                  aria-label={t("تمّت", "Done")}
                >✓</button>
                <div className="grow">
                  <div className="t">
                    <bdi>{x.title}</bdi>
                    {x.priority === 1 && x.status !== "done" && <span className="chip bad">{t("أساسي", "essential")}</span>}
                    {x.status === "blocked" && <span className="chip warn">{t("واقفة", "blocked")}</span>}
                    {x.status === "doing" && <span className="chip">{t("شغالين فيها", "in progress")}</span>}
                  </div>
                  <div className="m">
                    {(() => { const ph = PHASES.find((p) => p.id === x.phase); return ph && s(ph.name); })()}
                    {x.due && t(` · ${x.due < todayStr && x.status !== "done" ? "فات معادها " : "لحد "}${arDate(x.due)}`,
                                ` · ${x.due < todayStr && x.status !== "done" ? "overdue " : "by "}${enDate(x.due)}`)}
                    {x.note && ` · ${x.note}`}
                  </div>
                </div>
                <Who actor={x.owner} space={space} />
                <button className="iconbtn" onClick={() => setEditing(x)} aria-label={t("عدّل", "Edit")}>✎</button>
                <button className="iconbtn danger" onClick={() => setKilling(x)} aria-label={t("امسح", "Delete")}>✕</button>
              </div>
            ))}
          </div>
        ) : (
          <Empty title={filter === "done" ? t("لسه مخلّصتوش حاجة", "Nothing finished yet") : t("مفيش مهام هنا", "No tasks here")} />
        )}
      </section>

      {editing && <TaskSheet task={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {milestone && <MilestoneSheet milestone={milestone === "new" ? null : milestone} onClose={() => setMilestone(null)} />}
      {killing && (
        <Confirm
          text={t(`هتمسح «${killing.title}» نهائي.`, `“${killing.title}” will be deleted for good.`)}
          onNo={() => setKilling(null)}
          onYes={() => { void act({ type: "task.remove", id: killing.id }); setKilling(null); }}
        />
      )}
    </>
  );
}

/** الأعجل أولًا: المتأخر، ثم صاحب الموعد، ثم الأولوية. */
function byUrgency(a: Task, b: Task): number {
  const todayStr = today();
  const late = (x: Task) => (x.due !== undefined && x.due < todayStr ? 0 : 1);
  if (late(a) !== late(b)) return late(a) - late(b);
  if ((a.due ?? "9999") !== (b.due ?? "9999")) return (a.due ?? "9999").localeCompare(b.due ?? "9999");
  return a.priority - b.priority;
}

function TaskSheet({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const { t, s } = useTongue();
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
    <Sheet title={task ? t("تعديل المهمة", "Edit task") : t("مهمة جديدة", "New task")} onClose={onClose}>
      <Field label={t("المهمة", "Task")}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
               placeholder={t("حجز المصور", "Book the photographer")} />
      </Field>
      <div className="row">
        <Field label={t("على مين", "Owner")}>
          <select value={owner} onChange={(e) => setOwner(e.target.value as Actor)}>
            <option value="both">{t("إحنا", "Us")}</option>
            <option value="him">{space.people.him.name}</option>
            <option value="her">{space.people.her.name}</option>
          </select>
        </Field>
        <Field label={t("المرحلة", "Phase")}>
          <select value={phase} onChange={(e) => setPhase(e.target.value as Phase)}>
            {PHASES.map((p) => <option key={p.id} value={p.id}>{s(p.name)}</option>)}
          </select>
        </Field>
      </div>
      <div className="row">
        <Field label={t("الأولوية", "Priority")}>
          <select value={priority} onChange={(e) => setPriority(Number(e.target.value) as Priority)}>
            <option value={1}>{t("أساسي — ميتأجلش", "Essential — cannot wait")}</option>
            <option value={2}>{t("مهم", "Important")}</option>
            <option value={3}>{t("يستنى", "Can wait")}</option>
          </select>
        </Field>
        <Field label={t("آخر ميعاد", "Due")}>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} dir="ltr" />
        </Field>
      </div>
      {task && (
        <Field label={t("الحالة", "Status")}>
          <select value={status} onChange={(e) => setStatus(e.target.value as Task["status"])}>
            <option value="todo">{t("لسه", "To do")}</option>
            <option value="doing">{t("شغالين فيها", "In progress")}</option>
            <option value="blocked">{t("واقفة على حاجة", "Blocked")}</option>
            <option value="done">{t("خلصت", "Done")}</option>
          </select>
        </Field>
      )}
      <Field label={t("ملاحظة", "Note")}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder={t("تفاصيل، أرقام، لينكات…", "Details, numbers, links…")} />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
        <button className="btn primary" disabled={busy || !title.trim()} onClick={() => void save()}>
          {task ? t("احفظ", "Save") : t("زوّد", "Add")}
        </button>
      </div>
    </Sheet>
  );
}

function MilestoneSheet({ milestone, onClose }: { milestone: Milestone | null; onClose: () => void }) {
  const { act, busy } = useSpace();
  const { lang, t, s } = useTongue();
  const [kind, setKind] = useState<Milestone["kind"]>(milestone?.kind ?? "wedding");
  const [title, setTitle] = useState(milestone?.title ?? t("الفرح", "The wedding"));
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
    <Sheet title={milestone ? t("تعديل المحطة", "Edit milestone") : t("محطة جديدة", "New milestone")} onClose={onClose}>
      <Field label={t("النوع", "Kind")}>
        <select
          value={kind}
          onChange={(e) => {
            const k = e.target.value as Milestone["kind"];
            setKind(k);
            const preset = KINDS.find((x) => x.id === k)?.name;
            // العنوان يُكتب بلغة من يكتبه، ثم يُقرأ كما هو: اسم المحطة بيانات لا واجهة
            if (preset && k !== "custom") setTitle(preset[lang]);
          }}
        >
          {KINDS.map((k) => <option key={k.id} value={k.id}>{s(k.name)}</option>)}
        </select>
      </Field>
      <Field label={t("الاسم", "Name")}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label={t("التاريخ", "Date")}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" required />
      </Field>
      <Field label={t("ملاحظة", "Note")}>
        <input value={note} onChange={(e) => setNote(e.target.value)}
               placeholder={t("القاعة، الميعاد، أي تفصيلة", "The venue, the time, any detail")} />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
        <button className="btn primary" disabled={busy || !date || !title.trim()} onClick={() => void save()}>
          {t("احفظ", "Save")}
        </button>
      </div>
    </Sheet>
  );
}
