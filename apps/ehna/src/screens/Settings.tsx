import { useState } from "react";
import { arDate, SEED_COUNTS } from "@gonaim/couple";
import { api, type ApiError } from "../api.js";
import { useApp, useSpace } from "../store.js";
import { Confirm, Field, Sheet } from "../ui/bits.js";
import { useTongue } from "../lang.js";

/**
 * الإعدادات.
 *
 * وفيها الوعد الأخير: **بياناتكم ملككم**. زر التصدير ينزّل المساحة كلها
 * ملفًا واحدًا يُقرأ بأي محرر — لا تصدير "مميز" ولا نصف بيانات. الوعد
 * الذي لا يوجد له زر يعمل ليس وعدًا.
 */
export function Settings() {
  const { space, me, sessions, act, busy } = useSpace();
  const { refresh, setState } = useApp();
  const { lang, t, set: setLang } = useTongue();
  const [problem, setProblem] = useState<string | null>(null);
  const [password, setPassword] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [title, setTitle] = useState(space.settings.title);
  const [currency, setCurrency] = useState(space.settings.currency);
  const [budget, setBudget] = useState(String(space.settings.budget || ""));
  const [together, setTogether] = useState(space.settings.together ?? "");

  const a = space.settings.address;
  const [label, setLabel] = useState(a.label ?? "");
  const [area, setArea] = useState(a.area ?? "");
  const [city, setCity] = useState(a.city ?? "");
  const [floor, setFloor] = useState(a.floor ?? "");
  const [mapUrl, setMapUrl] = useState(a.mapUrl ?? "");
  const [addressNote, setAddressNote] = useState(a.note ?? "");

  const you = space.people[me];
  const [name, setName] = useState(you.name);
  const [accent, setAccent] = useState(you.accent);
  const [line, setLine] = useState(you.line ?? "");

  const seeded = space.items.filter((i) => i.seeded).length + space.tasks.filter((t) => t.seeded).length;

  return (
    <>
      <h1 className="title">{t("الضبط", "Config")}</h1>
      <p className="sub">{space.settings.title} · نسخة المساحة {space.version}</p>

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 340px" }}>
          <div className="head"><span className="label">المساحة</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            <div className="row">
              <Field label="الاسم"><input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
              <Field label="العملة"><input value={currency} onChange={(e) => setCurrency(e.target.value)} /></Field>
            </div>
            <div className="row">
              <Field label="الميزانية الكلية">
                <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="numeric" dir="ltr" placeholder="0" />
              </Field>
              <Field label="إحنا مع بعض من">
                <input type="date" value={together} onChange={(e) => setTogether(e.target.value)} dir="ltr" />
              </Field>
            </div>
            <button
              className="btn primary"
              disabled={busy}
              onClick={() => void act({
                type: "settings.update",
                title, currency,
                budget: budget.trim() === "" ? 0 : Number(budget),
                together: together || null,
              })}
            >{t("احفظ", "Save")}</button>
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 340px" }}>
          <div className="head"><span className="label">مكان الشقة</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            <Field label="العنوان"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="١٢ شارع…" /></Field>
            <div className="row">
              <Field label="المنطقة"><input value={area} onChange={(e) => setArea(e.target.value)} /></Field>
              <Field label="المدينة"><input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
              <Field label="الدور"><input value={floor} onChange={(e) => setFloor(e.target.value)} /></Field>
            </div>
            <Field label="لينك الخريطة">
              <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} dir="ltr" placeholder="https://maps…" />
            </Field>
            <Field label="ملاحظة"><input value={addressNote} onChange={(e) => setAddressNote(e.target.value)} placeholder="علامة مميزة، اسم البواب…" /></Field>
            <div className="row">
              <button
                className="btn primary"
                disabled={busy}
                onClick={() => void act({
                  type: "settings.update",
                  address: {
                    label: label || null, area: area || null, city: city || null,
                    floor: floor || null, mapUrl: mapUrl || null, note: addressNote || null,
                  },
                })}
              >{t("احفظ", "Save")}</button>
              {a.mapUrl && (
                <a className="btn ghost" href={a.mapUrl} target="_blank" rel="noreferrer" style={{ textAlign: "center" }}>
                  افتح الخريطة ↗
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 320px" }}>
          <div className="head"><span className="label">{t("أنت", "You")}</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            <Field label={t("اسمك", "Your name")}><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label={t("لونك", "Your colour")}>
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} style={{ width: 54, padding: 3, flex: "0 0 auto" }} />
                <span className="num" style={{ color: accent }}>{accent}</span>
              </div>
            </Field>
            <Field label={t("جملتك", "Your line")}>
              <input value={line} onChange={(e) => setLine(e.target.value)}
                     placeholder={t("حاجة تحب تفتكرها", "Something you want to remember")} />
            </Field>

            {/* اللغة هنا لا في «المساحة»: التفضيل يخصّ القارئ، فلو عاش في
                إعدادات المساحة صار اختيار أحدهما فرضًا على الآخر. */}
            <Field label={t("اللغة اللي بتقرا بيها", "The language you read in")}>
              <div className="row" style={{ gap: 8 }}>
                <button
                  className={`btn${lang === "ar" ? " primary" : " ghost"}`}
                  disabled={busy || lang === "ar"}
                  onClick={() => void setLang("ar")}
                >العربية</button>
                <button
                  className={`btn${lang === "en" ? " primary" : " ghost"}`}
                  disabled={busy || lang === "en"}
                  lang="en"
                  onClick={() => void setLang("en")}
                >English</button>
              </div>
              <p className="sub" style={{ margin: "8px 0 0", fontSize: 12 }}>
                {t("ده اختيارك إنت لوحدك — الطرف التاني بيفضل يقرا بلغته.",
                   "This is yours alone — the other of you keeps reading in theirs.")}
              </p>
            </Field>
            <div className="row">
              <button
                className="btn primary"
                disabled={busy}
                onClick={() => void act({ type: "person.update", key: me, name, accent, line: line || null })}
              >{t("احفظ", "Save")}</button>
              <button className="btn ghost" onClick={() => setPassword(true)}>{t("غيّر كلمة السر", "Change password")}</button>
            </div>
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 320px" }}>
          <div className="head"><span className="label">الأجهزة الداخلة</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            <div className="rows">
              {sessions.map((s) => (
                <div key={s.id} className="line" style={{ background: "transparent" }}>
                  <i className="dotcolor" style={{ color: space.people[s.key].accent, width: 8, height: 8 }} />
                  <div className="grow">
                    <div className="t" style={{ fontSize: 13.5 }}>
                      {s.agent ?? "جهاز"} — {space.people[s.key].name}
                      {s.current && <span className="chip on">دلوقتي</span>}
                    </div>
                    <div className="m">آخر ظهور {arDate(s.lastSeenAt)}</div>
                  </div>
                  {s.key === me && !s.current && (
                    <button
                      className="btn tiny danger"
                      onClick={() => {
                        // فشل الطلب يُعرَض ولا يُسقط الشاشة بوعد مرفوض بلا ماسك
                        void api.revoke(s.id).then(setState, (err: ApiError) => setProblem(err.message));
                      }}
                    >اقفله</button>
                  )}
                </div>
              ))}
            </div>
            {problem && <div className="err">{problem}</div>}
            <p className="label" style={{ marginTop: 14, lineHeight: 1.9 }}>
              كل واحد بيقفل أجهزته هو. تغيير كلمة السر بيقفل باقي أجهزتك تلقائيًا.
            </p>
          </div>
        </section>
      </div>

      <section className="block">
        <div className="head"><span className="label">بياناتكم</span><hr /></div>
        <div className="panel" style={{ padding: 18 }}>
          <p style={{ marginTop: 0, color: "var(--muted)", fontSize: 13.5, lineHeight: 1.9 }}>
            كل اللي هنا ملككم. التصدير بينزّل المساحة كلها — المهام والعفش والفلوس
            والمواعيد والذكريات والرسايل — في ملف واحد يتقري بأي محرر، من غير أي حاجة ناقصة.
          </p>
          <div className="row">
            <a className="btn ghost" href="/api/export" style={{ textAlign: "center" }} download>
              نزّل نسخة كاملة
            </a>
            <button className="btn ghost" disabled={busy} onClick={() => void refresh()}>حدّث الشاشة</button>
            {seeded > 0 && (
              <button className="btn danger" onClick={() => setClearing(true)}>
                امسح كشف التجهيز الافتراضي ({seeded})
              </button>
            )}
          </div>
          {seeded > 0 && (
            <p className="label" style={{ marginTop: 12, lineHeight: 1.9 }}>
              الكشف الافتراضي ({SEED_COUNTS.items} حاجة و{SEED_COUNTS.tasks} مهمة) بدأ معاكم.
              أي سطر لمستوه بقى بتاعكم ومش هيتمسح.
            </p>
          )}
        </div>
      </section>

      {password && <PasswordSheet onClose={() => setPassword(false)} />}
      {clearing && (
        <Confirm
          text={`هيتمسح ${seeded} سطر لسه ماحدش لمسه من الكشف الافتراضي.`}
          onNo={() => setClearing(false)}
          onYes={() => { void act({ type: "seed.clear" }); setClearing(false); }}
        />
      )}
    </>
  );
}

function PasswordSheet({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (next !== again) return setError("الجديدة مش زي تأكيدها.");
    setSaving(true);
    setError(null);
    try {
      await api.password(current, next);
      onClose();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="تغيير كلمة السر" onClose={onClose}>
      <Field label="الحالية">
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} dir="ltr" autoFocus />
      </Field>
      <Field label="الجديدة">
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} dir="ltr" />
      </Field>
      <Field label="تأكيد الجديدة">
        <input type="password" value={again} onChange={(e) => setAgain(e.target.value)} dir="ltr" />
      </Field>
      {error && <div className="err">{error}</div>}
      <p className="label" style={{ marginTop: 12, lineHeight: 1.9 }}>
        ١٠ حروف على الأقل. التغيير بيقفل باقي أجهزتك.
      </p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn ghost" onClick={onClose}>إلغاء</button>
        <button className="btn primary" disabled={saving || !current || !next} onClick={() => void save()}>غيّرها</button>
      </div>
    </Sheet>
  );
}
