# الهاتف — iPhone عبر Shortcuts

> **Source:** Expansion §4.3 (Mobile Companion)
> بلا ماك، بلا Xcode، بلا حساب مطوّر، بلا App Store.

---

## لماذا Shortcuts لا تطبيق

في ٢٠٢٥ أغلقت المنصات الوصول من الخادم عمدًا:

| المصدر | ما تغيّر |
| --- | --- |
| Google Photos | `photoslibrary.readonly` أُزيل في ٣١ مارس ٢٠٢٥ — كل نداء يرجع `403`. البديل Picker API: صور تختارها بيدك واحدة واحدة |
| Google Timeline | انتقلت إلى الجهاز في ٩ يونيو ٢٠٢٥. لا وصول من الويب ولا من السحابة، والافتراضي ثلاثة أشهر |
| WhatsApp | لا API رسمي للمحادثات الشخصية. المكتبات غير الرسمية تخالف الشروط وخطر الحظر حقيقي وغير متوقع |
| SMS على iOS | لا API لقراءة الرسائل. **لكن** Shortcuts فيها مُشغِّل "عند استلام رسالة" |

فالهاتف هو المكان الوحيد ذو الصلاحية الشرعية، وShortcuts أرخص طريق إليه.

---

## ١. التوكن

في `.env` على الخادم:

```bash
INGEST_TOKEN=$(openssl rand -hex 32)
LOCATION_PRECISION=area      # city · area · exact
SMS_BODY_RETENTION=drop      # drop · redacted
```

بلا `INGEST_TOKEN` البوابة **مقفلة**. لا يوجد وضع "مفتوح للتجربة".

---

## ٢. الاختصار الأساسي — Post to GONAIM

اصنع اختصارًا واحدًا يستقبل نصًا ويرسله. كل الأتمتة بعده تناديه.

1. **Shortcuts ← + ← Add Action ← Get Contents of URL**
2. URL: `https://<خادمك>/api/ingest`
3. Method: `POST`
4. Headers:
   - `Content-Type` = `application/json`
   - `X-Gonaim-Token` = التوكن
5. Request Body: `JSON` — أو `File` ومرّر النص الجاهز
6. سمِّه **Post to GONAIM**

> محليًا: شغّل الخادم على شبكتك واستخدم عنوان الجهاز (`http://192.168.x.x:8787`)،
> أو نفق مثل Tailscale. لا تفتح المنفذ على الإنترنت بلا HTTPS.

---

## ٣. الرسائل — Automation

**Automation ← + ← Message**

- **Sender**: اتركه فارغًا لكل المرسلين، أو حدّد من يهمك
- **Message Contains**: أو فلتر بكلمة
- **Run Immediately** ✅ · **Notify When Run** ❌

الإجراءات:

```
Text →
{
  "device": "iphone",
  "signals": [{
    "kind": "sms",
    "at": [Current Date — ISO 8601],
    "sender": [Sender],
    "body": [Content]
  }]
}
→ Post to GONAIM
```

**ما يحدث للنص:** يُنقَّح على الخادم (أسرار، IBAN، بطاقات)، يُستخلص منه
التزامك أنت، ثم **يُسقَط**. المخزَّن: رمز ثابت للمرسل، الطول، عدد ما نُقِّح.
لا اسم ولا نص. راجع `packages/ingest/src/toEvents.ts`.

---

## ٤. الموقع

**وصول ومغادرة** — Automation ← Arrive / Leave، لكل مكان يهمك:

```
Text → {"device":"iphone","signals":[{
  "kind":"location","at":[Current Date],"precision":"area",
  "event":"arrive","label":"المكتب"
}]}
→ Post to GONAIM
```

**كل ساعة** — Automation ← Time of Day ← Repeat Hourly:

```
Get Current Location → Text → {…"event":"periodic"…} → Post to GONAIM
```

`LOCATION_PRECISION` على الخادم سقف: يُخفِّض ما يزيد عنه ولا يرفضه.
`area` ≈ كيلومتر — يكفي لمعرفة الحي، ولا يكفي لمعرفة الباب.

---

## ٥. الصور

**Automation ← Time of Day ← Daily**

```
Find Photos where Date Added is today
→ Repeat with Each → Text → {"kind":"photo","localId":[Name],…}
→ Post to GONAIM
```

الصورة **لا تُرفع**. يُحفظ معرّفها على جهازك فقط (ADR-0009).
للتحليل البصري لصورة بعينها، شاركها يدويًا وقتها.

---

## ٦. واتساب

لا طريق تلقائي على iOS — لا يوجد مكافئ لـNotification Listener.

المتاح:
- **مشاركة يدوية:** من داخل المحادثة ← Share ← Post to GONAIM
- **تصدير محادثة:** WhatsApp ← Export Chat ← ملف نصي ← المدخل

**غير مستخدَم عمدًا:** Baileys / whatsapp-web.js. تخالف الشروط، والحظر
دائم وغير متوقع — بعضهم شهور وبعضهم أسبوع. رقمك ليس ثمن ميزة.

---

## ٧. ماذا يُخزَّن فعلًا

| الإشارة | المخزَّن | غير المخزَّن |
| --- | --- | --- |
| رسالة | رمز المرسل · الطول · عدد ما نُقِّح | الاسم · النص · الرقم |
| موقع | التسمية · إحداثيات بدقة السقف | المسار المستمر |
| صورة | المعرّف المحلي · المكان | الصورة |
| تقويم | العنوان منقّحًا · الوقت | الحضور |

---

## ٨. الإيقاف

`Blackout` من الواجهة يوقف الاستيعاب **فورًا**. البوابة تفحصه قبل كل دفعة،
وترد `202` مع `rejectedByBlackout` بدل أن تكتب شيئًا — والرفض يُسجَّل في
سجل التدقيق، لأن الرفض دليل على أن الحد اشتغل.

لإيقاف مصدر واحد، عطّل الـAutomation الخاصة به من Shortcuts.
