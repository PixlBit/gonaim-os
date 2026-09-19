import { arDate, arDayDate, arSpan, arTime, greeting, short } from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Empty, Money, Ring, Tile } from "../ui/bits.js";
import { Night } from "../ui/night.js";
import type { ScreenId } from "../App.js";

/**
 * النبض — الشاشة الأولى.
 *
 * ترتيبها مقصود: العدّاد، ثم ما يستحق انتباهكم، ثم الأرقام، ثم ما حدث.
 * وما يستحق الانتباه يأتي من محرك القواعد لا من "كل اللي فاضل" — فلو لم
 * يكن هناك ما يقاطعكم، تقول الشاشة ذلك صراحةً بدل أن تملأ نفسها.
 */
export function Pulse({ go }: { go: (id: ScreenId) => void }) {
  const { space, report, you, them } = useSpace();
  const { countdown, money, nest, missions, life, attention, night } = report;
  // الساعة من جهاز القارئ: الخادم قد يكون في منطقة زمنية أخرى، ومن يفتح
  // المنصة الساعة ١١ مساءً لا يليق أن تُقال له «صباح الخير».
  const hello = greeting(space, report.viewer, new Date().getHours());
  const next = countdown.next ?? countdown.wedding;

  return (
    <>
      <div className="hello rise">
        <span className="h">{hello.text.ar}</span>
        {report.anniversary && <span className="ann">{report.anniversary.line.ar}</span>}
      </div>

      {report.onThisDay.length > 0 && (
        <section className="panel onthisday rise">
          <div className="label">في مثل النهارده</div>
          <div className="rows" style={{ gap: 6, marginTop: 8 }}>
            {report.onThisDay.map((m) => (
              <button key={m.id} className="otd-line" onClick={() => go("memories")}>
                <span className="y">{m.years === 1 ? "سنة" : m.years === 2 ? "سنتين" : `${m.years} سنين`}</span>
                <span className="t">{m.title}</span>
                <span className="a">↖</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="panel hot hero rise">
        <div>
          <div className="label">{next ? next.title : "لسه مفيش تاريخ"}</div>
          {next ? (
            <>
              <div className="count">
                {next.daysAway === 0 ? "النهارده" : Math.abs(next.daysAway)}
                {next.daysAway !== 0 && <small> {next.daysAway > 0 ? "يوم فاضل" : "يوم فات"}</small>}
              </div>
              <div className="for">
                <b>{next.title}</b> — {arDate(next.date)} · {next.when}
              </div>
            </>
          ) : (
            <>
              <div className="count">؟<small> محتاج تاريخ</small></div>
              <div className="for">حدّدوا تاريخ من <b>الخطة</b> وكل الأرقام هنا هتبقى ليها معنى.</div>
            </>
          )}
          {countdown.togetherDays !== undefined && countdown.togetherDays > 0 && (
            <div className="since">
              {you.name} و{them.name} — بقالكم {arSpan(countdown.togetherDays)} مع بعض
            </div>
          )}
        </div>
        <Ring value={nest.readiness} caption="جاهزية العش" />
      </section>

      <section className="block">
        <div className="head">
          <span className="label">يستحق انتباهكم دلوقتي</span>
          <hr />
        </div>
        {attention.length > 0 ? (
          <div className="stagger attn-grid">
            {attention.slice(0, 6).map((a) => (
              <div key={a.code} className={`panel attn ${a.level} hoverable`}>
                <h3>{a.title}</h3>
                <p>{a.why}</p>
                {a.move && <div className="move">{a.move}</div>}
                {a.screen && (
                  <div className="go">
                    <button className="btn tiny ghost" onClick={() => go(a.screen as ScreenId)}>
                      روح هناك ↖
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="مفيش حاجة تقاطعكم"
            note="النظام بصّ على الفلوس والمهام والمواعيد والشقة، وقرر إنه يسكت."
          />
        )}
      </section>

      {night && <Night plan={night} />}

      <section className="block">
        <div className="head"><span className="label">الأرقام</span><hr /></div>
        <div className="tiles stagger">
          <Tile
            k="اتصرف"
            v={<Money n={money.spent} space={space} />}
            n={space.settings.budget > 0
              ? `من ${short(space.settings.budget)} · فاضل ${short(Math.max(0, money.left))}`
              : "الميزانية لسه مش متحددة"}
            tone={money.left < 0 ? "down" : undefined}
          />
          <Tile
            k="متوقع لآخر الطريق"
            v={<Money n={money.projected} space={space} />}
            n={money.gap > 0 ? `أعلى من الميزانية بـ${short(money.gap)}` : "داخل الميزانية"}
            tone={money.gap > 0 ? "warn" : "up"}
          />
          <Tile
            k="العش"
            v={`${nest.bought}/${nest.total}`}
            n={`${nest.needed} لسه مطلوبة · ${money.unpriced} من غير سعر`}
            tone="hot"
          />
          <Tile
            k="مهام مفتوحة"
            v={missions.open}
            n={missions.overdue.length > 0
              ? `${missions.overdue.length} فات معادها`
              : `خلّصنا ${missions.done}`}
            tone={missions.overdue.length > 0 ? "down" : undefined}
          />
        </div>
      </section>

      {life.upcoming.length > 0 && (
        <section className="block">
          <div className="head"><span className="label">الأسبوع الجاي</span><hr /></div>
          <div className="rows">
            {life.upcoming.map((a) => (
              <div key={a.id} className="line">
                <span className="chip">{a.daysAway === 0 ? "النهارده" : a.daysAway === 1 ? "بكرة" : arDayDate(a.at)}</span>
                <div className="grow">
                  <div className="t">{a.title}</div>
                  {a.place && <div className="m">{a.place}</div>}
                </div>
                <span className="num" style={{ color: "var(--violet-hi)" }}>{arTime(a.at)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 320px" }}>
          <div className="head"><span className="label">آخر اللي حصل</span><hr /></div>
          <div className="rows">
            {space.log.slice(0, 7).map((l) => (
              <div key={l.id} className="line" style={{ padding: "9px 13px" }}>
                <i
                  className="dotcolor"
                  style={{ color: space.people[l.by].accent, width: 7, height: 7 }}
                />
                <div className="grow">
                  <div className="t" style={{ fontSize: 13 }}>{l.summary}</div>
                </div>
                <span className="label">{arDate(l.at)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 280px" }}>
          <div className="head"><span className="label">بينا</span><hr /></div>
          <div className="panel" style={{ padding: 17 }}>
            <div className="rows" style={{ gap: 11 }}>
              <Line label="رسايل مستنياك" value={life.unreadForMe} tone={life.unreadForMe ? "hot" : undefined} />
              <Line label="رسايل جه ميعاد فتحها" value={life.capsuleReady} tone={life.capsuleReady ? "hot" : undefined} />
              <Line label="قرارات مفتوحة" value={life.openDecisions} />
              <Line label="حاجات نعملها" value={life.wishes.someday + life.wishes.planned} />
              <Line label="ذكريات متسجلة" value={life.memories} />
            </div>
            <button className="btn ghost" style={{ width: "100%", marginTop: 14 }} onClick={() => go("us")}>
              افتح «إحنا»
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function Line({ label, value, tone }: { label: string; value: number; tone?: string | undefined }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      <span style={{ flex: 1, color: "var(--muted)", fontSize: 13 }}>{label}</span>
      <span className="num" style={{ fontSize: 17, color: tone ? "var(--violet-hi)" : "var(--bone)" }}>
        {value}
      </span>
    </div>
  );
}
