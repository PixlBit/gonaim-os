# تشغيل إحنا على خادم

> منصة لاثنين، على خادم يملكانه. هذه الوثيقة تصف ثلاثة طرق للتشغيل،
> وتقول صراحةً ما لا يصلح — لأن الوقت الذي يضيع في محاولة نشر فاشلة أغلى
> من الوقت الذي يوفّره سطر تحذير.

## ما الذي يحتاجه المشروع

**عملية Node تعمل باستمرار.** لا خيار في هذا: الحالة تُقرأ وتُكتب من
مخزَن (ملف أو Postgres)، والتقرير يُحسب في كل طلب، والصور تُخدَم من القرص
بعد فحص الجلسة. هذا ليس موقعًا ساكنًا يُرفع إلى CDN.

**ولذلك لا تعمل على Cloudflare Pages ولا Netlify ولا GitHub Pages وحدها.**
هذه الثلاثة تخدم ملفات مبنية مسبقًا؛ وستُبنى الواجهة عليها بنجاح ثم
تفتحها فترى شاشة الدخول ولا تدخل، لأن `/api` لا يوجد. من أراد Cloudflare
فليضع Node على خادم ويستعمل Cloudflare أمامه (وكيلًا أو نفقًا)، لا بديلًا
عنه.

---

## الطريق الأول: Docker Compose (الموصى به)

خدمتان: المنصة، وCaddy الذي يجلب شهادة HTTPS ويجددها وحده.

```bash
cp .env.example .env
# اضبط EHNA_DOMAIN، واترك EHNA_SECRET فارغًا — الإعداد يولّده
$EDITOR .env

# الحسابان يُنشآن مرة واحدة، من الطرفية، بكلمتي سر تكتبانهما أنتما
docker compose -f docker-compose.ehna.yml run --rm ehna npm run ehna:setup

docker compose -f docker-compose.ehna.yml up -d
```

وجّه سجل `A` من الدومين إلى الخادم **قبل** التشغيل: Caddy يطلب الشهادة
عند أول إقلاع، ويفشل بهدوء إن لم يكن الدومين يشير إليه بعد.

بلا دومين: احذف خدمة `caddy`، وانشر المنفذ `8788`, واضبط
`EHNA_SECURE_COOKIE=0` — لأن المتصفح لا يرسل كوكي `Secure` على `http`،
فتصير كل محاولة دخول وكأنها لم تحدث.

## الطريق الثاني: systemd بلا Docker

```bash
sudo useradd --system --home /var/lib/ehna --create-home ehna
sudo git clone <repo> /opt/gonaim-os && cd /opt/gonaim-os
sudo -u ehna npm ci && sudo -u ehna npm run build

sudo cp .env.example .env && sudo $EDITOR .env
sudo -u ehna EHNA_DIR=/var/lib/ehna npm run ehna:setup

sudo cp deploy/ehna.service /etc/systemd/system/
sudo systemctl enable --now ehna
journalctl -u ehna -f
```

وضع أمامه أي وكيل عكسي (Caddy أو nginx) لإنهاء TLS. الوحدة مكتوبة بـ
`ProtectSystem=strict`: كل القرص للقراءة فقط إلا `/var/lib/ehna`.

## الطريق الثالث: على جهازكما

يصحّ تمامًا لاثنين على نفس الشبكة:

```bash
npm run ehna:setup
npm run ehna:build
npm run ehna          # http://localhost:8788
```

وللتطوير مع إعادة التحميل: `npm run ehna:dev` و`npm run ehna:web` معًا.

---

## النسخ الاحتياطي

```bash
npm run ehna:backup              # نسخة كاملة: الخزنة + الصور
npm run ehna:backup -- --keep 7  # ويقلّم ما قبلها
npm run ehna:restore <path>      # يحتاج --force لو المساحة فيها بيانات
```

النسخة **مجلد** فيه `vault.json` وكل الصور بمعرّفاتها — لأن الذكرى تشير
إلى صورتها باسمها، واسترجاع يعيد تسميتها يعيد ألبومًا فارغًا. والجلسات لا
تُسترجَع عمدًا: توكن من جهاز قديم لا يجوز أن يُحيا بنسخة.

وهي تعمل عبر عقد المخزَن لا عبر القرص، فتنسخ من ملف وتسترجع إلى Postgres
والعكس — وهو الطريق الذي سيسلكه أي أحد ينتقل من جهازه إلى خادم.

ليليًا على systemd:

```bash
sudo cp deploy/ehna-backup.{service,timer} /etc/systemd/system/
sudo systemctl enable --now ehna-backup.timer
```

> النسخة تحوي بصمات كلمات السر والصور. ضعها على قرص آخر، ولا تضعها في
> المستودع، ولا في مجلد يُزامَن إلى خدمة عامة.

## Postgres بدل الملف

```bash
EHNA_DATABASE_URL=postgres://user:pass@host:5432/db npm run migrate
```

ثم اضبط نفس المتغير للخادم. والانتقال من ملف إلى قاعدة: `ehna:backup` من
الملف، ثم `ehna:restore` والمتغير مضبوط.

## المتغيرات

| المتغير | لماذا |
| --- | --- |
| `EHNA_SECRET` | توقيع الجلسات. 32 حرفًا على الأقل، ويولّده الإعداد. تغييره يُخرج الجميع. |
| `EHNA_PORT` | المنفذ. `8788` افتراضًا. |
| `EHNA_DIR` | مجلد المخزَن حين يكون على ملف. |
| `EHNA_DATABASE_URL` | فارغ = ملف. مضبوط = Postgres. |
| `EHNA_SECURE_COOKIE` | `1` خلف HTTPS. `0` على `http` وإلا لن يُحفظ الدخول. |
| `EHNA_BACKUPS` · `EHNA_BACKUPS_KEEP` | وجهة النسخ وكم تبقى. |
| `EHNA_WEB_ORIGIN` | أصل واجهة التطوير. في الإنتاج الواجهة من نفس الأصل فلا يلزم. |
| `ANTHROPIC_API_KEY` · `EHNA_MODEL` | الطبقة الاختيارية وحدها. بدونها كل شيء يعمل. |

## بعد النشر — ما يُتحقَّق منه

- [ ] `https://<domain>/api/health` يرد `{"ok":true,"initialized":true}`
- [ ] الدخول بالحسابين، كلٌّ من جهازه
- [ ] الخروج من جهاز واحد لا يُخرج الآخر (الضبط ← الأجهزة الداخلة)
- [ ] رفع صورة في ذكرى، ثم فتحها من الجهاز الثاني
- [ ] `npm run ehna:backup` ثم استرجاع إلى مجلد فارغ ومقارنة — **النسخة
      تُختبر بالرجوع، لا بالوجود**
- [ ] التثبيت على الهاتف (Add to Home Screen)، ثم فتحه بلا شبكة: يجب أن
      يظهر الهيكل والخط لا صفحة خطأ المتصفح
