import { useState } from "react";
import { arDate, arDayDate, arSpan, arTime, day, daysBetween, today, type Actor, type Appointment } from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Sheet, Tabs, Who } from "../ui/bits.js";

/**
 * المواعيد.
 *
 * الوقت هنا محلي بلا منطقة زمنية: `2026-04-10T19:30` تعني السابعة ونصف
 * مساءً عندكم، مهما كان إعداد الجهاز. تخزينه بـUTC كان هيحوّل ميعاد
 * الكوافير لساعة تانية لو اتفتح من تليفون بتوقيت مختلف — وهو خطأ لا
 * يُكتشف إلا يوم الميعاد نفسه.
 */

type View = "next" | "past";

export function Dates() {
  const { space, act, busy } = useSpace();
  const [view, setView] = useState<View>("next");
  const [editing, setEditing] = useState<Appointment | "new" | null>(null);
  const [kill, setKill] = useState<Appointment | null>(null);
  const t = today();

  const next = space.appointments
    .filter((a) => day(a.at) >= t && a.status !== "cancelled")
    .sort((a, b) => a.at.localeCompare(b.at));
  const past = space.appointments
    .filter((a) => day(a.at) < t || a.status === "cancelled")
    .sort((a, b) => b.at.localeCompare(a.at));
  const list = view === "next" ? next : past;

  return (
    <>
      <h1 className="title">المواعيد</h1>
      <p className="sub">
        {next.length > 0
          ? `أقرب ميعاد ${arSpan(daysBetween(t, day(next[0]!.at)))} — ${next[0]!.title}`
          : "مفيش مواعيد جاية."}
      </p>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Tabs
          value={view}
          onChange={setView}
          options={[{ id: "next", label: "الجاي", count: next.length }, { id: "past", label: "اللي فات", count: past.length }]}
        />
        <button className="btn primary" style={{ flex: "0 0 auto", marginBottom: 14 }} onClick={() => setEditing("new")}>
          + ميعاد
        </button>
      </div>

      {list.length > 0 ? (
        <div className="tl">
          {list.map((a) => {
            const away = daysBetween(t, day(a.at));
            return (
              <div key={a.id} className={`node${day(a.at) < t ? " past" : ""}`}>
                <div className="panel hoverable" style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="num" style={{ color: "var(--violet-hi)", fontSize: 15 }}>{arTime(a.at)}</span>
                    <strong style={{ flex: 1, fontSize: 15 }}>{a.title}</strong>
                    {a.status === "cancelled" && <span className="chip bad">اتلغى</span>}
                    {a.status === "done" && <span className="chip on">تم</span>}
                    {a.status === "planned" && away >= 0 && (
                      <span className="chip">{away === 0 ? "النهارده" : away === 1 ? "بكرة" : `بعد ${arSpan(away)}`}</span>
                    )}
                    <Who actor={a.attendees} space={space} />
                  </div>
                  <div className="m" style={{ marginTop: 5, color: "var(--muted)", fontSize: 13 }}>
                    {arDayDate(a.at)}
                    {a.with ? ` · مع ${a.with}` : ""}
                    {a.place ? ` · ${a.place}` : ""}
                    {a.durationMin ? ` · ${a.durationMin} دقيقة` : ""}
                  </div>
                  {a.note && <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>{a.note}</p>}
                  <div className="row" style={{ marginTop: 11, gap: 7 }}>
                    {a.mapUrl && (
                      <a className="btn tiny ghost" style={{ flex: "0 0 auto" }} href={a.mapUrl} target="_blank" rel="noreferrer">
                        الخريطة ↗
                      </a>
                    )}
                    {a.status === "planned" && (
                      <>
                        <button
                          className="btn tiny ghost"
                          style={{ flex: "0 0 auto" }}
                          disabled={busy}
                          onClick={() => void act({ type: "appointment.update", id: a.id, patch: { status: "done" } })}
                        >تم</button>
                        <button
                          className="btn tiny ghost"
                          style={{ flex: "0 0 auto" }}
                          disabled={busy}
                          onClick={() => void act({ type: "appointment.update", id: a.id, patch: { status: "cancelled" } })}
                        >اتلغى</button>
                      </>
                    )}
                    <span style={{ flex: 1 }} />
                    <button className="iconbtn" onClick={() => setEditing(a)} aria-label="عدّل">✎</button>
                    <button className="iconbtn danger" onClick={() => setKill(a)} aria-label="امسح">✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title={view === "next" ? "مفيش مواعيد جاية" : "مفيش مواعيد فاتت"}
          note={view === "next" ? "القاعة، الكوافير، الفحص الطبي، زيارة العيلة — كله ميعاد." : undefined}
          action={view === "next" ? <button className="btn primary" onClick={() => setEditing("new")}>+ ميعاد</button> : undefined}
        />
      )}

      {editing && <DateSheet appointment={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {kill && (
        <Confirm
          text={`هتمسح ميعاد «${kill.title}».`}
          onNo={() => setKill(null)}
          onYes={() => { void act({ type: "appointment.remove", id: kill.id }); setKill(null); }}
        />
      )}
    </>
  );
}

function DateSheet({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const [title, setTitle] = useState(appointment?.title ?? "");
  const [date, setDate] = useState(appointment ? appointment.at.slice(0, 10) : today());
  const [time, setTime] = useState(appointment ? appointment.at.slice(11, 16) : "19:00");
  const [place, setPlace] = useState(appointment?.place ?? "");
  const [mapUrl, setMapUrl] = useState(appointment?.mapUrl ?? "");
  const [withWho, setWithWho] = useState(appointment?.with ?? "");
  const [attendees, setAttendees] = useState<Actor>(appointment?.attendees ?? "both");
  const [duration, setDuration] = useState(appointment?.durationMin === undefined ? "" : String(appointment.durationMin));
  const [note, setNote] = useState(appointment?.note ?? "");

  async function save() {
    const at = `${date}T${time}`;
    const shared = {
      title, at,
      durationMin: duration.trim() === "" ? null : Number(duration),
      place: place || null, mapUrl: mapUrl || null, with: withWho || null,
      attendees, note: note || null,
    };
    const done = appointment
      ? await act({ type: "appointment.update", id: appointment.id, patch: shared })
      : await act({ type: "appointment.add", ...shared });
    if (done) onClose();
  }

  return (
    <Sheet title={appointment ? "تعديل الميعاد" : "ميعاد جديد"} onClose={onClose}>
      <Field label="الميعاد على إيه">
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="معاينة القاعة" />
      </Field>
      <div className="row">
        <Field label="اليوم">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" />
        </Field>
        <Field label="الساعة">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} dir="ltr" />
        </Field>
        <Field label="المدة (دقيقة)">
          <input value={duration} onChange={(e) => setDuration(e.target.value)} inputMode="numeric" dir="ltr" placeholder="—" />
        </Field>
      </div>
      <div className="row">
        <Field label="مع مين">
          <input value={withWho} onChange={(e) => setWithWho(e.target.value)} placeholder="صاحب القاعة" />
        </Field>
        <Field label="مين رايح">
          <select value={attendees} onChange={(e) => setAttendees(e.target.value as Actor)}>
            <option value="both">إحنا</option>
            <option value="him">{space.people.him.name}</option>
            <option value="her">{space.people.her.name}</option>
          </select>
        </Field>
      </div>
      <Field label="المكان">
        <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="المعادي — شارع…" />
      </Field>
      <Field label="لينك الخريطة">
        <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} dir="ltr" placeholder="https://maps…" />
      </Field>
      <Field label="ملاحظة">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="نسألهم عن…" />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button className="btn primary" disabled={busy || !title.trim()} onClick={() => void save()}>
          {appointment ? "احفظ" : "زوّد"}
        </button>
      </div>
      <p className="label" style={{ marginTop: 12 }}>
        الميعاد بيتسجّل بالوقت المحلي — {arDate(date)} الساعة {arTime(`${date}T${time}`)}
      </p>
    </Sheet>
  );
}
