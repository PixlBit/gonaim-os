import { useState } from "react";
import {
  arDate, arSpan, day, daysBetween, fmt, today,
  type Capsule, type Decision, type Wish, type WishKind, type WishStatus,
} from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Sheet, Tabs } from "../ui/bits.js";

/**
 * إحنا.
 *
 * الشاشة الوحيدة هنا التي لا تحسب شيئًا. كل ما سبقها تجهيز لحدث، وهذه
 * للعلاقة نفسها: حاجات نعملها، كلام بينا، رسائل تُفتح بعد سنين، وقرارات
 * لا تُحسم إلا باتفاق الاثنين.
 */

type Tab = "wishes" | "notes" | "capsules" | "decisions";

const KINDS: Array<{ id: WishKind; name: string; glyph: string }> = [
  { id: "date", name: "خروجة", glyph: "◈" },
  { id: "travel", name: "سفر", glyph: "✈" },
  { id: "experience", name: "تجربة", glyph: "✦" },
  { id: "habit", name: "عادة", glyph: "◉" },
  { id: "buy", name: "حاجة نشتريها", glyph: "◇" },
];

export function Us() {
  const { report } = useSpace();
  const [tab, setTab] = useState<Tab>("wishes");

  return (
    <>
      <h1 className="title">إحنا</h1>
      <p className="sub">المساحة اللي مش ليها حساب.</p>

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { id: "wishes", label: "حاجاتنا", count: report.life.wishes.someday + report.life.wishes.planned },
          { id: "notes", label: "رسايل", count: report.life.unreadForMe || undefined },
          { id: "capsules", label: "للمستقبل", count: report.life.capsulesSealed || undefined },
          { id: "decisions", label: "قرارات", count: report.life.openDecisions || undefined },
        ]}
      />

      {tab === "wishes" && <Wishes />}
      {tab === "notes" && <Notes />}
      {tab === "capsules" && <Capsules />}
      {tab === "decisions" && <Decisions />}
    </>
  );
}

/* ── حاجات نعملها مع بعض ──────────────────────────── */

function Wishes() {
  const { space, act, busy } = useSpace();
  const [adding, setAdding] = useState(false);
  const [kill, setKill] = useState<Wish | null>(null);
  const order: WishStatus[] = ["planned", "someday", "done"];
  const list = [...space.wishes].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p className="sub" style={{ margin: 0, flex: 1 }}>
          {list.length > 0
            ? `${list.filter((w) => w.status === "done").length} من ${list.length} عملتوها.`
            : "حاجات صغيرة وكبيرة، مش لازم تكون كلها كبيرة."}
        </p>
        <button className="btn primary" style={{ flex: "0 0 auto" }} onClick={() => setAdding(true)}>+ حاجة نعملها</button>
      </div>

      {list.length > 0 ? (
        <div className="rows stagger">
          {list.map((w) => {
            const kind = KINDS.find((k) => k.id === w.kind);
            return (
              <div key={w.id} className={`line${w.status === "done" ? " done" : ""}`}>
                <button
                  className={`tick${w.status === "done" ? " on" : ""}`}
                  disabled={busy}
                  onClick={() => void act({
                    type: "wish.update", id: w.id,
                    patch: { status: w.status === "done" ? "someday" : "done" },
                  })}
                  aria-label="عملناها"
                >✓</button>
                <span style={{ color: "var(--violet-hi)" }}>{kind?.glyph}</span>
                <div className="grow">
                  <div className="t">
                    {w.title}
                    {w.status === "planned" && <span className="chip warn">متخططة</span>}
                    {w.cost !== undefined && <span className="chip">{fmt(w.cost)} {space.settings.currency}</span>}
                  </div>
                  <div className="m">
                    {kind?.name}
                    {w.plannedFor ? ` · ${arDate(w.plannedFor)}` : ""}
                    {w.doneAt ? ` · عملناها ${arDate(w.doneAt)}` : ""}
                    {w.note ? ` · ${w.note}` : ""}
                  </div>
                </div>
                {w.status !== "done" && (
                  <button
                    className="btn tiny ghost"
                    disabled={busy}
                    onClick={() => void act({
                      type: "wish.update", id: w.id,
                      patch: { status: w.status === "planned" ? "someday" : "planned" },
                    })}
                  >
                    {w.status === "planned" ? "رجّعها" : "خطّطها"}
                  </button>
                )}
                <button className="iconbtn danger" onClick={() => setKill(w)} aria-label="امسح">✕</button>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title="القائمة فاضية"
          note="حاجات صغيرة وكبيرة: فطار في مكان جديد، رحلة، عادة نمشي عليها كل أسبوع."
          action={<button className="btn primary" onClick={() => setAdding(true)}>زوّدوا أول حاجة</button>}
        />
      )}

      {adding && <WishSheet onClose={() => setAdding(false)} />}
      {kill && (
        <Confirm
          text={`هتشيل «${kill.title}» من القائمة.`}
          onNo={() => setKill(null)}
          onYes={() => { void act({ type: "wish.remove", id: kill.id }); setKill(null); }}
        />
      )}
    </>
  );
}

function WishSheet({ onClose }: { onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WishKind>("experience");
  const [note, setNote] = useState("");
  const [plannedFor, setPlannedFor] = useState("");
  const [cost, setCost] = useState("");

  return (
    <Sheet title="حاجة نعملها مع بعض" onClose={onClose}>
      <Field label="إيه هي">
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="نطلع البحر لوحدنا" />
      </Field>
      <div className="row">
        <Field label="النوع">
          <select value={kind} onChange={(e) => setKind(e.target.value as WishKind)}>
            {KINDS.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </Field>
        <Field label="ميعاد مبدئي">
          <input type="date" value={plannedFor} onChange={(e) => setPlannedFor(e.target.value)} dir="ltr" />
        </Field>
        <Field label={`تكلفة تقريبية (${space.settings.currency})`}>
          <input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="numeric" dir="ltr" placeholder="—" />
        </Field>
      </div>
      <Field label="تفاصيل">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button
          className="btn primary"
          disabled={busy || !title.trim()}
          onClick={async () => {
            const ok = await act({
              type: "wish.add", title, kind,
              note: note || null,
              plannedFor: plannedFor || null,
              cost: cost.trim() === "" ? null : Number(cost),
            });
            if (ok) onClose();
          }}
        >زوّد</button>
      </div>
    </Sheet>
  );
}

/* ── رسايل ────────────────────────────────────────── */

function Notes() {
  const { space, me, act, busy } = useSpace();
  const [body, setBody] = useState("");
  const notes = [...space.notes].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <>
      <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
        <div className="thread" style={{ maxHeight: 460, overflowY: "auto", paddingInlineEnd: 4 }}>
          {notes.length === 0 && <p className="sub" style={{ margin: 0 }}>مفيش رسايل لسه. اكتب حاجة.</p>}
          {notes.map((n) => {
            const mine = n.from === me;
            return (
              <div key={n.id} className={`bubble ${mine ? "mine" : "theirs"}`}>
                {n.body}
                <div className="meta">
                  <span>{space.people[n.from].name}</span>
                  <span>{arDate(n.at)}</span>
                  {mine && <span>{n.readAt ? "اتقرت" : "لسه"}</span>}
                  {!mine && !n.readAt && (
                    <button
                      className="btn tiny ghost"
                      style={{ padding: "2px 8px" }}
                      disabled={busy}
                      onClick={() => void act({ type: "note.read", id: n.id })}
                    >علّم مقروءة</button>
                  )}
                  {mine && (
                    <button
                      className="iconbtn danger"
                      style={{ padding: "0 4px" }}
                      onClick={() => void act({ type: "note.remove", id: n.id })}
                      aria-label="امسح"
                    >✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="row">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="اكتب حاجة تفضل مكتوبة…"
          style={{ minHeight: 70, flex: "1 1 320px" }}
        />
        <button
          className="btn primary"
          style={{ flex: "0 0 auto", alignSelf: "flex-end" }}
          disabled={busy || !body.trim()}
          onClick={async () => { if (await act({ type: "note.send", body })) setBody(""); }}
        >ابعت</button>
      </div>
    </>
  );
}

/* ── رسايل للمستقبل ───────────────────────────────── */

function Capsules() {
  const { space, me, report, act, busy } = useSpace();
  const [writing, setWriting] = useState(false);
  const t = today();
  const list = [...space.capsules].sort((a, b) => a.openAt.localeCompare(b.openAt));

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p className="sub" style={{ margin: 0, flex: 1 }}>
          رسالة تتكتب النهارده وتتقفل لحد يوم تختاره.
          {report.life.nextCapsule && ` أقرب واحدة بعد ${arSpan(report.life.nextCapsule.daysAway)}.`}
        </p>
        <button className="btn primary" style={{ flex: "0 0 auto" }} onClick={() => setWriting(true)}>+ رسالة</button>
      </div>

      {list.length > 0 ? (
        <div className="stagger">
          {list.map((c) => {
            const ready = c.openAt <= t;
            const opened = Boolean(c.openedAt);
            // الخادم لا يرسل نص المقفولة أصلًا؛ وما وصل يُعرَض لكاتبه أو بعد فتحها.
            // الجاهزة غير المفتوحة تبقى مقفولة في الشاشة عمدًا — تُفتح مرة واحدة، سوا.
            const readable = opened || c.from === me;
            return (
              <div key={c.id} className={`panel capsule${ready ? "" : " locked"}`} style={{ marginBottom: 10 }}>
                <h4>{c.title}</h4>
                <div className="when">
                  {opened ? `اتفتحت ${arDate(c.openedAt ?? "")}` : ready ? "جه ميعادها" : `بتتفتح ${arDate(c.openAt)} — بعد ${arSpan(daysBetween(t, c.openAt))}`}
                  {` · من ${space.people[c.from].name}`}
                </div>

                {readable && c.body ? (
                  <div className="text">{c.body}</div>
                ) : (
                  <div className="sealed">🔒 مقفولة — نصّها مش موجود على جهازك أصلًا.</div>
                )}

                <div className="row" style={{ marginTop: 12, gap: 7 }}>
                  {ready && !opened && (
                    <button
                      className="btn primary"
                      style={{ flex: "0 0 auto" }}
                      disabled={busy}
                      onClick={() => void act({ type: "capsule.open", id: c.id })}
                    >افتحها</button>
                  )}
                  {c.from === me && (
                    <button
                      className="btn tiny danger"
                      style={{ flex: "0 0 auto" }}
                      disabled={busy}
                      onClick={() => void act({ type: "capsule.remove", id: c.id })}
                    >امسحها</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title="مفيش رسايل مقفولة"
          note="اكتب واحدة لأول سنة جواز، وسيبها."
          action={<button className="btn primary" onClick={() => setWriting(true)}>اكتب واحدة</button>}
        />
      )}

      {writing && <CapsuleSheet onClose={() => setWriting(false)} />}
    </>
  );
}

function CapsuleSheet({ onClose }: { onClose: () => void }) {
  const { act, busy } = useSpace();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [openAt, setOpenAt] = useState("");

  return (
    <Sheet title="رسالة للمستقبل" onClose={onClose}>
      <Field label="العنوان">
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="لأول سنة جواز" />
      </Field>
      <Field label="تتفتح إمتى">
        <input type="date" value={openAt} onChange={(e) => setOpenAt(e.target.value)} dir="ltr" />
      </Field>
      <Field label="الرسالة">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 200 }} placeholder="…" />
      </Field>
      <p className="label" style={{ lineHeight: 1.9 }}>
        قبل اليوم ده، النص مش هيتبعت للطرف التاني من الخادم أصلًا — مش مخفي في الشاشة، مش موجود.
      </p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button
          className="btn primary"
          disabled={busy || !title.trim() || !body.trim() || !openAt}
          onClick={async () => { if (await act({ type: "capsule.write", title, body, openAt })) onClose(); }}
        >اقفلها</button>
      </div>
    </Sheet>
  );
}

/* ── قرارات ───────────────────────────────────────── */

function Decisions() {
  const { space, me, act, busy } = useSpace();
  const [asking, setAsking] = useState(false);
  const other = me === "him" ? "her" : "him";
  const list = [...space.decisions].sort((a, b) => Number(Boolean(a.resolvedAt)) - Number(Boolean(b.resolvedAt)));

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p className="sub" style={{ margin: 0, flex: 1 }}>
          القرار مش بيتقفل إلا لما الاتنين يختاروا نفس الحاجة. مفيش أغلبية في اتنين.
        </p>
        <button className="btn primary" style={{ flex: "0 0 auto" }} onClick={() => setAsking(true)}>+ قرار</button>
      </div>

      {list.length > 0 ? (
        <div className="stagger">
          {list.map((d) => (
            <div key={d.id} className="panel" style={{ padding: 18, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <h3 style={{ margin: 0, fontSize: 16, flex: 1 }}>{d.question}</h3>
                {d.resolvedAt
                  ? <span className="chip on">اتفقنا</span>
                  : <span className="chip warn">مفتوح من {arSpan(daysBetween(day(d.createdAt), today()))}</span>}
                <button
                  className="iconbtn danger"
                  onClick={() => void act({ type: "decision.remove", id: d.id })}
                  aria-label="امسح"
                >✕</button>
              </div>

              <div className="vote">
                {d.options.map((o) => {
                  const mine = d.votes[me] === o.id;
                  const theirs = d.votes[other] === o.id;
                  return (
                    <button
                      key={o.id}
                      className={`opt${mine ? " mine" : ""}${d.chosen === o.id ? " won" : ""}`}
                      disabled={busy}
                      onClick={() => void act({ type: "decision.vote", id: d.id, option: o.id })}
                    >
                      <div className="grow" style={{ flex: 1 }}>
                        <div>{o.label}</div>
                        {o.note && <div className="m" style={{ color: "var(--dust)", fontSize: 12 }}>{o.note}</div>}
                      </div>
                      {o.cost !== undefined && <span className="cost">{fmt(o.cost)} {space.settings.currency}</span>}
                      <span className="marks">
                        {mine && <i className="dotcolor" style={{ color: space.people[me].accent }} />}
                        {theirs && <i className="dotcolor" style={{ color: space.people[other].accent }} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="label" style={{ marginTop: 12 }}>
                {d.resolvedAt
                  ? `اتحسم ${arDate(d.resolvedAt)}`
                  : d.votes[me]
                    ? `صوّتّ. مستنيين ${space.people[other].name}.`
                    : "لسه مصوّتش."}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="مفيش قرارات مفتوحة"
          note="القاعة ولا الحديقة؟ الشقة في المعادي ولا المقطم؟ اكتبوه هنا بدل ما يفضل يتقال ويتنسي."
          action={<button className="btn primary" onClick={() => setAsking(true)}>اسأل سؤال</button>}
        />
      )}

      {asking && <DecisionSheet onClose={() => setAsking(false)} />}
    </>
  );
}

function DecisionSheet({ onClose }: { onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const [question, setQuestion] = useState("");
  const [rows, setRows] = useState([{ label: "", cost: "" }, { label: "", cost: "" }]);

  const options = rows
    .filter((r) => r.label.trim())
    .map((r) => ({ label: r.label, cost: r.cost.trim() === "" ? null : Number(r.cost) }));

  return (
    <Sheet title="قرار محتاج الاتنين" onClose={onClose}>
      <Field label="السؤال">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} autoFocus placeholder="فين شهر العسل؟" />
      </Field>
      {rows.map((r, i) => (
        <div className="row" key={i}>
          <Field label={`الخيار ${i + 1}`}>
            <input
              value={r.label}
              onChange={(e) => setRows((all) => all.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            />
          </Field>
          <Field label={`تكلفته (${space.settings.currency})`}>
            <input
              value={r.cost}
              inputMode="numeric"
              dir="ltr"
              placeholder="—"
              onChange={(e) => setRows((all) => all.map((x, j) => (j === i ? { ...x, cost: e.target.value } : x)))}
            />
          </Field>
        </div>
      ))}
      {rows.length < 6 && (
        <button className="btn ghost tiny" onClick={() => setRows((all) => [...all, { label: "", cost: "" }])}>
          + خيار
        </button>
      )}
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button
          className="btn primary"
          disabled={busy || !question.trim() || options.length < 2}
          onClick={async () => { if (await act({ type: "decision.ask", question, options })) onClose(); }}
        >اسأل</button>
      </div>
    </Sheet>
  );
}
