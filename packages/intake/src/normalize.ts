/**
 * تطبيع النص قبل أي استخلاص.
 *
 * غنيم يكتب بالعربي والإنجليزي في نفس الجملة، وبأرقام عربية أو لاتينية.
 * تمرير ذلك خامًا إلى نموذج يعني استخلاصًا غير مستقر: "٨٥٠٠" و"8500" نفس
 * الرقم، ويجب أن يعطيا نفس النتيجة دائمًا.
 */

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeDigits(text: string): string {
  let out = "";
  for (const ch of text) {
    const ai = ARABIC_INDIC.indexOf(ch);
    if (ai >= 0) { out += String(ai); continue; }
    const ei = EXTENDED_ARABIC_INDIC.indexOf(ch);
    if (ei >= 0) { out += String(ei); continue; }
    out += ch;
  }
  return out;
}

/**
 * توحيد المسافات وعلامات الاتجاه دون تغيير طول المعنى.
 * لا نحذف علامات الترقيم — قد تكون فاصلًا بين حقيقتين.
 */
export function normalizeText(text: string): string {
  return normalizeDigits(text)
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")
    .replace(/[ـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
