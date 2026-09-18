import { useRef, useState } from "react";
import { arDate, arSpan, daysBetween, today, type Memory } from "@gonaim/couple";
import { api, photoUrl, type ApiError } from "../api.js";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Sheet } from "../ui/bits.js";
import { Oracle } from "../ui/oracle.js";

/**
 * الذكريات.
 *
 * السبب الوحيد لوجود هذه الشاشة أن التجهيز يأكل الفترة كلها، وبعد سنة لن
 * يتذكر أحد سعر الغسالة — سيتذكر اليوم الذي راحوا فيه يشتروها. فالذكرى
 * هنا ليست مرفقًا في المهمة: هي نوع أول بذاته، له شاشته وتاريخه وصوره.
 *
 * والصور تُصغَّر في المتصفح وتُرفع إلى خادمكم أنتم — لا خدمة خارجية،
 * ولا رابط عام، ولا صورة تُقرأ بلا جلسة.
 */
export function Memories() {
  const { space, report, act } = useSpace();
  const [editing, setEditing] = useState<Memory | "new" | null>(null);
  const [kill, setKill] = useState<Memory | null>(null);
  const [open, setOpen] = useState<Memory | null>(null);

  const years = [...new Set(space.memories.map((m) => m.date.slice(0, 4)))].sort().reverse();
  const [year, setYear] = useState<string | null>(null);
  const list = space.memories.filter((m) => year === null || m.date.startsWith(year));
  const pinned = list.filter((m) => m.pinned);
  const rest = list.filter((m) => !m.pinned);

  return (
    <>
      <h1 className="title">الذكريات</h1>
      <p className="sub">
        {space.memories.length === 0
          ? "لسه مفيش ذكرى واحدة."
          : `${space.memories.length} ذكرى${report.life.lastMemoryDaysAgo !== null && report.life.lastMemoryDaysAgo > 0 ? ` · آخر واحدة من ${arSpan(report.life.lastMemoryDaysAgo)}` : " · آخر واحدة النهارده"}`}
      </p>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div className="row" style={{ gap: 7, flex: 1 }}>
          <button className={`btn ghost${year === null ? " primary" : ""}`} style={{ flex: "0 0 auto" }} onClick={() => setYear(null)}>
            الكل
          </button>
          {years.map((y) => (
            <button key={y} className={`btn ghost${year === y ? " primary" : ""}`} style={{ flex: "0 0 auto" }} onClick={() => setYear(y)}>
              <span className="num">{y}</span>
            </button>
          ))}
        </div>
        <button className="btn primary" style={{ flex: "0 0 auto" }} onClick={() => setEditing("new")}>+ ذكرى</button>
      </div>

      {list.length === 0 ? (
        <Empty
          title="الصفحة لسه بيضا"
          note="أول لقاء، أول شقة شفتوها، يوم الخطوبة، أي حاجة ضحكتوا فيها."
          action={<button className="btn primary" onClick={() => setEditing("new")}>سجّلوا أول ذكرى</button>}
        />
      ) : (
        <>
          {pinned.length > 0 && (
            <section className="block">
              <div className="head"><span className="label">مثبّتة</span><hr /></div>
              <div className="memories stagger">
                {pinned.map((m) => <Card key={m.id} memory={m} onOpen={() => setOpen(m)} />)}
              </div>
            </section>
          )}
          <section className="block">
            {pinned.length > 0 && <div className="head"><span className="label">الباقي</span><hr /></div>}
            <div className="memories stagger">
              {rest.map((m) => <Card key={m.id} memory={m} onOpen={() => setOpen(m)} />)}
            </div>
          </section>
        </>
      )}

      <section className="block" style={{ marginTop: 34 }}>
        <div className="head"><span className="label">الشهر ده في سطور</span><hr /></div>
        <Oracle kind="letter" title="رسالة الشهر" />
      </section>

      {open && (
        <Sheet title={open.title} onClose={() => setOpen(null)} wide>
          <div className="label" style={{ marginBottom: 10 }}>
            {arDate(open.date)} · {space.people[open.by].name}
            {open.place ? ` · ${open.place}` : ""}
            {` · من ${arSpan(daysBetween(open.date, today()))}`}
          </div>
          {open.photos.length > 0 && (
            <div className="shots" style={{ marginBottom: 14 }}>
              {open.photos.map((p) => (
                <a key={p} href={photoUrl(p)} target="_blank" rel="noreferrer">
                  <img src={photoUrl(p)} alt="" style={{ width: 120, height: 120 }} />
                </a>
              ))}
            </div>
          )}
          {open.story && <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.95 }}>{open.story}</p>}
          <div style={{ marginTop: 16 }}>
            <Oracle kind="story" targetId={open.id} title="احكيها من أول وجديد" />
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <button
              className="btn ghost"
              onClick={() => void act({ type: "memory.update", id: open.id, patch: { pinned: !open.pinned } })}
            >
              {open.pinned ? "شيل التثبيت" : "ثبّتها"}
            </button>
            <button className="btn ghost" onClick={() => { setEditing(open); setOpen(null); }}>عدّل</button>
            <button className="btn danger" onClick={() => { setKill(open); setOpen(null); }}>امسح</button>
          </div>
        </Sheet>
      )}

      {editing && <MemorySheet memory={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {kill && (
        <Confirm
          text={`هتمسح ذكرى «${kill.title}» وصورها.`}
          onNo={() => setKill(null)}
          onYes={() => { void act({ type: "memory.remove", id: kill.id }); setKill(null); }}
        />
      )}
    </>
  );
}

function Card({ memory, onOpen }: { memory: Memory; onOpen: () => void }) {
  const { space } = useSpace();
  const cover = memory.photos[0];
  return (
    <button className="panel mem hoverable" onClick={onOpen} style={{ textAlign: "start", padding: 0, border: "1px solid var(--line)" }}>
      <div className={`shot${cover ? "" : " empty"}`}>
        {cover ? <img src={photoUrl(cover)} alt="" loading="lazy" /> : "❖"}
        {memory.photos.length > 1 && <span className="more">+{memory.photos.length - 1}</span>}
      </div>
      <div className="body">
        <span className="d">{arDate(memory.date)}</span>
        <h4>{memory.title}</h4>
        {memory.story && <p>{memory.story.slice(0, 110)}{memory.story.length > 110 ? "…" : ""}</p>}
        <div className="row" style={{ gap: 6, marginTop: 9 }}>
          <span className={`chip ${memory.by}`}>{space.people[memory.by].name}</span>
          {memory.place && <span className="chip">{memory.place}</span>}
          {memory.pinned && <span className="chip warn">مثبّتة</span>}
        </div>
      </div>
    </button>
  );
}

function MemorySheet({ memory, onClose }: { memory: Memory | null; onClose: () => void }) {
  const { act, busy } = useSpace();
  const [date, setDate] = useState(memory?.date ?? today());
  const [title, setTitle] = useState(memory?.title ?? "");
  const [story, setStory] = useState(memory?.story ?? "");
  const [place, setPlace] = useState(memory?.place ?? "");
  const [photos, setPhotos] = useState<string[]>(memory?.photos ?? []);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setError(null);
    const chosen = Array.from(files).slice(0, 12 - photos.length);
    setUploading(chosen.length);
    for (const file of chosen) {
      try {
        const id = await api.photo(file);
        setPhotos((p) => [...p, id]);
      } catch (err) {
        setError((err as ApiError).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function save() {
    const shared = { date, title, story: story || null, place: place || null, photos, tags: [] };
    const done = memory
      ? await act({ type: "memory.update", id: memory.id, patch: shared })
      : await act({ type: "memory.add", ...shared });
    if (done) onClose();
  }

  return (
    <Sheet title={memory ? "تعديل الذكرى" : "ذكرى جديدة"} onClose={onClose}>
      <div className="row">
        <Field label="اليوم">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" />
        </Field>
        <Field label="المكان">
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="فين كنتوا" />
        </Field>
      </div>
      <Field label="العنوان">
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="أول مرة نشوف الشقة" />
      </Field>
      <Field label="الحكاية">
        <textarea value={story} onChange={(e) => setStory(e.target.value)} style={{ minHeight: 140 }} placeholder="اكتبها زي ما حصلت…" />
      </Field>

      <Field label={`الصور — ${photos.length}/12`}>
        <div className="shots">
          {photos.map((p) => (
            <div key={p} style={{ position: "relative" }}>
              <img src={photoUrl(p)} alt="" />
              <button
                className="iconbtn danger"
                style={{ position: "absolute", insetBlockStart: -6, insetInlineEnd: -6, background: "var(--panel)", borderRadius: "50%" }}
                onClick={() => setPhotos((all) => all.filter((x) => x !== p))}
                aria-label="شيل"
              >✕</button>
            </div>
          ))}
          {uploading > 0 && <div className="slot">…</div>}
          {photos.length < 12 && (
            <button className="slot" onClick={() => picker.current?.click()} aria-label="زوّد صورة">+</button>
          )}
        </div>
        <input
          ref={picker}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }}
        />
      </Field>

      {error && <div className="err">{error}</div>}

      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button className="btn primary" disabled={busy || uploading > 0 || !title.trim()} onClick={() => void save()}>
          {uploading > 0 ? "بيرفع الصور…" : "احفظ"}
        </button>
      </div>
    </Sheet>
  );
}
