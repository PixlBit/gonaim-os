import {
  arDate, arDayDate, arSpan, arTime, enDate, enDayDate, enSpan, enTime, greeting, short, shortEn,
} from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Empty, Money, Ring, Tile } from "../ui/bits.js";
import { Night } from "../ui/night.js";
import { useTongue } from "../lang.js";
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
  const { lang, t, s } = useTongue();
  // مختصرات تُقرأ في الجملة: التاريخ والمدة والمبلغ بلغة القارئ
  const date = (d: string) => (lang === "ar" ? arDate(d) : enDate(d));
  const dayDate = (d: string) => (lang === "ar" ? arDayDate(d) : enDayDate(d));
  const span = (n: number) => (lang === "ar" ? arSpan(n) : enSpan(n));
  const time = (v: string) => (lang === "ar" ? arTime(v) : enTime(v));

  const next = countdown.next ?? countdown.wedding;

  return (
    <>
      <div className="hello rise">
        <span className="h">{s(hello.text)}</span>
        {report.anniversary && <span className="ann">{s(report.anniversary.line)}</span>}
      </div>

      {report.onThisDay.length > 0 && (
        <section className="panel onthisday rise">
          <div className="label">{t("في مثل النهارده", "On this day")}</div>
          <div className="rows" style={{ gap: 6, marginTop: 8 }}>
            {report.onThisDay.map((m) => (
              <button key={m.id} className="otd-line" onClick={() => go("memories")}>
                <span className="y">
                  {lang === "ar"
                    ? (m.years === 1 ? "سنة" : m.years === 2 ? "سنتين" : `${m.years} سنين`)
                    : (m.years === 1 ? "1 year" : `${m.years} years`)}
                </span>
                <span className="t"><bdi>{m.title}</bdi></span>
                <span className="a">↖</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="panel hot hero rise">
        <div>
          <div className="label">{next ? next.title : t("لسه مفيش تاريخ", "No date yet")}</div>
          {next ? (
            <>
              <div className="count">
                {next.daysAway === 0 ? t("النهارده", "Today") : Math.abs(next.daysAway)}
                {next.daysAway !== 0 && (
                  <small> {next.daysAway > 0 ? t("يوم فاضل", "days to go") : t("يوم فات", "days ago")}</small>
                )}
              </div>
              <div className="for">
                {/* اسم المحطة بيانات باتجاه قد يخالف اتجاه السطر — يُعزَل بـ<bdi> */}
                <b><bdi>{next.title}</bdi></b> — {date(next.date)} · {s(next.when)}
              </div>
            </>
          ) : (
            <>
              <div className="count">؟<small> {t("محتاج تاريخ", "needs a date")}</small></div>
              <div className="for">
                {t("حدّدوا تاريخ من ", "Set a date in ")}<b>{t("الخطة", "Plan")}</b>
                {t(" وكل الأرقام هنا هتبقى ليها معنى.", " and every number here starts to mean something.")}
              </div>
            </>
          )}
          {countdown.togetherDays !== undefined && countdown.togetherDays > 0 && (
            <div className="since">
              {t(`${you.name} و${them.name} — بقالكم ${arSpan(countdown.togetherDays)} مع بعض`,
                 `${you.name} and ${them.name} — ${enSpan(countdown.togetherDays)} together`)}
            </div>
          )}
        </div>
        <Ring value={nest.readiness} caption={t("جاهزية العش", "Nest ready")} />
      </section>

      <section className="block">
        <div className="head">
          <span className="label">{t("يستحق انتباهكم دلوقتي", "Worth your attention now")}</span>
          <hr />
        </div>
        {attention.length > 0 ? (
          <div className="stagger attn-grid">
            {attention.slice(0, 6).map((a) => (
              <div key={a.code} className={`panel attn ${a.level} hoverable`}>
                <h3>{s(a.title)}</h3>
                <p>{s(a.why)}</p>
                {a.move && <div className="move">{s(a.move)}</div>}
                {a.screen && (
                  <div className="go">
                    <button className="btn tiny ghost" onClick={() => go(a.screen as ScreenId)}>
                      {t("روح هناك", "Go there")} ↖
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title={t("مفيش حاجة تقاطعكم", "Nothing needs to interrupt you")}
            note={t("النظام بصّ على الفلوس والمهام والمواعيد والشقة، وقرر إنه يسكت.",
                    "The system looked at the money, the tasks, the dates and the flat — and chose to stay quiet.")}
          />
        )}
      </section>

      {night && <Night plan={night} />}

      <section className="block">
        <div className="head"><span className="label">{t("الأرقام", "The numbers")}</span><hr /></div>
        <div className="tiles stagger">
          <Tile
            k={t("اتصرف", "Spent")}
            v={<Money n={money.spent} space={space} />}
            n={space.settings.budget > 0
              ? t(`من ${short(space.settings.budget)} · فاضل ${short(Math.max(0, money.left))}`,
                  `of ${shortEn(space.settings.budget)} · ${shortEn(Math.max(0, money.left))} left`)
              : t("الميزانية لسه مش متحددة", "No budget set yet")}
            tone={money.left < 0 ? "down" : undefined}
          />
          <Tile
            k={t("متوقع لآخر الطريق", "Projected total")}
            v={<Money n={money.projected} space={space} />}
            n={money.gap > 0
              ? t(`أعلى من الميزانية بـ${short(money.gap)}`, `${shortEn(money.gap)} over budget`)
              : t("داخل الميزانية", "Within budget")}
            tone={money.gap > 0 ? "warn" : "up"}
          />
          <Tile
            k={t("العش", "Nest")}
            v={`${nest.bought}/${nest.total}`}
            n={t(`${nest.needed} لسه مطلوبة · ${money.unpriced} من غير سعر`,
                 `${nest.needed} still needed · ${money.unpriced} unpriced`)}
            tone="hot"
          />
          <Tile
            k={t("مهام مفتوحة", "Open tasks")}
            v={missions.open}
            n={missions.overdue.length > 0
              ? t(`${missions.overdue.length} فات معادها`, `${missions.overdue.length} past due`)
              : t(`خلّصنا ${missions.done}`, `${missions.done} done`)}
            tone={missions.overdue.length > 0 ? "down" : undefined}
          />
        </div>
      </section>

      {life.upcoming.length > 0 && (
        <section className="block">
          <div className="head"><span className="label">{t("الأسبوع الجاي", "The week ahead")}</span><hr /></div>
          <div className="rows">
            {life.upcoming.map((a) => (
              <div key={a.id} className="line">
                <span className="chip">
                  {a.daysAway === 0 ? t("النهارده", "Today")
                    : a.daysAway === 1 ? t("بكرة", "Tomorrow") : dayDate(a.at)}
                </span>
                <div className="grow">
                  <div className="t"><bdi>{a.title}</bdi></div>
                  {a.place && <div className="m">{a.place}</div>}
                </div>
                <span className="num" style={{ color: "var(--violet-hi)" }}>{time(a.at)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <section className="block" style={{ flex: "1 1 320px" }}>
          <div className="head"><span className="label">{t("آخر اللي حصل", "What just happened")}</span><hr /></div>
          <div className="rows">
            {space.log.slice(0, 7).map((l) => (
              <div key={l.id} className="line" style={{ padding: "9px 13px" }}>
                <i
                  className="dotcolor"
                  style={{ color: space.people[l.by].accent, width: 7, height: 7 }}
                />
                <div className="grow">
                  <div className="t" style={{ fontSize: 13 }}><bdi>{l.summary}</bdi></div>
                </div>
                <span className="label">{date(l.at)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="block" style={{ flex: "1 1 280px" }}>
          <div className="head"><span className="label">{t("بينا", "Between us")}</span><hr /></div>
          <div className="panel" style={{ padding: 17 }}>
            <div className="rows" style={{ gap: 11 }}>
              <Line label={t("رسايل مستنياك", "Notes waiting for you")} value={life.unreadForMe} tone={life.unreadForMe ? "hot" : undefined} />
              <Line label={t("رسايل جه ميعاد فتحها", "Letters due to open")} value={life.capsuleReady} tone={life.capsuleReady ? "hot" : undefined} />
              <Line label={t("قرارات مفتوحة", "Open decisions")} value={life.openDecisions} />
              <Line label={t("حاجات نعملها", "Things to do together")} value={life.wishes.someday + life.wishes.planned} />
              <Line label={t("ذكريات متسجلة", "Memories logged")} value={life.memories} />
            </div>
            <button className="btn ghost" style={{ width: "100%", marginTop: 14 }} onClick={() => go("us")}>
              {t("افتح «إحنا»", "Open “Us”")}
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
