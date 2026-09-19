import { useState } from "react";
import type { NightPlan } from "@gonaim/couple";
import { useSpace } from "../store.js";
import { Bloom } from "./bloom.js";
import { useTongue } from "../lang.js";

/**
 * بطاقة «ليلتنا».
 *
 * كل ما في الواجهة يقول لكما ما عليكما فعله. هذه البطاقة وحدها تقول ما
 * **لكما**. ولذلك تُعامَل معاملةً مختلفة بصريًا: لا تبدأ بعنوان قسم ولا
 * بتسمية أحادية المسافة، بل بتاريخ كبير — كدعوة، لا كصف في جدول.
 *
 * والدليل تحتها لا فوقها، وبخطٍّ أصغر: من يقتنع بالتاريخ يضغط، ومن يشكّ
 * يقرأ لماذا. وهذا أدب المنصة كلها — الرقم يسبق تفسيره، ولا يُخفى تفسيره.
 *
 * والزر واحد لا اثنان. «تمام» تكتب الميعاد وتنقل الأمنية من «يوم ما» إلى
 * «متخطّطة» في فعل واحد، لأن الليلة التي تحتاج ثلاث خطوات لن تحدث.
 */
export function Night({ plan }: { plan: NightPlan }) {
  const { act, busy } = useSpace();
  const { lang, t, s } = useTongue();
  const [done, setDone] = useState(false);

  const accept = async () => {
    const ok = await act({
      type: "appointment.add",
      // العنوان يُكتب بلغة من يحجز: صار بيانات في المساحة، لا واجهة تُترجَم
      title: plan.title[lang],
      at: plan.at,
      attendees: "both",
      note: t("ليلة اقترحتها المنصة من أهدى أسبوع.", "A night the platform picked from your calmest week."),
    });
    if (!ok) return;
    // الأمنية تنتقل بعد الميعاد لا قبله: لو فشلت الكتابة الأولى لا نترك
    // أمنية «متخطّطة» بلا خطة.
    if (plan.wish) {
      await act({
        type: "wish.update", id: plan.wish.id,
        patch: { status: "planned", plannedFor: plan.date },
      });
    }
    setDone(true);
  };

  if (done) {
    return (
      <section className="panel night done rise">
        <Bloom />
        <div className="night-head">
          <div className="when">{s(plan.when)}</div>
          <p className="sub" style={{ margin: "6px 0 0" }}>
            {t("اتحجزت. ", "Booked. ")}
            {plan.wish
              ? t(`«${plan.wish.title}» بقت متخطّطة كمان.`, `“${plan.wish.title}” is planned now too.`)
              : t("مستنياكم.", "Waiting for you.")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel night rise">
      <div className="night-head">
        <div className="tagline">{t("ليلة ليكم إنتوا", "A night that is yours")}</div>
        <div className="when">{s(plan.when)}</div>
        {plan.wish ? (
          <p className="wish">«{plan.wish.title}»</p>
        ) : (
          <p className="wish quiet">{t("من غير خطة. ده المقصود.", "With no plan. That is the point.")}</p>
        )}
        <div className="night-act">
          <button className="btn primary" disabled={busy} onClick={() => void accept()}>
            {t("تمام، احجزها", "Yes, book it")}
          </button>
        </div>
      </div>

      {/* الدليل مكشوف لا مطويّ: هو نصف الفكرة، وما يُطوى لا يُقرأ. */}
      <ul className="night-why">
        {plan.why.map((line, i) => <li key={i}>{s(line)}</li>)}
      </ul>
    </section>
  );
}
