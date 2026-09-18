import { arDate, arSpan, fmt, short } from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Meter, Ring, Tile } from "../ui/bits.js";
import { Bars, colorFor, Split } from "../ui/charts.js";
import { Oracle } from "../ui/oracle.js";

/**
 * التحليل.
 *
 * ليست شاشة رسوم بيانية — هي شاشة أحكام. كل رسم تحته جملة تقول ماذا يعني،
 * وفي آخرها لوحة تقول ما **لا** تعرفه الأرقام. الرقم بلا حدوده يُصدَّق
 * أكثر مما يستحق، وهذا أخطر من ألا يكون هناك رقم.
 */
export function Signal() {
  const { space, report } = useSpace();
  const { money, nest, missions, life, countdown, attention, forecast, heartbeat } = report;
  const wedding = countdown.wedding && !countdown.wedding.past ? countdown.wedding : null;
  const weeksLeft = wedding ? wedding.daysAway / 7 : null;

  const pace = weeksLeft !== null && missions.finishInWeeks !== null
    ? missions.finishInWeeks <= weeksLeft ? "ok" : "behind"
    : "unknown";

  return (
    <>
      <h1 className="title">التحليل</h1>
      <p className="sub">
        كل رقم هنا محسوب من اللي كتبتوه دلوقتي — مفيش حاجة مخزّنة ولا مقدّرة.
        آخر تحديث {arDate(report.today)}.
      </p>

      <section className="block">
        <div className="head"><span className="label">الحكم</span><hr /></div>
        <div className="tiles stagger">
          <Tile
            k="الجاهزية الكلية"
            v={`${nest.readiness}٪`}
            n={`${nest.bought} من ${nest.total} حاجة`}
            tone="hot"
          />
          <Tile
            k="إيقاع الإنجاز"
            v={missions.velocity.toFixed(1)}
            n="مهمة في الأسبوع — متوسط آخر ٦ أسابيع"
            tone={missions.velocity > 0 ? "up" : "warn"}
          />
          <Tile
            k="الوصول للتاريخ"
            v={pace === "ok" ? "مريح" : pace === "behind" ? "متأخر" : "؟"}
            n={
              pace === "unknown" ? "محتاج تاريخ فرح وسرعة إنجاز"
                : missions.finishInWeeks === null ? "مفيش إنجاز يتقاس عليه"
                : `محتاجين ${Math.round(missions.finishInWeeks)} أسبوع · فاضل ${Math.round(weeksLeft ?? 0)}`
            }
            tone={pace === "ok" ? "up" : pace === "behind" ? "down" : "warn"}
          />
          <Tile
            k="انضباط الأسعار"
            v={money.driftPct === 0 ? "—" : `${money.driftPct > 0 ? "+" : ""}${money.driftPct}٪`}
            n={money.drift === 0 ? "مفيش مقارنة كفاية" : `فرق ${fmt(Math.abs(money.drift))} ${space.settings.currency} عن المتوقع`}
            tone={money.driftPct > 10 ? "down" : money.driftPct < 0 ? "up" : undefined}
          />
        </div>
      </section>

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 360px" }}>
          <div className="head"><span className="label">جاهزية الغرف</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            {nest.rooms.length > 0 ? nest.rooms.map((r) => (
              <div key={r.roomId} style={{ marginBottom: 13 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 5 }}>
                  <span style={{ color: "var(--violet-hi)" }}>{r.glyph}</span>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{r.name}</span>
                  <span className="num" style={{ fontSize: 12, color: "var(--dust)" }}>
                    {r.bought}/{r.items}{r.unpriced > 0 ? ` · ${r.unpriced} بلا سعر` : ""}
                  </span>
                  <span className="num" style={{ fontSize: 13 }}>{r.readiness}٪</span>
                </div>
                <Meter value={r.readiness} tone={r.readiness < 30 ? "warn" : undefined} />
              </div>
            )) : <p className="sub">مفيش غرف لسه.</p>}
            <p className="label" style={{ marginTop: 16, lineHeight: 1.9 }}>
              الأقل جاهزية فوق. الترتيب ده مقصود: الغرفة اللي مش بتتعمل هي اللي
              محتاجة تتشاف الأول.
            </p>
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 320px" }}>
          <div className="head"><span className="label">توزيع الحِمل</span><hr /></div>
          <div className="panel" style={{ padding: 18 }}>
            <span className="label">المهام المفتوحة</span>
            <div style={{ marginTop: 8 }}>
              <Split
                parts={[
                  { label: space.people.him.name, value: missions.byOwner.him.open, color: space.people.him.accent },
                  { label: space.people.her.name, value: missions.byOwner.her.open, color: space.people.her.accent },
                  { label: "إحنا", value: missions.byOwner.both.open, color: "#22D3EE" },
                ]}
              />
            </div>
            <span className="label" style={{ display: "block", marginTop: 20 }}>اللي اتدفع</span>
            <div style={{ marginTop: 8 }}>
              <Split
                parts={[
                  { label: space.people.him.name, value: money.paid.him, color: space.people.him.accent },
                  { label: space.people.her.name, value: money.paid.her, color: space.people.her.accent },
                  { label: "إحنا", value: money.paid.both, color: "#22D3EE" },
                ]}
                unit={(n) => short(n)}
              />
            </div>
            <p className="label" style={{ marginTop: 18, lineHeight: 1.9 }}>
              ده مش ميزان حساب — ده عشان تشوفوا لو واحد شايل لوحده من غير ما ياخد باله.
            </p>
          </div>
        </section>
      </div>

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 340px" }}>
          <div className="head"><span className="label">الإنفاق شهريًا</span><hr /></div>
          <div className="panel" style={{ padding: "18px 16px 12px" }}>
            <Bars
              data={money.byMonth.map((x) => ({ label: x.month.slice(2), value: x.amount }))}
              unit={(n) => `${short(n)} ${space.settings.currency}`}
            />
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 340px" }}>
          <div className="head"><span className="label">مهام مخلّصة كل أسبوع</span><hr /></div>
          <div className="panel" style={{ padding: "18px 16px 12px" }}>
            <Bars data={missions.doneByWeek.map((x) => ({ label: x.week.slice(5), value: x.count }))} />
          </div>
        </section>
      </div>

      <section className="block">
        <div className="head"><span className="label">الحياة، مش التجهيز بس</span><hr /></div>
        <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
          <div className="panel" style={{ padding: "18px 16px 12px", flex: "2 1 400px" }}>
            <span className="label">ذكريات متسجّلة كل شهر</span>
            <div style={{ marginTop: 10 }}>
              <Bars data={life.memoriesByMonth.map((x) => ({ label: x.month.slice(2), value: x.count }))} />
            </div>
            <p className="label" style={{ marginTop: 14, lineHeight: 1.9 }}>
              {life.lastMemoryDaysAgo === null
                ? "لسه مفيش ذكرى واحدة متسجّلة."
                : life.lastMemoryDaysAgo === 0
                  ? "آخر ذكرى اتسجّلت النهارده."
                  : `آخر ذكرى من ${arSpan(life.lastMemoryDaysAgo)}.`}
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
        <div className="head"><span className="label">الأسابيع الجاية — ضغط متوقَّع</span><hr /></div>
        <div className="panel" style={{ padding: 18 }}>
          <div className="weeks">
            {forecast.weeks.map((w) => (
              <div
                key={w.week}
                className={`w${w.score >= 80 ? " hot" : forecast.calm?.week === w.week ? " calm" : ""}`}
                title={`${w.label}: ${w.note}`}
              >
                <div className="bar" style={{ height: `${Math.max(4, w.score)}%` }} />
                <div className="cap">{w.label.split(" ")[0]}</div>
              </div>
            ))}
          </div>
          <p className="sub" style={{ margin: "18px 0 0" }}>
            الضغط محسوب على سعتكم الحقيقية: {Math.round(forecast.capacity)} حاجة في الأسبوع،
            من سرعة إنجازكم نفسها. المواعيد والمهام والمحطات المكتوبة بس — مفيش تخمين.
          </p>
          <div className="row" style={{ gap: 12, marginTop: 14 }}>
            {forecast.peak && (
              <div className="panel attn soon" style={{ flex: "1 1 260px", margin: 0 }}>
                <h3>أضغط أسبوع: {forecast.peak.label}</h3>
                <p>{forecast.peak.note} — {forecast.peak.score}/100.</p>
              </div>
            )}
            {forecast.calm && (
              <div className="panel attn watch" style={{ flex: "1 1 260px", margin: 0 }}>
                <h3>أهدى أسبوع: {forecast.calm.label}</h3>
                <p>{forecast.calm.note}. احجزوا فيه ليلة ليكم قبل ما حاجة تاخده.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="head"><span className="label">نبض العلاقة</span><hr /></div>
        <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
          <div className="panel" style={{ padding: 18, flex: "2 1 380px" }}>
            <div className="weeks" style={{ height: 96 }}>
              {heartbeat.weeks.map((w) => {
                const total = Math.max(1, ...heartbeat.weeks.map((x) => x.care + x.logistics));
                return (
                  <div key={w.week} className="w" title={`${w.care} شخصي · ${w.logistics} تجهيز`}>
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
              <span><i style={{ background: "#F472B6" }} />شخصي — ذكريات ورسايل وحاجات عملتوها</span>
              <span><i style={{ background: "rgba(110,92,144,.6)" }} />تجهيز — مشتريات ومصاريف ومهام</span>
            </div>
          </div>
          <div className="panel" style={{ padding: 18, flex: "1 1 240px" }}>
            <div className="k label">النبض</div>
            <div className="v" style={{
              fontFamily: "var(--mono)", fontSize: 34, marginTop: 8,
              color: heartbeat.verdict === "warm" ? "var(--green)"
                : heartbeat.verdict === "busy" ? "var(--amber)" : "var(--red)",
            }}>
              {heartbeat.careShare === null ? "—" : `${heartbeat.careShare}٪`}
            </div>
            <p className="sub" style={{ marginTop: 10 }}>{heartbeat.line}</p>
            {heartbeat.sinceCare !== null && (
              <p className="label" style={{ lineHeight: 1.9 }}>
                آخر حاجة شخصية اتسجّلت من {arSpan(heartbeat.sinceCare)}.
                {heartbeat.longestGap !== null && ` أطول فترة بين ذكريتين: ${arSpan(heartbeat.longestGap)}.`}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="head"><span className="label">كل الملاحظات — {attention.length}</span><hr /></div>
        {attention.length > 0 ? (
          <div className="attn-grid">
            {attention.map((a) => (
              <div key={a.code} className={`panel attn ${a.level}`}>
                <h3>{a.title}</h3>
                <p>{a.why}</p>
                {a.move && <div className="move">{a.move}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="silent"><strong>مفيش ملاحظة واحدة</strong>الأرقام كلها في مكانها.</div>
        )}
      </section>

      <section className="block">
        <div className="head"><span className="label">خد الأرقام دي واعمل بيها خطة</span><hr /></div>
        <Oracle kind="week" title="ترتيب الأسبوع" />
      </section>

      {/* أهم لوحة في الشاشة: حدود ما تعرفه الأرقام */}
      <section className="block">
        <div className="head"><span className="label">اللي الأرقام دي معرفهوش</span><hr /></div>
        <div className="panel" style={{ padding: 20 }}>
          <ul style={{ margin: 0, paddingInlineStart: 18, color: "var(--muted)", lineHeight: 2.1, fontSize: 13.5 }}>
            <li>
              <b style={{ color: money.unpriced > 0 ? "var(--amber)" : "var(--bone)" }}>{money.unpriced}</b> حاجة
              من غير سعر — المتوقع الكلي أقل من الحقيقة بقيمتها.
            </li>
            <li>
              المصاريف اللي مش مكتوبة هنا مش موجودة في أي رقم. المنصة بتحسب اللي بتقولوه بس.
            </li>
            <li>
              معدّل الصرف محسوب على آخر ٨ أسابيع. لو التجهيز لسه في أوله، المعدل ده هيتغير.
            </li>
            <li>
              سرعة الإنجاز على آخر ٦ أسابيع — أسبوع سفر أو شغل بيخلّيها تبان أقل من الحقيقة.
            </li>
            {!wedding && <li>مفيش تاريخ فرح، فكل توقع مبني على الوقت مش موجود أصلًا.</li>}
            {space.settings.budget <= 0 && <li>الميزانية بصفر، فمفيش سقف يتقاس عليه.</li>}
          </ul>
        </div>
      </section>
    </>
  );
}
