import { useState } from "react";
import {
  fmt, money as fmtMoney, short, shortEn,
  type Actor, type Item, type ItemStatus, type Priority, type Text,
} from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Meter, Money, Ring, Sheet, Tabs, Tile } from "../ui/bits.js";
import { useTongue } from "../lang.js";

/**
 * العش — الشقة وكل ما ينقصها.
 *
 * العمود الأهم هنا ليس الاسم بل السعر. وحالة "بلا سعر" ليست فراغًا يُملأ
 * بصفر: هي معلومة بذاتها تُعرَض بلون تحذير، لأن كشفًا نصفه بلا أسعار
 * يعطي مجموعًا يطمئن ويكذب.
 */

const STATUS: Array<{ id: ItemStatus; name: Text; next: ItemStatus }> = [
  { id: "needed",  name: { ar: "ناقص",    en: "Needed" },  next: "chosen" },
  { id: "chosen",  name: { ar: "اخترناه", en: "Chosen" },  next: "ordered" },
  { id: "ordered", name: { ar: "اتطلب",   en: "Ordered" }, next: "bought" },
  { id: "bought",  name: { ar: "اتشرى",   en: "Bought" },  next: "needed" },
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
  const { lang, t, s } = useTongue();
  const brief = (n: number) => (lang === "ar" ? short(n) : shortEn(n));

  const scope = space.items.filter((i) => room === null || i.roomId === room);
  const items = scope.filter((i) => {
    if (filter === "left") return i.status !== "bought";
    if (filter === "bought") return i.status === "bought";
    if (filter === "unpriced") return i.targetPrice === undefined && i.actualPrice === undefined;
    if (filter === "key") return i.priority === 1;
    return true;
  }).sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, lang));

  const roomInfo = room ? report.nest.rooms.find((r) => r.roomId === room) : null;

  return (
    <>
      <h1 className="title">{t("العش", "Nest")}</h1>
      <p className="sub">
        {space.settings.address.label
          ? `${space.settings.address.label}${space.settings.address.area ? ` — ${space.settings.address.area}` : ""}`
          : t("العنوان لسه مش مكتوب — تلاقوه في الضبط.", "No address written yet — you will find it in Config.")}
      </p>

      <section className="block">
        <div className="tiles">
          <div className="panel tile" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Ring value={roomInfo ? roomInfo.readiness : report.nest.readiness} size={78} />
            <div>
              <div className="k">{t("الجاهزية", "Readiness")}</div>
              <div className="n" style={{ marginTop: 6 }}>
                {t("موزونة بالأولوية — الأساسي بيوزن تلات أضعاف الكمالي",
                   "Weighted by priority — an essential counts three times a nice-to-have")}
              </div>
            </div>
          </div>
          <Tile
            k={t("اتشرى", "Bought")}
            v={`${roomInfo ? roomInfo.bought : report.nest.bought}/${roomInfo ? roomInfo.items : report.nest.total}`}
            n={t("عنصر", "items")}
            tone="hot"
          />
          <Tile
            k={t("اتدفع هنا", "Paid here")}
            v={<Money n={roomInfo ? roomInfo.spent : report.nest.rooms.reduce((n, r) => n + r.spent, 0)} space={space} />}
            n={t(`لسه مخطط ${short(roomInfo ? roomInfo.committed : report.nest.rooms.reduce((n, r) => n + r.committed, 0))}`,
                 `${shortEn(roomInfo ? roomInfo.committed : report.nest.rooms.reduce((n, r) => n + r.committed, 0))} still planned`)}
          />
          <Tile
            k={t("من غير سعر", "No price")}
            v={roomInfo ? roomInfo.unpriced : report.money.unpriced}
            n={t("دي مساحة العمى في الميزانية", "This is the blind spot in the budget")}
            tone={(roomInfo ? roomInfo.unpriced : report.money.unpriced) > 0 ? "warn" : "up"}
          />
        </div>
      </section>

      <section className="block">
        <div className="head">
          <span className="label">{t("الغرف", "Rooms")}</span>
          <hr />
          <button className="btn tiny" onClick={() => setNewRoom(true)}>+ {t("غرفة", "Room")}</button>
        </div>
        <div className="rooms stagger">
          <button className={`room hoverable${room === null ? " sel" : ""}`} onClick={() => setRoom(null)}>
            <div className="g">▣</div>
            <div className="n">{t("الشقة كلها", "The whole flat")}</div>
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
                {r.bought}/{r.items}{r.spent > 0 ? ` · ${brief(r.spent)}` : ""}
              </div>
              <Meter value={r.readiness} tone={r.readiness < 30 ? "warn" : undefined} />
            </button>
          ))}
        </div>
        {room && (
          <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
            <button className="btn tiny danger" style={{ flex: "0 0 auto" }} onClick={() => setKillRoom(room)}>
              {t("امسح الغرفة دي", "Delete this room")}
            </button>
          </div>
        )}
      </section>

      <section className="block">
        <div className="head">
          <span className="label">
            {room ? space.rooms.find((r) => r.id === room)?.name : t("كل الحاجات", "Everything")} — {items.length}
          </span>
          <hr />
          <button className="btn tiny ghost" onClick={() => setBulk(true)}>{t("لصق كشف", "Paste a list")}</button>
          <button className="btn tiny primary" onClick={() => setEditing("new")}>+ {t("حاجة", "Item")}</button>
        </div>

        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: t("الكل", "All"), count: scope.length },
            { id: "left", label: t("ناقص", "Needed"), count: scope.filter((i) => i.status !== "bought").length },
            { id: "key", label: t("أساسي", "Essential"), count: scope.filter((i) => i.priority === 1).length },
            { id: "unpriced", label: t("من غير سعر", "No price"), count: scope.filter((i) => i.targetPrice === undefined && i.actualPrice === undefined).length },
            { id: "bought", label: t("اتشرى", "Bought"), count: scope.filter((i) => i.status === "bought").length },
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
                    title={t(`${st.name.ar} ← اضغط لـ${statusOf(st.next).name.ar}`, `${st.name.en} → tap for ${statusOf(st.next).name.en}`)}
                    onClick={() => void act({ type: "item.update", id: i.id, patch: { status: st.next } })}
                  >
                    {i.status === "bought" ? "✓" : i.status === "ordered" ? "◔" : i.status === "chosen" ? "◦" : ""}
                  </button>

                  <div className="grow">
                    <div className="t">
                      <bdi>{i.name}</bdi>
                      {i.qty > 1 && <span className="chip">×{i.qty}</span>}
                      {i.priority === 1 && i.status !== "bought" && <span className="chip bad">{t("أساسي", "essential")}</span>}
                      {i.status !== "needed" && i.status !== "bought" && <span className="chip warn">{s(st.name)}</span>}
                    </div>
                    <div className="m">
                      {[
                        room === null ? space.rooms.find((r) => r.id === i.roomId)?.name : null,
                        i.store, i.note,
                      ].filter(Boolean).join(" · ")}
                      {i.url && <> · <a href={i.url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>{t("لينك", "link")}</a></>}
                    </div>
                  </div>

                  {priceFor === i.id ? (
                    <QuickPrice item={i} onDone={() => setPriceFor(null)} />
                  ) : (
                    <button
                      className={`price ${i.actualPrice !== undefined ? "real" : price !== undefined ? "plan" : "none"}`}
                      style={{ background: "transparent", border: 0 }}
                      onClick={() => setPriceFor(i.id)}
                      title={t("اضغط عشان تكتب السعر", "Tap to write the price")}
                    >
                      {price === undefined
                        ? t("+ سعر", "+ price")
                        : `${fmt(price * (i.qty || 1))} ${space.settings.currency}`}
                    </button>
                  )}

                  <button className="iconbtn" onClick={() => setEditing(i)} aria-label={t("عدّل", "Edit")}>✎</button>
                  <button className="iconbtn danger" onClick={() => setKillItem(i)} aria-label={t("امسح", "Delete")}>✕</button>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            title={t("مفيش حاجات هنا", "Nothing here")}
            note={room
              ? t("زوّدوا أول حاجة للغرفة دي، أو الصقوا كشف كامل مرة واحدة.",
                  "Add the first item to this room, or paste a whole list at once.")
              : t("ابدأوا بغرفة.", "Start with a room.")}
            action={<button className="btn primary" onClick={() => setEditing("new")}>+ {t("حاجة", "Item")}</button>}
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
          text={t(`هتمسح «${killItem.name}» من الكشف.`, `“${killItem.name}” will be removed from the list.`)}
          onNo={() => setKillItem(null)}
          onYes={() => { void act({ type: "item.remove", id: killItem.id }); setKillItem(null); }}
        />
      )}
      {killRoom && (
        <Confirm
          text={t(`هتمسح الغرفة ومعاها ${space.items.filter((i) => i.roomId === killRoom).length} حاجة.`,
                  `The room and its ${space.items.filter((i) => i.roomId === killRoom).length} items will be deleted.`)}
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
  const { t } = useTongue();
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
      <button className="btn tiny" disabled={busy} onClick={() => void save(false)}
              title={t("السعر المتوقع", "The estimate")}>{t("متوقع", "Estimate")}</button>
      <button className="btn tiny primary" disabled={busy} onClick={() => void save(true)}
              title={t("اتدفع فعلًا", "Actually paid")}>{t("اتدفع", "Paid")}</button>
    </div>
  );
}

function ItemSheet({ item, roomId, onClose }: { item: Item | null; roomId: string; onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const { t, s } = useTongue();
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
    <Sheet title={item ? t("تعديل الحاجة", "Edit item") : t("حاجة جديدة", "New item")} onClose={onClose}>
      <Field label={t("الاسم", "Name")}>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
               placeholder={t("غسالة", "Washing machine")} />
      </Field>
      <div className="row">
        <Field label={t("الغرفة", "Room")}>
          <select value={where} onChange={(e) => setWhere(e.target.value)}>
            {space.rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field label={t("الحالة", "Status")}>
          <select value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)}>
            {STATUS.map((x) => <option key={x.id} value={x.id}>{s(x.name)}</option>)}
          </select>
        </Field>
      </div>
      <div className="row">
        <Field label={t("الأولوية", "Priority")}>
          <select value={priority} onChange={(e) => setPriority(Number(e.target.value) as Priority)}>
            <option value={1}>{t("أساسي", "Essential")}</option>
            <option value={2}>{t("مهم", "Important")}</option>
            <option value={3}>{t("كمالي", "Nice to have")}</option>
          </select>
        </Field>
        <Field label={t("العدد", "Quantity")}>
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" dir="ltr" />
        </Field>
      </div>
      <div className="row">
        <Field label={t(`السعر المتوقع (${space.settings.currency} للقطعة)`,
                        `Estimated price (${space.settings.currency} each)`)}>
          <input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="numeric" dir="ltr" placeholder="—" />
        </Field>
        <Field label={t("اللي اتدفع فعلًا", "What was actually paid")}>
          <input value={actual} onChange={(e) => setActual(e.target.value)} inputMode="numeric" dir="ltr" placeholder="—" />
        </Field>
      </div>
      <div className="row">
        <Field label={t("مين دفع", "Who paid")}>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as Actor | "")}>
            <option value="">—</option>
            <option value="both">{t("إحنا", "Us")}</option>
            <option value="him">{space.people.him.name}</option>
            <option value="her">{space.people.her.name}</option>
          </select>
        </Field>
        <Field label={t("المتجر", "Store")}>
          <input value={store} onChange={(e) => setStore(e.target.value)}
                 placeholder={t("اسم المحل", "The shop's name")} />
        </Field>
      </div>
      <Field label={t("لينك", "Link")}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr" placeholder="https://" />
      </Field>
      <Field label={t("ملاحظة", "Note")}>
        <input value={note} onChange={(e) => setNote(e.target.value)}
               placeholder={t("اللون، المقاس، الموديل…", "Colour, size, model…")} />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
        <button className="btn primary" disabled={busy || !name.trim() || !where} onClick={() => void save()}>
          {item ? t("احفظ", "Save") : t("زوّد", "Add")}
        </button>
      </div>
      {item && (
        <p className="footnote" style={{ marginTop: 14 }}>
          {t(`زوّده ${space.people[item.addedBy].name}`, `Added by ${space.people[item.addedBy].name}`)}
          {item.actualPrice !== undefined && item.targetPrice !== undefined
            && t(` · الفرق عن المتوقع: ${fmtMoney((item.actualPrice - item.targetPrice) * (item.qty || 1), space.settings.currency)}`,
                 ` · gap from estimate: ${fmtMoney((item.actualPrice - item.targetPrice) * (item.qty || 1), space.settings.currency)}`)}
        </p>
      )}
    </Sheet>
  );
}

function BulkSheet({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const { t } = useTongue();
  const [where, setWhere] = useState(roomId);
  const [text, setText] = useState("");
  const names = text.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 120);

  return (
    <Sheet title={t("لصق كشف", "Paste a list")} onClose={onClose}>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        {t("سطر لكل حاجة. المكرر في نفس الغرفة بيتشال لوحده.",
           "One line per item. Duplicates within the same room drop out on their own.")}
      </p>
      <Field label={t("الغرفة", "Room")}>
        <select value={where} onChange={(e) => setWhere(e.target.value)}>
          {space.rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </Field>
      <Field label={t(`الكشف — ${names.length} سطر`, `The list — ${names.length} lines`)}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ minHeight: 180 }}
          placeholder={t("سرير\nمرتبة\nدولاب", "Bed\nMattress\nWardrobe")}
          autoFocus
        />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
        <button
          className="btn primary"
          disabled={busy || names.length === 0 || !where}
          onClick={async () => { if (await act({ type: "item.bulk", roomId: where, names })) onClose(); }}
        >
          {t("زوّد", "Add")} {names.length}
        </button>
      </div>
    </Sheet>
  );
}

function RoomSheet({ onClose }: { onClose: () => void }) {
  const { act, busy } = useSpace();
  const { t } = useTongue();
  const [name, setName] = useState("");
  const [glyph, setGlyph] = useState("◇");
  const GLYPHS = ["◇", "⌾", "◈", "◧", "◍", "◉", "▣", "✦", "❖", "◐"];

  return (
    <Sheet title={t("غرفة جديدة", "New room")} onClose={onClose}>
      <Field label={t("الاسم", "Name")}>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
               placeholder={t("غرفة الدريسنج", "Dressing room")} />
      </Field>
      <Field label={t("الرمز", "Glyph")}>
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
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
        <button
          className="btn primary"
          disabled={busy || !name.trim()}
          onClick={async () => { if (await act({ type: "room.add", name, glyph })) onClose(); }}
        >
          {t("زوّد", "Add")}
        </button>
      </div>
    </Sheet>
  );
}
