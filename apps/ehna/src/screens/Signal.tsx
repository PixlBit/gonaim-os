import { arDate, arSpan, enDate, enSpan, fmt, short, shortEn } from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Meter, Ring, Tile } from "../ui/bits.js";
import { Bars, colorFor, Split } from "../ui/charts.js";
import { Oracle } from "../ui/oracle.js";
import { useTongue } from "../lang.js";

/**
 * التحليل.
 *
 * ليست شاشة رسوم بيانية — هي شاشة أحكام. كل رسم تحته جملة تقول ماذا يعني،
 * وفي آخرها لوحة تقول ما **لا** تعرفه الأرقام. الرقم بلا حدوده يُصدَّق
 * أكثر مما يستحق، وهذا أخطر من ألا يكون هناك رقم.
 */
export function Signal() {
  const { space, report } = useSpace();
  const { lang, t, s } = useTongue();
  const span = (n: number) => (lang === "ar" ? arSpan(n) : enSpan(n));
  const brief = (n: number) => (lang === "ar" ? short(n) : shortEn(n));
  const pct = t("٪", "%");
  const { money, nest, missions, life, countdown, attention, forecast, heartbeat } = report;
  const wedding = countdown.wedding && !countdown.wedding.past ? countdown.wedding : null;
  const weeksLeft = wedding ? wedding.daysAway / 7 : null;

  const pace = weeksLeft !== null && missions.finishInWeeks !== null
    ? missions.finishInWeeks <= weeksLeft ? "ok" : "behind"
    : "unknown";

  return (
    <>
      <h1 className="title">{t("المرصد", "Signal")}</h1>
      <p className="sub">
        {t(`كل رقم هنا محسوب من اللي كتبتوه دلوقتي — مفيش حاجة مخزّنة ولا مقدّرة. آخر تحديث ${arDate(report.today)}.`,
           `Every number here is computed from what you have written, right now — nothing stored, nothing guessed. As of ${enDate(report.today)}.`)}
      </p>

      <section className="block">
        <div className="head"><span className="label">{t("الحكم", "The verdict")}</span><hr /></div>
        <div className="tiles stagger">
          <Tile
            k={t("الجاهزية الكلية", "Overall readiness")}
            v={`${nest.readiness}${pct}`}
            n={t(`${nest.bought} من ${nest.total} حاجة`, `${nest.bought} of ${nest.total} items`)}
            tone="hot"
          />
          <Tile
            k={t("إيقاع الإنجاز", "Pace")}
            v={missions.velocity.toFixed(1)}
            n={t("مهمة في الأسبوع — متوسط آخر ٦ أسابيع", "tasks a week — median of the last six")}
            tone={missions.velocity > 0 ? "up" : "warn"}
          />
          <Tile
            k={t("الوصول للتاريخ", "Reaching the date")}
            v={pace === "ok" ? t("مريح", "Comfortable") : pace === "behind" ? t("متأخر", "Behind") : "؟"}
            n={
              pace === "unknown" ? t("محتاج تاريخ فرح وسرعة إنجاز", "Needs a wedding date and a measured pace")
                : missions.finishInWeeks === null ? t("مفيش إنجاز يتقاس عليه", "Nothing closed yet to measure")
                : t(`محتاجين ${Math.round(missions.finishInWeeks)} أسبوع · فاضل ${Math.round(weeksLeft ?? 0)}`,
                    `${Math.round(missions.finishInWeeks)} weeks needed · ${Math.round(weeksLeft ?? 0)} left`)
            }
            tone={pace === "ok" ? "up" : pace === "behind" ? "down" : "warn"}
          />
          <Tile
            k={t("انضباط الأسعار", "Price discipline")}
            v={money.driftPct === 0 ? "—" : `${money.driftPct > 0 ? "+" : ""}${money.driftPct}${pct}`}
            n={money.drift === 0
              ? t("مفيش مقارنة كفاية", "Not enough to compare")
              : t(`فرق ${fmt(Math.abs(money.drift))} ${space.settings.currency} عن المتوقع`,
                  `${fmt(Math.abs(money.drift))} ${space.settings.currency} away from estimate`)}
            tone={money.driftPct > 10 ? "down" : money.driftPct < 0 ? "up" : undefined}
          />
        </div>
      </section>

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 360px" }}>
          <div className="head"><span className="label">{t("جاهزية الغرف", "Room by room")}</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            {nest.rooms.length > 0 ? nest.rooms.map((r) => (
              <div key={r.roomId} style={{ marginBottom: 13 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 5 }}>
                  <span style={{ color: "var(--violet-hi)" }}>{r.glyph}</span>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{r.name}</span>
                  {/* الأرقام وحدها في `.num` (خط أحادي)، والكلمات خارجه —
                      وإلا جاءت المسافة من Plex Mono وهي أعرض، فبان الفراغ مضاعفًا */}
                  <span style={{ fontSize: 12, color: "var(--dust)" }}>
                    <span className="num">{r.bought}/{r.items}</span>
                    {r.unpriced > 0 && <> · <span className="num">{r.unpriced}</span> {t("بلا سعر", "unpriced")}</>}
                  </span>
                  <span className="num" style={{ fontSize: 13 }}>{r.readiness}{pct}</span>
                </div>
                <Meter value={r.readiness} tone={r.readiness < 30 ? "warn" : undefined} />
              </div>
            )) : <p className="sub">{t("مفيش غرف لسه.", "No rooms yet.")}</p>}
            <p className="footnote" style={{ marginTop: 16, lineHeight: 1.9 }}>
              {t("الأقل جاهزية فوق. الترتيب ده مقصود: الغرفة اللي مش بتتعمل هي اللي محتاجة تتشاف الأول.",
                 "Least ready first. That order is deliberate: the room nobody is working on is the one that needs to be seen.")}
            </p>
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 320px" }}>
          <div className="head"><span className="label">{t("توزيع الحِمل", "How the load sits")}</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            <span className="label">{t("المهام المفتوحة", "Open tasks")}</span>
            <div style={{ marginTop: 8 }}>
              <Split
                parts={[
                  { label: space.people.him.name, value: missions.byOwner.him.open, color: space.people.him.accent },
                  { label: space.people.her.name, value: missions.byOwner.her.open, color: space.people.her.accent },
                  { label: t("إحنا", "Us"), value: missions.byOwner.both.open, color: "#22D3EE" },
                ]}
              />
            </div>
            <span className="label" style={{ display: "block", marginTop: 20 }}>{t("اللي اتدفع", "Who paid")}</span>
            <div style={{ marginTop: 8 }}>
              <Split
                parts={[
                  { label: space.people.him.name, value: money.paid.him, color: space.people.him.accent },
                  { label: space.people.her.name, value: money.paid.her, color: space.people.her.accent },
                  { label: t("إحنا", "Us"), value: money.paid.both, color: "#22D3EE" },
                ]}
                unit={brief}
              />
            </div>
            <p className="footnote" style={{ marginTop: 18, lineHeight: 1.9 }}>
              {t("ده مش ميزان حساب — ده عشان تشوفوا لو واحد شايل لوحده من غير ما ياخد باله.",
                 "This is not a settling of accounts — it is so you can see if one of you is carrying it alone without noticing.")}
            </p>
          </div>
        </section>
      </div>

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 340px" }}>
          <div className="head"><span className="label">{t("الإنفاق شهريًا", "Spending by month")}</span><hr /></div>
          <div className="panel" style={{ padding: "18px 16px 12px" }}>
            <Bars
              data={money.byMonth.map((x) => ({ label: x.month.slice(2), value: x.amount }))}
              unit={(n) => `${brief(n)} ${space.settings.currency}`}
            />
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 340px" }}>
          <div className="head"><span className="label">{t("مهام مخلّصة كل أسبوع", "Tasks closed per week")}</span><hr /></div>
          <div className="panel" style={{ padding: "18px 16px 12px" }}>
            <Bars data={missions.doneByWeek.map((x) => ({ label: x.week.slice(5), value: x.count }))} />
          </div>
        </section>
      </div>

      <section className="block">
        <div className="head"><span className="label">{t("الحياة، مش التجهيز بس", "Life, not just logistics")}</span><hr /></div>
        <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
          <div className="panel" style={{ padding: "18px 16px 12px", flex: "2 1 400px" }}>
            <span className="label">{t("ذكريات متسجّلة كل شهر", "Memories logged per month")}</span>
            <div style={{ marginTop: 10 }}>
              <Bars data={life.memoriesByMonth.map((x) => ({ label: x.month.slice(2), value: x.count }))} />
            </div>
            <p className="footnote" style={{ marginTop: 14, lineHeight: 1.9 }}>
              {life.lastMemoryDaysAgo === null
                ? t("لسه مفيش ذكرى واحدة متسجّلة.", "Not one memory logged yet.")
                : life.lastMemoryDaysAgo === 0
                  ? t("آخر ذكرى اتسجّلت النهارده.", "The last memory was logged today.")
                  : t(`آخر ذكرى من ${arSpan(life.lastMemoryDaysAgo)}.`,
                      `The last memory was ${enSpan(life.lastMemoryDaysAgo)} ago.`)}
            </p>
          </div>
          <div className="panel" style={{ padding: 18, flex: "1 1 240px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <Ring
                value={life.wishes.done + life.wishes.planned + life.wishes.someday === 0
                  ? 0
                  : Math.round((life.wishes.done / (life.wishes.done + life.wishes.planned + life.wishes.someday)) * 100)}
                caption="من حاجاتنا"
                tone="cool"
              />
            </div>
            <Split
              parts={[
                { label: "عملناها", value: life.wishes.done, color: "#34D399" },
                { label: "متخططة", value: life.wishes.planned, color: "#22D3EE" },
                { label: "يوم ما", value: life.wishes.someday, color: colorFor(0) },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="block">
        <div className="head"><span className="label">{t("الأسابيع الجاية — ضغط متوقَّع", "The weeks ahead — projected load")}</span><hr /></div>
        <div className="panel" style={{ padding: 18 }}>
          <div className="weeks">
            {forecast.weeks.map((w) => (
              <div
                key={w.week}
                className={`w${w.score >= 80 ? " hot" : forecast.calm?.week === w.week ? " calm" : ""}`}
                title={`${s(w.label)}: ${s(w.note)}`}
              >
                <div className="bar" style={{ height: `${Math.max(4, w.score)}%` }} />
                <div className="cap">{s(w.label).split(" ")[0]}</div>
              </div>
            ))}
          </div>
          <p className="sub" style={{ margin: "18px 0 0" }}>
            {t(`الضغط محسوب على سعتكم الحقيقية: ${Math.round(forecast.capacity)} حاجة في الأسبوع، من سرعة إنجازكم نفسها. المواعيد والمهام والمحطات المكتوبة بس — مفيش تخمين.`,
               `Load is measured against your real capacity: ${Math.round(forecast.capacity)} things a week, taken from your own pace. Written appointments, tasks and milestones only — no guessing.`)}
          </p>
          <div className="row" style={{ gap: 12, marginTop: 14 }}>
            {forecast.peak && (
              <div className="panel attn soon" style={{ flex: "1 1 260px", margin: 0 }}>
                <h3>{t("أضغط أسبوع", "Heaviest week")}: {s(forecast.peak.label)}</h3>
                <p>{s(forecast.peak.note)} — {forecast.peak.score}/100.</p>
              </div>
            )}
            {forecast.calm && (
              <div className="panel attn watch" style={{ flex: "1 1 260px", margin: 0 }}>
                <h3>{t("أهدى أسبوع", "Calmest week")}: {s(forecast.calm.label)}</h3>
                <p>
                  {s(forecast.calm.note)}.{" "}
                  {t("احجزوا فيه ليلة ليكم قبل ما حاجة تاخده.",
                     "Book a night for yourselves in it before something else takes it.")}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="head"><span className="label">{t("نبض العلاقة", "Relationship heartbeat")}</span><hr /></div>
        <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
          <div className="panel" style={{ padding: 18, flex: "2 1 380px" }}>
            <div className="weeks" style={{ height: 96 }}>
              {heartbeat.weeks.map((w) => {
                const total = Math.max(1, ...heartbeat.weeks.map((x) => x.care + x.logistics));
                return (
                  <div key={w.week} className="w" title={t(`${w.care} شخصي · ${w.logistics} تجهيز`, `${w.care} personal · ${w.logistics} logistics`)}>
                    <div className="bar" style={{
                      height: `${(w.care / total) * 100}%`,
                      background: "linear-gradient(to top, #BE185D, #F472B6)",
                    }} />
                    <div className="bar" style={{
                      height: `${(w.logistics / total) * 100}%`,
                      background: "rgba(110, 92, 144, .5)", borderRadius: "0 0 3px 3px",
                    }} />
                  </div>
                );
              })}
            </div>
            <div className="legend" style={{ marginTop: 14 }}>
              <span><i style={{ background: "#F472B6" }} />{t("شخصي — ذكريات ورسايل وحاجات عملتوها", "Personal — memories, notes, things you did")}</span>
              <span><i style={{ background: "rgba(110,92,144,.6)" }} />{t("تجهيز — مشتريات ومصاريف ومهام", "Logistics — purchases, expenses, tasks")}</span>
            </div>
          </div>
          <div className="panel" style={{ padding: 18, flex: "1 1 240px" }}>
            <div className="k label">{t("النبض", "Pulse")}</div>
            <div className="v" style={{
              fontFamily: "var(--mono)", fontSize: 34, marginTop: 8,
              color: heartbeat.verdict === "warm" ? "var(--green)"
                : heartbeat.verdict === "busy" ? "var(--amber)" : "var(--red)",
            }}>
              {heartbeat.careShare === null ? "—" : `${heartbeat.careShare}${pct}`}
            </div>
            <p className="sub" style={{ marginTop: 10 }}>{s(heartbeat.line)}</p>
            {heartbeat.sinceCare !== null && (
              <p className="footnote" style={{ lineHeight: 1.9 }}>
                {t(`آخر حاجة شخصية اتسجّلت من ${arSpan(heartbeat.sinceCare)}.`,
                   `The last personal thing logged was ${enSpan(heartbeat.sinceCare)} ago.`)}
                {heartbeat.longestGap !== null && t(` أطول فترة بين ذكريتين: ${arSpan(heartbeat.longestGap)}.`,
                                                    ` Longest gap between memories: ${enSpan(heartbeat.longestGap)}.`)}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="head"><span className="label">{t("كل الملاحظات", "Every note")} — {attention.length}</span><hr /></div>
        {attention.length > 0 ? (
          <div className="attn-grid">
            {attention.map((a) => (
              <div key={a.code} className={`panel attn ${a.level}`}>
                <h3>{s(a.title)}</h3>
                <p>{s(a.why)}</p>
                {a.move && <div className="move">{s(a.move)}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="silent">
            <strong>{t("مفيش ملاحظة واحدة", "Not one note")}</strong>
            {t("الأرقام كلها في مكانها.", "Every number is where it should be.")}
          </div>
        )}
      </section>

      <section className="block">
        <div className="head"><span className="label">{t("خد الأرقام دي واعمل بيها خطة", "Turn these numbers into a plan")}</span><hr /></div>
        <Oracle kind="week" title={t("ترتيب الأسبوع", "Ordering the week")} />
      </section>

      {/* أهم لوحة في الشاشة: حدود ما تعرفه الأرقام */}
      <section className="block">
        <div className="head"><span className="label">{t("اللي الأرقام دي معرفهوش", "What these numbers do not know")}</span><hr /></div>
        <div className="panel" style={{ padding: 20 }}>
          <ul style={{ margin: 0, paddingInlineStart: 18, color: "var(--muted)", lineHeight: 2.1, fontSize: 13.5 }}>
            <li>
              <b style={{ color: money.unpriced > 0 ? "var(--amber)" : "var(--bone)" }}>{money.unpriced}</b>{" "}
              {t("حاجة من غير سعر — المتوقع الكلي أقل من الحقيقة بقيمتها.",
                 "items with no price — the projected total is short by exactly their value.")}
            </li>
            <li>
              {t("المصاريف اللي مش مكتوبة هنا مش موجودة في أي رقم. المنصة بتحسب اللي بتقولوه بس.",
                 "Spending that is not written here exists in no number. The platform counts only what you tell it.")}
            </li>
            <li>
              {t("معدّل الصرف محسوب على آخر ٨ أسابيع. لو التجهيز لسه في أوله، المعدل ده هيتغير.",
                 "The burn rate covers the last eight weeks. Early in the preparations, that rate will change.")}
            </li>
            <li>
              {t("سرعة الإنجاز على آخر ٦ أسابيع — أسبوع سفر أو شغل بيخلّيها تبان أقل من الحقيقة.",
                 "Pace covers the last six weeks — a week of travel or work makes it read lower than the truth.")}
            </li>
            {!wedding && <li>{t("مفيش تاريخ فرح، فكل توقع مبني على الوقت مش موجود أصلًا.",
                                "There is no wedding date, so every time-based projection does not exist at all.")}</li>}
            {space.settings.budget <= 0 && <li>{t("الميزانية بصفر، فمفيش سقف يتقاس عليه.",
                                                  "The budget is zero, so there is no ceiling to measure against.")}</li>}
          </ul>
        </div>
      </section>
    </>
  );
}
