import { useState } from "react";
import {
  arDate, arSpan, day, daysBetween, enDate, enSpan, fmt, today,
  type Capsule, type Decision, type Text, type Wish, type WishKind, type WishStatus,
} from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Sheet, Tabs } from "../ui/bits.js";
import { useTongue } from "../lang.js";

/**
 * إحنا.
 *
 * الشاشة الوحيدة هنا التي لا تحسب شيئًا. كل ما سبقها تجهيز لحدث، وهذه
 * للعلاقة نفسها: حاجات نعملها، كلام بينا، رسائل تُفتح بعد سنين، وقرارات
 * لا تُحسم إلا باتفاق الاثنين.
 */

type Tab = "wishes" | "notes" | "capsules" | "decisions";

const KINDS: Array<{ id: WishKind; name: Text; glyph: string }> = [
  { id: "date",       name: { ar: "خروجة",         en: "A night out" },    glyph: "◈" },
  { id: "travel",     name: { ar: "سفر",           en: "Travel" },         glyph: "✈" },
  { id: "experience", name: { ar: "تجربة",         en: "An experience" },  glyph: "✦" },
  { id: "habit",      name: { ar: "عادة",          en: "A habit" },        glyph: "◉" },
  { id: "buy",        name: { ar: "حاجة نشتريها",  en: "Something to buy" }, glyph: "◇" },
];

export function Us() {
  const { report } = useSpace();
  const [tab, setTab] = useState<Tab>("wishes");
  const { t } = useTongue();

  return (
    <>
      <h1 className="title">{t("إحنا", "Us")}</h1>
      <p className="sub">{t("المساحة اللي مش ليها حساب.", "The part of this that nothing is counting.")}</p>

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { id: "wishes", label: t("حاجاتنا", "Our list"), count: report.life.wishes.someday + report.life.wishes.planned },
          { id: "notes", label: t("رسايل", "Notes"), count: report.life.unreadForMe || undefined },
          { id: "capsules", label: t("للمستقبل", "For later"), count: report.life.capsulesSealed || undefined },
          { id: "decisions", label: t("قرارات", "Decisions"), count: report.life.openDecisions || undefined },
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
  const { lang, t, s } = useTongue();
  const date = (d: string) => (lang === "ar" ? arDate(d) : enDate(d));
  const [adding, setAdding] = useState(false);
  const [kill, setKill] = useState<Wish | null>(null);
  const order: WishStatus[] = ["planned", "someday", "done"];
  const list = [...space.wishes].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p className="sub" style={{ margin: 0, flex: 1 }}>
          {list.length > 0
            ? t(`${list.filter((w) => w.status === "done").length} من ${list.length} عملتوها.`,
                `${list.filter((w) => w.status === "done").length} of ${list.length} done.`)
            : t("حاجات صغيرة وكبيرة، مش لازم تكون كلها كبيرة.",
                "Small things and big ones — they do not all have to be big.")}
        </p>
        <button className="btn primary" style={{ flex: "0 0 auto" }} onClick={() => setAdding(true)}>
          + {t("حاجة نعملها", "Something to do")}
        </button>
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
                  aria-label={t("عملناها", "We did it")}
                >✓</button>
                <span style={{ color: "var(--violet-hi)" }}>{kind?.glyph}</span>
                <div className="grow">
                  <div className="t">
                    <bdi>{w.title}</bdi>
                    {w.status === "planned" && <span className="chip warn">{t("متخططة", "planned")}</span>}
                    {w.cost !== undefined && <span className="chip">{fmt(w.cost)} {space.settings.currency}</span>}
                  </div>
                  <div className="m">
                    {kind && s(kind.name)}
                    {w.plannedFor ? ` · ${date(w.plannedFor)}` : ""}
                    {w.doneAt ? t(` · عملناها ${arDate(w.doneAt)}`, ` · done ${enDate(w.doneAt)}`) : ""}
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
                    {w.status === "planned" ? t("رجّعها", "Unplan") : t("خطّطها", "Plan it")}
                  </button>
                )}
                <button className="iconbtn danger" onClick={() => setKill(w)} aria-label={t("امسح", "Delete")}>✕</button>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title={t("القائمة فاضية", "The list is empty")}
          note={t("حاجات صغيرة وكبيرة: فطار في مكان جديد، رحلة، عادة نمشي عليها كل أسبوع.",
                  "Small things and big ones: breakfast somewhere new, a trip, a habit you keep every week.")}
          action={<button className="btn primary" onClick={() => setAdding(true)}>
            {t("زوّدوا أول حاجة", "Add the first one")}
          </button>}
        />
      )}

      {adding && <WishSheet onClose={() => setAdding(false)} />}
      {kill && (
        <Confirm
          text={t(`هتشيل «${kill.title}» من القائمة.`, `“${kill.title}” will come off the list.`)}
          onNo={() => setKill(null)}
          onYes={() => { void act({ type: "wish.remove", id: kill.id }); setKill(null); }}
        />
      )}
    </>
  );
}

function WishSheet({ onClose }: { onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const { t, s } = useTongue();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WishKind>("experience");
  const [note, setNote] = useState("");
  const [plannedFor, setPlannedFor] = useState("");
  const [cost, setCost] = useState("");

  return (
    <Sheet title={t("حاجة نعملها مع بعض", "Something to do together")} onClose={onClose}>
      <Field label={t("إيه هي", "What is it")}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
               placeholder={t("نطلع البحر لوحدنا", "Go to the sea, just us")} />
      </Field>
      <div className="row">
        <Field label={t("النوع", "Kind")}>
          <select value={kind} onChange={(e) => setKind(e.target.value as WishKind)}>
            {KINDS.map((k) => <option key={k.id} value={k.id}>{s(k.name)}</option>)}
          </select>
        </Field>
        <Field label={t("ميعاد مبدئي", "A rough date")}>
          <input type="date" value={plannedFor} onChange={(e) => setPlannedFor(e.target.value)} dir="ltr" />
        </Field>
        <Field label={t(`تكلفة تقريبية (${space.settings.currency})`, `Rough cost (${space.settings.currency})`)}>
          <input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="numeric" dir="ltr" placeholder="—" />
        </Field>
      </div>
      <Field label={t("تفاصيل", "Details")}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
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
        >{t("زوّد", "Add")}</button>
      </div>
    </Sheet>
  );
}

/* ── رسايل ────────────────────────────────────────── */

function Notes() {
  const { space, me, act, busy } = useSpace();
  const { lang, t } = useTongue();
  const [body, setBody] = useState("");
  const notes = [...space.notes].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <>
      <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
        <div className="thread" style={{ maxHeight: 460, overflowY: "auto", paddingInlineEnd: 4 }}>
          {notes.length === 0 && <p className="sub" style={{ margin: 0 }}>{t("مفيش رسايل لسه. اكتب حاجة.", "No notes yet. Write something.")}</p>}
          {notes.map((n) => {
            const mine = n.from === me;
            return (
              <div key={n.id} className={`bubble ${mine ? "mine" : "theirs"}`}>
                {n.body}
                <div className="meta">
                  <span>{space.people[n.from].name}</span>
                  <span>{lang === "ar" ? arDate(n.at) : enDate(n.at)}</span>
                  {mine && <span>{n.readAt ? t("اتقرت", "read") : t("لسه", "unread")}</span>}
                  {!mine && !n.readAt && (
                    <button
                      className="btn tiny ghost"
                      style={{ padding: "2px 8px" }}
                      disabled={busy}
                      onClick={() => void act({ type: "note.read", id: n.id })}
                    >{t("علّم مقروءة", "Mark read")}</button>
                  )}
                  {mine && (
                    <button
                      className="iconbtn danger"
                      style={{ padding: "0 4px" }}
                      onClick={() => void act({ type: "note.remove", id: n.id })}
                      aria-label={t("امسح", "Delete")}
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
          placeholder={t("اكتب حاجة تفضل مكتوبة…", "Write something that stays written…")}
          style={{ minHeight: 70, flex: "1 1 320px" }}
        />
        <button
          className="btn primary"
          style={{ flex: "0 0 auto", alignSelf: "flex-end" }}
          disabled={busy || !body.trim()}
          onClick={async () => { if (await act({ type: "note.send", body })) setBody(""); }}
        >{t("ابعت", "Send")}</button>
      </div>
    </>
  );
}

/* ── رسايل للمستقبل ───────────────────────────────── */

function Capsules() {
  const { space, me, report, act, busy } = useSpace();
  const [writing, setWriting] = useState(false);
  const { lang, t } = useTongue();
  const todayStr = today();
  const date = (d: string) => (lang === "ar" ? arDate(d) : enDate(d));
  const span = (n: number) => (lang === "ar" ? arSpan(n) : enSpan(n));
  const list = [...space.capsules].sort((a, b) => a.openAt.localeCompare(b.openAt));

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p className="sub" style={{ margin: 0, flex: 1 }}>
          {t("رسالة تتكتب النهارده وتتقفل لحد يوم تختاره.",
             "A letter written today and sealed until a day you choose.")}
          {report.life.nextCapsule
            && t(` أقرب واحدة بعد ${arSpan(report.life.nextCapsule.daysAway)}.`,
                 ` The next one opens in ${enSpan(report.life.nextCapsule.daysAway)}.`)}
        </p>
        <button className="btn primary" style={{ flex: "0 0 auto" }} onClick={() => setWriting(true)}>
          + {t("رسالة", "Letter")}
        </button>
      </div>

      {list.length > 0 ? (
        <div className="stagger">
          {list.map((c) => {
            const ready = c.openAt <= todayStr;
            const opened = Boolean(c.openedAt);
            // الخادم لا يرسل نص المقفولة أصلًا؛ وما وصل يُعرَض لكاتبه أو بعد فتحها.
            // الجاهزة غير المفتوحة تبقى مقفولة في الشاشة عمدًا — تُفتح مرة واحدة، سوا.
            const readable = opened || c.from === me;
            return (
              <div key={c.id} className={`panel capsule${ready ? "" : " locked"}`} style={{ marginBottom: 10 }}>
                <h4><bdi>{c.title}</bdi></h4>
                <div className="when">
                  {opened
                    ? t(`اتفتحت ${arDate(c.openedAt ?? "")}`, `Opened ${enDate(c.openedAt ?? "")}`)
                    : ready
                      ? t("جه ميعادها", "Due to open")
                      : t(`بتتفتح ${arDate(c.openAt)} — بعد ${arSpan(daysBetween(todayStr, c.openAt))}`,
                          `Opens ${enDate(c.openAt)} — in ${enSpan(daysBetween(todayStr, c.openAt))}`)}
                  {t(` · من ${space.people[c.from].name}`, ` · from ${space.people[c.from].name}`)}
                </div>

                {readable && c.body ? (
                  <div className="text">{c.body}</div>
                ) : (
                  <div className="sealed">
                    🔒 {t("مقفولة — نصّها مش موجود على جهازك أصلًا.",
                          "Sealed — its text is not on your device at all.")}
                  </div>
                )}

                <div className="row" style={{ marginTop: 12, gap: 7 }}>
                  {ready && !opened && (
                    <button
                      className="btn primary"
                      style={{ flex: "0 0 auto" }}
                      disabled={busy}
                      onClick={() => void act({ type: "capsule.open", id: c.id })}
                    >{t("افتحها", "Open it")}</button>
                  )}
                  {c.from === me && (
                    <button
                      className="btn tiny danger"
                      style={{ flex: "0 0 auto" }}
                      disabled={busy}
                      onClick={() => void act({ type: "capsule.remove", id: c.id })}
                    >{t("امسحها", "Delete it")}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title={t("مفيش رسايل مقفولة", "No sealed letters")}
          note={t("اكتب واحدة لأول سنة جواز، وسيبها.", "Write one for your first anniversary, and leave it.")}
          action={<button className="btn primary" onClick={() => setWriting(true)}>
            {t("اكتب واحدة", "Write one")}
          </button>}
        />
      )}

      {writing && <CapsuleSheet onClose={() => setWriting(false)} />}
    </>
  );
}

function CapsuleSheet({ onClose }: { onClose: () => void }) {
  const { act, busy } = useSpace();
  const { t } = useTongue();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [openAt, setOpenAt] = useState("");

  return (
    <Sheet title={t("رسالة للمستقبل", "A letter to the future")} onClose={onClose}>
      <Field label={t("العنوان", "Title")}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
               placeholder={t("لأول سنة جواز", "For our first anniversary")} />
      </Field>
      <Field label={t("تتفتح إمتى", "Opens on")}>
        <input type="date" value={openAt} onChange={(e) => setOpenAt(e.target.value)} dir="ltr" />
      </Field>
      <Field label={t("الرسالة", "The letter")}>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 200 }} placeholder="…" />
      </Field>
      <p className="footnote" style={{ lineHeight: 1.9 }}>
        {t("قبل اليوم ده، النص مش هيتبعت للطرف التاني من الخادم أصلًا — مش مخفي في الشاشة، مش موجود.",
           "Until that day the server does not send the text to the other of you at all — not hidden on the screen; not there.")}
      </p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
        <button
          className="btn primary"
          disabled={busy || !title.trim() || !body.trim() || !openAt}
          onClick={async () => { if (await act({ type: "capsule.write", title, body, openAt })) onClose(); }}
        >{t("اقفلها", "Seal it")}</button>
      </div>
    </Sheet>
  );
}

/* ── قرارات ───────────────────────────────────────── */

function Decisions() {
  const { space, me, act, busy } = useSpace();
  const { lang, t } = useTongue();
  const date = (d: string) => (lang === "ar" ? arDate(d) : enDate(d));
  const span = (n: number) => (lang === "ar" ? arSpan(n) : enSpan(n));
  const [asking, setAsking] = useState(false);
  const other = me === "him" ? "her" : "him";
  const list = [...space.decisions].sort((a, b) => Number(Boolean(a.resolvedAt)) - Number(Boolean(b.resolvedAt)));

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p className="sub" style={{ margin: 0, flex: 1 }}>
          {t("القرار مش بيتقفل إلا لما الاتنين يختاروا نفس الحاجة. مفيش أغلبية في اتنين.",
             "A decision only closes when you both pick the same thing. There is no majority in a pair.")}
        </p>
        <button className="btn primary" style={{ flex: "0 0 auto" }} onClick={() => setAsking(true)}>
          + {t("قرار", "Decision")}
        </button>
      </div>

      {list.length > 0 ? (
        <div className="stagger">
          {list.map((d) => (
            <div key={d.id} className="panel" style={{ padding: 18, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <h3 style={{ margin: 0, fontSize: 16, flex: 1 }}><bdi>{d.question}</bdi></h3>
                {d.resolvedAt
                  ? <span className="chip on">{t("اتفقنا", "agreed")}</span>
                  : <span className="chip warn">
                      {t(`مفتوح من ${arSpan(daysBetween(day(d.createdAt), today()))}`,
                         `open for ${enSpan(daysBetween(day(d.createdAt), today()))}`)}
                    </span>}
                <button
                  className="iconbtn danger"
                  onClick={() => void act({ type: "decision.remove", id: d.id })}
                  aria-label={t("امسح", "Delete")}
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

              <p className="footnote" style={{ marginTop: 12 }}>
                {d.resolvedAt
                  ? t(`اتحسم ${arDate(d.resolvedAt)}`, `Settled ${enDate(d.resolvedAt)}`)
                  : d.votes[me]
                    ? t(`صوّتّ. مستنيين ${space.people[other].name}.`, `You voted. Waiting on ${space.people[other].name}.`)
                    : t("لسه مصوّتش.", "You have not voted yet.")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title={t("مفيش قرارات مفتوحة", "No open decisions")}
          note={t("القاعة ولا الحديقة؟ الشقة في المعادي ولا المقطم؟ اكتبوه هنا بدل ما يفضل يتقال ويتنسي.",
                  "The hall or the garden? Maadi or Mokattam? Write it here instead of saying it and forgetting it.")}
          action={<button className="btn primary" onClick={() => setAsking(true)}>
            {t("اسأل سؤال", "Ask a question")}
          </button>}
        />
      )}

      {asking && <DecisionSheet onClose={() => setAsking(false)} />}
    </>
  );
}

function DecisionSheet({ onClose }: { onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const { t } = useTongue();
  const [question, setQuestion] = useState("");
  const [rows, setRows] = useState([{ label: "", cost: "" }, { label: "", cost: "" }]);

  const options = rows
    .filter((r) => r.label.trim())
    .map((r) => ({ label: r.label, cost: r.cost.trim() === "" ? null : Number(r.cost) }));

  return (
    <Sheet title={t("قرار محتاج الاتنين", "A decision that needs both of you")} onClose={onClose}>
      <Field label={t("السؤال", "The question")}>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} autoFocus
               placeholder={t("فين شهر العسل؟", "Where for the honeymoon?")} />
      </Field>
      {rows.map((r, i) => (
        <div className="row" key={i}>
          <Field label={t(`الخيار ${i + 1}`, `Option ${i + 1}`)}>
            <input
              value={r.label}
              onChange={(e) => setRows((all) => all.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            />
          </Field>
          <Field label={t(`تكلفته (${space.settings.currency})`, `Its cost (${space.settings.currency})`)}>
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
          + {t("خيار", "option")}
        </button>
      )}
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
        <button
          className="btn primary"
          disabled={busy || !question.trim() || options.length < 2}
          onClick={async () => { if (await act({ type: "decision.ask", question, options })) onClose(); }}
        >{t("اسأل", "Ask")}</button>
      </div>
    </Sheet>
  );
}
