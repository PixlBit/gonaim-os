import { useMemo } from "react";

/**
 * تفتُّح — احتفال صغير.
 *
 * حين تُحجَز ليلة أو تُنجَز أمنية، تستحق اللحظة أكثر من تغيّر لون زر.
 * لكن «الكونفيتي» الجاهز يأتي بمكتبة كاملة وقماش (canvas) يرسم ستين إطارًا
 * في الثانية لثانيتين — ثمن باهظ لفرحة.
 *
 * فهذه اثنتا عشرة بتلة، كل واحدة `div` واحد، تتحرك بـ`transform` و`opacity`
 * فقط — أي على كرت الشاشة لا على الخيط الرئيسي. تنتهي بعد ثانية ونصف
 * وتُزال من الشجرة.
 *
 * ومن أطفأ الحركة في نظامه لا يرى بتلة واحدة: `prefers-reduced-motion`
 * يُلغيها في الـCSS. الفرحة لا تُفرَض على من يصيبه الدوار منها.
 */
const PETALS = 12;

export function Bloom() {
  // الزوايا تُحسب مرة: إعادة الرسم لا يجوز أن تعيد إطلاق البتلات
  const petals = useMemo(
    () => Array.from({ length: PETALS }, (_, i) => ({
      angle: (360 / PETALS) * i + (i % 2 === 0 ? 7 : -7),
      delay: (i % 4) * 60,
      hue: i % 3,
    })),
    [],
  );

  return (
    <div className="bloom" aria-hidden="true">
      {petals.map((p, i) => (
        <i
          key={i}
          className={`petal h${p.hue}`}
          style={{
            transform: `rotate(${p.angle}deg)`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
