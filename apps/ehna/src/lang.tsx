import { useEffect } from "react";
import { dir, say, type Lang, type Text } from "@gonaim/couple";
import { useApp } from "./store.js";

/**
 * اللغة في الواجهة.
 *
 * ثلاثة قرارات تشرح كل ما في هذا الملف:
 *
 * **أولًا، لا ملفّ قاموس ولا مفاتيح.** الطريقة المعتادة `t("gate.title")`
 * ومعها `ar.json` و`en.json`. وهي تُنتج دائمًا نفس العطبين: مفتاح يُضاف
 * ولا تُضاف ترجمته فيظهر الاسم البرمجي في الشاشة، ومفتاح يُحذف من الكود
 * ويبقى في الملفين إلى الأبد. وهنا `t("الميزان", "Ledger")`: النصان
 * متجاوران في سطر واحد، فمن يعدّل أحدهما يرى الآخر أمامه. لا مفتاح بلا
 * ترجمة، ولا ترجمة بلا موضع.
 *
 * **ثانيًا، اللغة تخصّ الشخص لا المساحة ولا الجهاز.** محفوظة في `Person`
 * على الخادم: هو يقرأ بالعربية وهي بالإنجليزية في نفس الثانية من نفس
 * الحمولة، ومن بدّل على هاتفه وجدها مبدّلة على حاسوبه.
 *
 * **ثالثًا، `lang` و`dir` على `<html>` لا على غلاف داخلي.** لأن الاتجاه
 * يجب أن يبلغ أشياء خارج شجرة React: أشرطة التمرير، وقائمة النقر الأيمن،
 * وترتيب `::selection`. ومنه أيضًا يعمل `:lang(en)` في الأنماط، فيعود
 * التتبّع اللاتيني ويختفي عن العربية بلا سطر شرط واحد في أي مكوّن.
 */

export interface Tongue {
  lang: Lang;
  /** اختيار من نصّين مكتوبين هنا: `t("الخطة", "Plan")`. */
  t: (ar: string, en: string) => string;
  /** اختيار من `Text` جاء محسوبًا من الخادم. */
  s: (text: Text) => string;
  set: (lang: Lang) => Promise<boolean>;
}

export function useTongue(): Tongue {
  const { phase, act } = useApp();
  const lang: Lang = phase.kind === "ready"
    ? (phase.state.space.people[phase.state.me].lang ?? "ar")
    : "ar";

  return {
    lang,
    t: (ar, en) => (lang === "ar" ? ar : en),
    s: (text) => say(text, lang),
    set: (next) => act({ type: "lang.set", lang: next }),
  };
}

/**
 * يضبط `<html lang dir>` كلما تغيّرت اللغة.
 *
 * ولا يُعاد ضبطه إلا عند التغيّر فعلًا: كتابة `documentElement.dir` تُبطل
 * تخطيط الصفحة كلها، وفعلها في كل رسم يجعل كل ضغطة زر تعيد التخطيط.
 */
export function useDocumentLang(lang: Lang): void {
  useEffect(() => {
    const el = document.documentElement;
    if (el.lang !== lang) el.lang = lang;
    const d = dir(lang);
    if (el.dir !== d) el.dir = d;
  }, [lang]);
}
