import { useState } from "react";
import { fmt, money as fmtMoney, short, type Actor, type Item, type ItemStatus, type Priority } from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Meter, Money, Ring, Sheet, Tabs, Tile } from "../ui/bits.js";

/**
 * العش — الشقة وكل ما ينقصها.
 *
 * العمود الأهم هنا ليس الاسم بل السعر. وحالة "بلا سعر" ليست فراغًا يُملأ
 * بصفر: هي معلومة بذاتها تُعرَض بلون تحذير، لأن كشفًا نصفه بلا أسعار
 * يعطي مجموعًا يطمئن ويكذب.
 */

const STATUS: Array<{ id: ItemStatus; name: string; next: ItemStatus }> = [
  { id: "needed", name: "ناقص", next: "chosen" },
  { id: "chosen", name: "اخترناه", next: "ordered" },
  { id: "ordered", name: "اتطلب", next: "bought" },
  { id: "bought", name: "اتشرى", next: "needed" },
];

const statusOf = (s: ItemStatus) => STATUS.find((x) => x.id === s) ?? STATUS[0]!;

type Filter = "all" | "left" | "bought" | "unpriced" | "key";

export function Nest() {
  const { space, report, act, busy } = useSpace();
  const [room, setRoom] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [bulk, setBulk] = useState(false);
  const [newRoom, setNewRoom] = useState(false);
  const [killRoom, setKillRoom] = useState<string | null>(null);
  const [killItem, setKillItem] = useState<Item | null>(null);
  const [priceFor, setPriceFor] = useState<string | null>(null);

  const scope = space.items.filter((i) => room === null || i.roomId === room);
  const items = scope.filter((i) => {
    if (filter === "left") return i.status !== "bought";
    if (filter === "bought") return i.status === "bought";
    if (filter === "unpriced") return i.targetPrice === undefined && i.actualPrice === undefined;
    if (filter === "key") return i.priority === 1;
    return true;
  }).sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, "ar"));

  const roomInfo = room ? report.nest.rooms.find((r) => r.roomId === room) : null;

  return (
    <>
      <h1 className="title">العش</h1>
      <p className="sub">
        {space.settings.address.label
          ? `${space.settings.address.label}${space.settings.address.area ? ` — ${space.settings.address.area}` : ""}`
          : "العنوان لسه مش مكتوب — تلاقوه في الضبط."}
      </p>

      <section className="block">
        <div className="tiles">
          <div className="panel tile" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Ring value={roomInfo ? roomInfo.readiness : report.nest.readiness} size={78} />
            <div>
              <div className="k">الجاهزية</div>
              <div className="n" style={{ marginTop: 6 }}>
                موزونة بالأولوية — الأساسي بيوزن تلات أضعاف الكمالي
              </div>
            </div>
          </div>
          <Tile k="اتشرى" v={`${roomInfo ? roomInfo.bought : report.nest.bought}/${roomInfo ? roomInfo.items : report.nest.total}`} n="عنصر" tone="hot" />
          <Tile
            k="اتدفع هنا"
            v={<Money n={roomInfo ? roomInfo.spent : report.nest.rooms.reduce((n, r) => n + r.spent, 0)} space={space} />}
            n={`لسه مخطط ${short(roomInfo ? roomInfo.committed : report.nest.rooms.reduce((n, r) => n + r.committed, 0))}`}
          />
          <Tile
            k="من غير سعر"
            v={roomInfo ? roomInfo.unpriced : report.money.unpriced}
            n="دي مساحة العمى في الميزانية"
            tone={(roomInfo ? roomInfo.unpriced : report.money.unpriced) > 0 ? "warn" : "up"}
          />
        </div>
      </section>

      <section className="block">
        <div className="head">
          <span className="label">الغرف</span>
          <hr />
          <button className="btn tiny" onClick={() => setNewRoom(true)}>+ غرفة</button>
        </div>
        <div className="rooms stagger">
          <button className={`room hoverable${room === null ? " sel" : ""}`} onClick={() => setRoom(null)}>
            <div className="g">▣</div>
            <div className="n">الشقة كلها</div>
            <div className="c ltr">{report.nest.bought}/{report.nest.total}</div>
            <Meter value={report.nest.readiness} />
          </button>
          {report.nest.rooms.map((r) => (
            <button
              key={r.roomId}
              className={`room hoverable${room === r.roomId ? " sel" : ""}`}
              onClick={() => setRoom(r.roomId === room ? null : r.roomId)}
            >
              <div className="g">{r.glyph}</div>
              <div className="n">{r.name}</div>
              <div className="c ltr">
                {r.bought}/{r.items}{r.spent > 0 ? ` · ${short(r.spent)}` : ""}
              </div>
              <Meter value={r.readiness} tone={r.readiness < 30 ? "warn" : undefined} />
            </button>
          ))}
        </div>
        {room && (
          <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
            <button className="btn tiny danger" style={{ flex: "0 0 auto" }} onClick={() => setKillRoom(room)}>
              امسح الغرفة دي
            </button>
          </div>
        )}
      </section>

      <section className="block">
        <div className="head">
          <span className="label">
            {room ? space.rooms.find((r) => r.id === room)?.name : "كل الحاجات"} — {items.length}
          </span>
          <hr />
          <button className="btn tiny ghost" onClick={() => setBulk(true)}>لصق كشف</button>
          <button className="btn tiny primary" onClick={() => setEditing("new")}>+ حاجة</button>
        </div>

        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "الكل", count: scope.length },
            { id: "left", label: "ناقص", count: scope.filter((i) => i.status !== "bought").length },
            { id: "key", label: "أساسي", count: scope.filter((i) => i.priority === 1).length },
            { id: "unpriced", label: "من غير سعر", count: scope.filter((i) => i.targetPrice === undefined && i.actualPrice === undefined).length },
            { id: "bought", label: "اتشرى", count: scope.filter((i) => i.status === "bought").length },
          ]}
        />

        {items.length > 0 ? (
          <div className="rows">
            {items.map((i) => {
              const st = statusOf(i.status);
              const price = i.actualPrice ?? i.targetPrice;
              return (
                <div key={i.id} className="line">
                  <button
                    className={`tick${i.status === "bought" ? " on" : ""}`}
                    disabled={busy}
                    title={`${st.name} ← اضغط لـ${statusOf(st.next).name}`}
                    onClick={() => void act({ type: "item.update", id: i.id, patch: { status: st.next } })}
                  >
                    {i.status === "bought" ? "✓" : i.status === "ordered" ? "◔" : i.status === "chosen" ? "◦" : ""}
                  </button>

                  <div className="grow">
                    <div className="t">
                      {i.name}
                      {i.qty > 1 && <span className="chip">×{i.qty}</span>}
                      {i.priority === 1 && i.status !== "bought" && <span className="chip bad">أساسي</span>}
                      {i.status !== "needed" && i.status !== "bought" && <span className="chip warn">{st.name}</span>}
                    </div>
                    <div className="m">
                      {[
                        room === null ? space.rooms.find((r) => r.id === i.roomId)?.name : null,
                        i.store, i.note,
                      ].filter(Boolean).join(" · ")}
                      {i.url && <> · <a href={i.url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>لينك</a></>}
                    </div>
                  </div>

                  {priceFor === i.id ? (
                    <QuickPrice item={i} onDone={() => setPriceFor(null)} />
                  ) : (
                    <button
                      className={`price ${i.actualPrice !== undefined ? "real" : price !== undefined ? "plan" : "none"}`}
                      style={{ background: "transparent", border: 0 }}
                      onClick={() => setPriceFor(i.id)}
                      title="اضغط عشان تكتب السعر"
                    >
                      {price === undefined
                        ? "+ سعر"
                        : `${fmt(price * (i.qty || 1))} ${space.settings.currency}`}
                    </button>
                  )}

                  <button className="iconbtn" onClick={() => setEditing(i)} aria-label="عدّل">✎</button>
                  <button className="iconbtn danger" onClick={() => setKillItem(i)} aria-label="امسح">✕</button>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            title="مفيش حاجات هنا"
            note={room ? "زوّدوا أول حاجة للغرفة دي، أو الصقوا كشف كامل مرة واحدة." : "ابدأوا بغرفة."}
            action={<button className="btn primary" onClick={() => setEditing("new")}>+ حاجة</button>}
          />
        )}
      </section>

      {editing && (
        <ItemSheet
          item={editing === "new" ? null : editing}
          roomId={room ?? space.rooms[0]?.id ?? ""}
          onClose={() => setEditing(null)}
        />
      )}
      {bulk && <BulkSheet roomId={room ?? space.rooms[0]?.id ?? ""} onClose={() => setBulk(false)} />}
      {newRoom && <RoomSheet onClose={() => setNewRoom(false)} />}
      {killItem && (
        <Confirm
          text={`هتمسح «${killItem.name}» من الكشف.`}
          onNo={() => setKillItem(null)}
          onYes={() => { void act({ type: "item.remove", id: killItem.id }); setKillItem(null); }}
        />
      )}
      {killRoom && (
        <Confirm
          text={`هتمسح الغرفة ومعاها ${space.items.filter((i) => i.roomId === killRoom).length} حاجة.`}
          onNo={() => setKillRoom(null)}
          onYes={() => { void act({ type: "room.remove", id: killRoom }); setKillRoom(null); setRoom(null); }}
        />
      )}
    </>
  );
}

/** كتابة السعر في مكانه — الطريق الأقصر بين "شفنا السعر" و"اتسجّل". */
function QuickPrice({ item, onDone }: { item: Item; onDone: () => void }) {
  const { act, busy } = useSpace();
  const [value, setValue] = useState(String(item.actualPrice ?? item.targetPrice ?? ""));

  async function save(asReal: boolean) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return onDone();
    await act({
      type: "item.update", id: item.id,
      patch: asReal
        ? { actualPrice: n, status: "bought" }
        : { targetPrice: n },
    });
    onDone();
  }

  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") void save(false); if (e.key === "Escape") onDone(); }}
        inputMode="numeric"
        dir="ltr"
        autoFocus
        style={{ width: 96, padding: "5px 8px" }}
      />
      <button className="btn tiny" disabled={busy} onClick={() => void save(false)} title="السعر المتوقع">متوقع</button>
      <button className="btn tiny primary" disabled={busy} onClick={() => void save(true)} title="اتدفع فعلًا">اتدفع</button>
    </div>
  );
}

function ItemSheet({ item, roomId, onClose }: { item: Item | null; roomId: string; onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const [name, setName] = useState(item?.name ?? "");
  const [where, setWhere] = useState(item?.roomId ?? roomId);
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? "needed");
  const [priority, setPriority] = useState<Priority>(item?.priority ?? 2);
  const [qty, setQty] = useState(String(item?.qty ?? 1));
  const [target, setTarget] = useState(item?.targetPrice === undefined ? "" : String(item.targetPrice));
  const [actual, setActual] = useState(item?.actualPrice === undefined ? "" : String(item.actualPrice));
  const [paidBy, setPaidBy] = useState<Actor | "">(item?.paidBy ?? "");
  const [store, setStore] = useState(item?.store ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [note, setNote] = useState(item?.note ?? "");

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  async function save() {
    const shared = {
      name,
      status,
      priority,
      qty: Math.max(1, Number(qty) || 1),
      targetPrice: num(target),
      actualPrice: num(actual),
      paidBy: paidBy === "" ? null : paidBy,
      store: store || null,
      url: url || null,
      note: note || null,
    };
    const done = item
      ? await act({ type: "item.update", id: item.id, patch: { ...shared, roomId: where } })
      : await act({ type: "item.add", roomId: where, ...shared });
    if (done) onClose();
  }

  return (
    <Sheet title={item ? "تعديل الحاجة" : "حاجة جديدة"} onClose={onClose}>
      <Field label="الاسم">
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="غسالة" />
      </Field>
      <div className="row">
        <Field label="الغرفة">
          <select value={where} onChange={(e) => setWhere(e.target.value)}>
            {space.rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="الحالة">
          <select value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)}>
            {STATUS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="row">
        <Field label="الأولوية">
          <select value={priority} onChange={(e) => setPriority(Number(e.target.value) as Priority)}>
            <option value={1}>أساسي</option>
            <option value={2}>مهم</option>
            <option value={3}>كمالي</option>
          </select>
        </Field>
        <Field label="العدد">
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" dir="ltr" />
        </Field>
      </div>
      <div className="row">
        <Field label={`السعر المتوقع (${space.settings.currency} للقطعة)`}>
          <input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="numeric" dir="ltr" placeholder="—" />
        </Field>
        <Field label="اللي اتدفع فعلًا">
          <input value={actual} onChange={(e) => setActual(e.target.value)} inputMode="numeric" dir="ltr" placeholder="—" />
        </Field>
      </div>
      <div className="row">
        <Field label="مين دفع">
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as Actor | "")}>
            <option value="">—</option>
            <option value="both">إحنا</option>
            <option value="him">{space.people.him.name}</option>
            <option value="her">{space.people.her.name}</option>
          </select>
        </Field>
        <Field label="المتجر">
          <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="اسم المحل" />
        </Field>
      </div>
      <Field label="لينك">
        <input value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr" placeholder="https://" />
      </Field>
      <Field label="ملاحظة">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="اللون، المقاس، الموديل…" />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button className="btn primary" disabled={busy || !name.trim() || !where} onClick={() => void save()}>
          {item ? "احفظ" : "زوّد"}
        </button>
      </div>
      {item && (
        <p className="label" style={{ marginTop: 14 }}>
          زوّده {space.people[item.addedBy].name}
          {item.actualPrice !== undefined && item.targetPrice !== undefined &&
            ` · الفرق عن المتوقع: ${fmtMoney((item.actualPrice - item.targetPrice) * (item.qty || 1), space.settings.currency)}`}
        </p>
      )}
    </Sheet>
  );
}

function BulkSheet({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const [where, setWhere] = useState(roomId);
  const [text, setText] = useState("");
  const names = text.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 120);

  return (
    <Sheet title="لصق كشف" onClose={onClose}>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        سطر لكل حاجة. المكرر في نفس الغرفة بيتشال لوحده.
      </p>
      <Field label="الغرفة">
        <select value={where} onChange={(e) => setWhere(e.target.value)}>
          {space.rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </Field>
      <Field label={`الكشف — ${names.length} سطر`}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ minHeight: 180 }}
          placeholder={"سرير\nمرتبة\nدولاب"}
          autoFocus
        />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button
          className="btn primary"
          disabled={busy || names.length === 0 || !where}
          onClick={async () => { if (await act({ type: "item.bulk", roomId: where, names })) onClose(); }}
        >
          زوّد {names.length}
        </button>
      </div>
    </Sheet>
  );
}

function RoomSheet({ onClose }: { onClose: () => void }) {
  const { act, busy } = useSpace();
  const [name, setName] = useState("");
  const [glyph, setGlyph] = useState("◇");
  const GLYPHS = ["◇", "⌾", "◈", "◧", "◍", "◉", "▣", "✦", "❖", "◐"];

  return (
    <Sheet title="غرفة جديدة" onClose={onClose}>
      <Field label="الاسم">
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="غرفة الدريسنج" />
      </Field>
      <Field label="الرمز">
        <div className="row" style={{ gap: 6 }}>
          {GLYPHS.map((g) => (
            <button
              key={g}
              className={`btn${glyph === g ? " primary" : " ghost"}`}
              style={{ flex: "0 0 auto", fontSize: 16 }}
              onClick={() => setGlyph(g)}
            >{g}</button>
          ))}
        </div>
      </Field>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button
          className="btn primary"
          disabled={busy || !name.trim()}
          onClick={async () => { if (await act({ type: "room.add", name, glyph })) onClose(); }}
        >
          زوّد
        </button>
      </div>
    </Sheet>
  );
}
