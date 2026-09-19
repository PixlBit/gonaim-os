/**
 * عامل الخدمة.
 *
 * غرضه واحد: أن تفتح المنصة وهي بلا شبكة، فتظهر الهيكل والخط واللون
 * بدل صفحة خطأ المتصفح. وليس غرضه أن تعمل بالكامل بلا إنترنت — الحالة
 * تعيش عند الخادم، والكذب على المستخدم برقم قديم أسوأ من قول "مفيش نت".
 *
 * ولذلك قاعدة واحدة صارمة: **`/api` لا يُخزَّن أبدًا**. لا استجابة ولا
 * جزء منها. أخطر عطب في عامل خدمة أن يردّ من ذاكرته على طلب حالة، فيرى
 * الاثنان أرقامًا مختلفة ولا يفهمان لماذا — أو يرى من خرج أنه ما زال
 * داخلًا. فما يمسّ `/api` يذهب إلى الشبكة ويعود منها أو يفشل.
 *
 * والأصول (`/assets/*`) مبصومة بالمحتوى من Vite، فاسمها يتغير بتغيّرها؛
 * ولذلك تُخزَّن إلى الأبد بأمان. أما الصفحة نفسها فـ"شبكة أولًا": نأخذ
 * الجديد حين يوجد، ونقع على المخزَّن حين لا توجد شبكة.
 */

const CACHE = "ehna-v1";
const SHELL = ["/", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // فردًا فردًا: ملف واحد مفقود لا يُسقط التثبيت كله كما يفعل addAll
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // الحالة والجلسة والصور: من الشبكة دائمًا، بلا أي تخزين
  if (url.pathname.startsWith("/api")) return;

  // الأصول مبصومة بالمحتوى: المخزَّن أولًا، وهو صحيح دائمًا
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then((hit) => hit ?? fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })),
    );
    return;
  }

  // الصفحة وما تبقّى: شبكة أولًا، والمخزَّن شبكة أمان
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit ?? caches.match("/")).then((hit) =>
        hit ?? new Response("مفيش نت.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }))),
  );
});
