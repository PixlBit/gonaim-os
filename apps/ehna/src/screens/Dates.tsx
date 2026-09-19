import { useState } from "react";
import {
  arDate, arDayDate, arSpan, arTime, day, daysBetween,
  enDate, enDayDate, enSpan, enTime, today,
  type Actor, type Appointment,
} from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Confirm, Empty, Field, Sheet, Tabs, Who } from "../ui/bits.js";
import { useTongue } from "../lang.js";

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
  const todayStr = today();
  const { lang, t } = useTongue();
  const dayDate = (d: string) => (lang === "ar" ? arDayDate(d) : enDayDate(d));
  const time = (v: string) => (lang === "ar" ? arTime(v) : enTime(v));


  const next = space.appointments
    .filter((a) => day(a.at) >= todayStr && a.status !== "cancelled")
    .sort((a, b) => a.at.localeCompare(b.at));
  const past = space.appointments
    .filter((a) => day(a.at) < todayStr || a.status === "cancelled")
    .sort((a, b) => b.at.localeCompare(a.at));
  const list = view === "next" ? next : past;

  return (
    <>
      <h1 className="title">{t("المواعيد", "Dates")}</h1>
      <p className="sub">
        {next.length > 0
          ? t(`أقرب ميعاد ${arSpan(daysBetween(todayStr, day(next[0]!.at)))} — ${next[0]!.title}`,
              `Next up in ${enSpan(daysBetween(todayStr, day(next[0]!.at)))} — ${next[0]!.title}`)
          : t("مفيش مواعيد جاية.", "Nothing coming up.")}
      </p>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Tabs
          value={view}
          onChange={setView}
          options={[
            { id: "next", label: t("الجاي", "Coming"), count: next.length },
            { id: "past", label: t("اللي فات", "Past"), count: past.length },
          ]}
        />
        <button className="btn primary" style={{ flex: "0 0 auto", marginBottom: 14 }} onClick={() => setEditing("new")}>
          + {t("ميعاد", "Appointment")}
        </button>
      </div>

      {list.length > 0 ? (
        <div className="tl">
          {list.map((a) => {
            const away = daysBetween(todayStr, day(a.at));
            return (
              <div key={a.id} className={`node${day(a.at) < todayStr ? " past" : ""}`}>
                <div className="panel hoverable" style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="num" style={{ color: "var(--violet-hi)", fontSize: 15 }}>{time(a.at)}</span>
                    <strong style={{ flex: 1, fontSize: 15 }}><bdi>{a.title}</bdi></strong>
                    {a.status === "cancelled" && <span className="chip bad">{t("اتلغى", "cancelled")}</span>}
                    {a.status === "done" && <span className="chip on">{t("تم", "done")}</span>}
                    {a.status === "planned" && away >= 0 && (
                      <span className="chip">
                        {away === 0 ? t("النهارده", "today")
                          : away === 1 ? t("بكرة", "tomorrow")
                            : t(`بعد ${arSpan(away)}`, `in ${enSpan(away)}`)}
                      </span>
                    )}
                    <Who actor={a.attendees} space={space} />
                  </div>
                  <div className="m" style={{ marginTop: 5, color: "var(--muted)", fontSize: 13 }}>
                    {dayDate(a.at)}
                    {a.with ? t(` · مع ${a.with}`, ` · with ${a.with}`) : ""}
                    {a.place ? ` · ${a.place}` : ""}
                    {a.durationMin ? t(` · ${a.durationMin} دقيقة`, ` · ${a.durationMin} min`) : ""}
                  </div>
                  {a.note && <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>{a.note}</p>}
                  <div className="row" style={{ marginTop: 11, gap: 7 }}>
                    {a.mapUrl && (
                      <a className="btn tiny ghost" style={{ flex: "0 0 auto" }} href={a.mapUrl} target="_blank" rel="noreferrer">
                        {t("الخريطة", "Map")} ↗
                      </a>
                    )}
                    {a.status === "planned" && (
                      <>
                        <button
                          className="btn tiny ghost"
                          style={{ flex: "0 0 auto" }}
                          disabled={busy}
                          onClick={() => void act({ type: "appointment.update", id: a.id, patch: { status: "done" } })}
                        >{t("تم", "Done")}</button>
                        <button
                          className="btn tiny ghost"
                          style={{ flex: "0 0 auto" }}
                          disabled={busy}
                          onClick={() => void act({ type: "appointment.update", id: a.id, patch: { status: "cancelled" } })}
                        >{t("اتلغى", "Cancelled")}</button>
                      </>
                    )}
                    <span style={{ flex: 1 }} />
                    <button className="iconbtn" onClick={() => setEditing(a)} aria-label={t("عدّل", "Edit")}>✎</button>
                    <button className="iconbtn danger" onClick={() => setKill(a)} aria-label={t("امسح", "Delete")}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title={view === "next" ? t("مفيش مواعيد جاية", "Nothing coming up") : t("مفيش مواعيد فاتت", "Nothing in the past")}
          note={view === "next"
            ? t("القاعة، الكوافير، الفحص الطبي، زيارة العيلة — كله ميعاد.",
                "The venue, the salon, the medical, the family visit — all of it is an appointment.")
            : undefined}
          action={view === "next"
            ? <button className="btn primary" onClick={() => setEditing("new")}>+ {t("ميعاد", "Appointment")}</button>
            : undefined}
        />
      )}

      {editing && <DateSheet appointment={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {kill && (
        <Confirm
          text={t(`هتمسح ميعاد «${kill.title}».`, `The appointment “${kill.title}” will be deleted.`)}
          onNo={() => setKill(null)}
          onYes={() => { void act({ type: "appointment.remove", id: kill.id }); setKill(null); }}
        />
      )}
    </>
  );
}

function DateSheet({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  const { space, act, busy } = useSpace();
  const { t } = useTongue();
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
    <Sheet title={appointment ? t("تعديل الميعاد", "Edit appointment") : t("ميعاد جديد", "New appointment")} onClose={onClose}>
      <Field label={t("الميعاد على إيه", "What for")}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
               placeholder={t("معاينة القاعة", "Viewing the venue")} />
      </Field>
      <div className="row">
        <Field label={t("اليوم", "Day")}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" />
        </Field>
        <Field label={t("الساعة", "Time")}>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} dir="ltr" />
        </Field>
        <Field label={t("المدة (دقيقة)", "Duration (min)")}>
          <input value={duration} onChange={(e) => setDuration(e.target.value)} inputMode="numeric" dir="ltr" placeholder="—" />
        </Field>
      </div>
      <div className="row">
        <Field label={t("مع مين", "With whom")}>
          <input value={withWho} onChange={(e) => setWithWho(e.target.value)}
                 placeholder={t("صاحب القاعة", "The venue owner")} />
        </Field>
        <Field label={t("مين رايح", "Who is going")}>
          <select value={attendees} onChange={(e) => setAttendees(e.target.value as Actor)}>
            <option value="both">{t("إحنا", "Us")}</option>
            <option value="him">{space.people.him.name}</option>
            <option value="her">{space.people.her.name}</option>
          </select>
        </Field>
      </div>
      <Field label={t("المكان", "Place")}>
        <input value={place} onChange={(e) => setPlace(e.target.value)}
               placeholder={t("المعادي — شارع…", "Maadi — street…")} />
      </Field>
      <Field label={t("لينك الخريطة", "Map link")}>
        <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} dir="ltr" placeholder="https://maps…" />
      </Field>
      <Field label={t("ملاحظة", "Note")}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder={t("نسألهم عن…", "Ask them about…")} />
      </Field>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn ghost" onClick={onClose}>{t("إلغاء", "Cancel")}</button>
        <button className="btn primary" disabled={busy || !title.trim()} onClick={() => void save()}>
          {appointment ? t("احفظ", "Save") : t("زوّد", "Add")}
        </button>
      </div>
      <p className="footnote" style={{ marginTop: 12 }}>
        {t(`الميعاد بيتسجّل بالوقت المحلي — ${arDate(date)} الساعة ${arTime(`${date}T${time}`)}`,
           `Stored in local time — ${enDate(date)} at ${enTime(`${date}T${time}`)}`)}
      </p>
    </Sheet>
  );
}
