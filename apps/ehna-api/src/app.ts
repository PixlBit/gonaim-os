import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import {
  Actions, ActError, apply, forViewer, report, T, today as todayOf,
  type PersonKey, type Space,
} from "@gonaim/couple";
import { ask, buildBrief, offline, OracleError, type Brief, type OracleKind } from "@gonaim/oracle";
import {
  ConflictError, checkPassword, hashPassword, login,
  passwordProblem, readToken, signToken, touchSession,
  type OpenedStore, type Session, type Vault,
} from "@gonaim/couple-db";
import { cookie, deviceName, json, parseCookies, readBody, sniffImage } from "./http.js";
import { Static } from "./static.js";

/**
 * خادم EHNA//OS.
 *
 * مبدأ أول يحكم الملف كله: **الواجهة لا تُرسل حالة، ترسل نية**. كل تغيير
 * يصل كفعل موصوف يُتحقق منه ثم يُطبَّق على أحدث نسخة على الخادم. لا يوجد
 * مسار يقبل "المساحة بعد التعديل"، فلا يوجد طريق لعميل — أو لمن يتحكم فيه —
 * أن يكتب ما يشاء.
 *
 * ومبدأ ثانٍ: ما لا يجب أن يُرى لا يُرسَل. نص الكبسولة قبل موعدها، وبصمة
 * كلمة السر، لا تغادران هذا الملف.
 *
 * والخادم يُبنى بإعداد صريح (`createApp`) لا بمتغيرات بيئة مقروءة في أعلى
 * الملف — فيمكن تشغيل نسخة كاملة منه في اختبار على منفذ مؤقت بمخزَن مؤقت.
 */

const COOKIE = "ehna_s";
const SESSION_SEC = 45 * 24 * 3600;
const MAX_JSON = 256 * 1024;
const MAX_PHOTO = 8 * 1024 * 1024;
/** محاولات الدخول لكل عنوان. قفل الحساب يحمي الحساب، وهذا يحمي الخادم. */
const ATTEMPT_LIMIT = 20, ATTEMPT_WINDOW = 10 * 60_000;
/** سقف يومي لنداءات النموذج. يُحسب قبل النداء لا بعده — الحد يحمي الفاتورة. */
const ORACLE_PER_DAY = 25;
const ORACLE_KINDS = new Set<OracleKind>(["letter", "advice", "gift", "week", "story"]);

export interface AppConfig {
  store: OpenedStore;
  /** سر توقيع الجلسات. أقل من 32 حرفًا يُرفض — سر قصير ليس سرًا. */
  secret: string;
  /** كوكي `Secure`: خلف https فقط، وإلا لن يرسلها المتصفح محليًا. */
  secure: boolean;
  /** أصول الواجهة المسموحة في التطوير. في النشر الأصل واحد فلا تُستعمل. */
  webOrigins: string[];
  staticRoot: string;
  /**
   * الطبقة الاختيارية. بلا مفتاح تعمل المنصة كاملة، وتعرض الوقائع بصيغتها
   * الحتمية بدل نص النموذج — لا شاشة تتعطّل ولا زر يختفي.
   */
  oracle?: { apiKey: string; model?: string };
  /** الزمن يدخل من هنا — فيصير كل سلوك زمني قابلًا للاختبار. */
  now?: () => Date;
}

interface Me { session: Session; vault: Vault }

export interface StatePayload {
  /** ما هو متاح في هذا التنصيب — الواجهة لا تخمّن. */
  features: { oracle: boolean; model: string | null };
  me: PersonKey;
  rev: number;
  space: Space;
  report: ReturnType<typeof report>;
  sessions: Array<{ id: string; key: PersonKey; agent?: string; lastSeenAt: string; current: boolean }>;
}

export function createApp(cfg: AppConfig): Server {
  const { store, secret: SECRET, secure: SECURE, webOrigins: WEB } = cfg;
  const site = new Static(cfg.staticRoot);
  const clock = cfg.now ?? (() => new Date());
  const attempts = new Map<string, { n: number; until: number }>();
  /**
   * الصور المرفوعة للتو ولم تُربَط بذكرى بعد. الكنس يتخطّاها ساعتين —
   * وإلا حذف حذفُ ذكرى من جهاز الطرف الآخر صورةً أنت في نصف رفعها.
   */
  const fresh = new Map<string, number>();
  const GRACE_MS = 2 * 3600_000;

  function throttled(ip: string, atMs: number): boolean {
    // خريطة تنمو بلا حد على خادم يعمل شهورًا — تُقلَّم حين تكبر
    if (attempts.size > 500) {
      for (const [key, rec] of attempts) if (rec.until < atMs) attempts.delete(key);
    }
    const rec = attempts.get(ip);
    if (!rec || rec.until < atMs) { attempts.set(ip, { n: 1, until: atMs + ATTEMPT_WINDOW }); return false; }
    rec.n += 1;
    return rec.n > ATTEMPT_LIMIT;
  }

  /**
   * كنس الصور التي لم تعد أي ذكرى تشير إليها.
   *
   * حذف الذكرى وحده لا يكفي: الصورة تبقى على القرص إلى الأبد، وهي أثقل ما
   * في المخزَن. والكنس يعمل على ما لا يشير إليه شيء فقط، ويترك ما رُفع في
   * آخر ساعتين — فلا يحذف صورة بين رفعها وحفظ ذكرتها.
   */
  async function sweepPhotos(space: Space, atMs: number): Promise<void> {
    const used = new Set(space.memories.flatMap((m) => m.photos));
    for (const id of await store.listPhotos()) {
      if (used.has(id)) { fresh.delete(id); continue; }
      const born = fresh.get(id);
      if (born !== undefined && atMs - born < GRACE_MS) continue;
      await store.removePhoto(id);
      fresh.delete(id);
    }
  }

  async function jsonBody(req: IncomingMessage, res: ServerResponse): Promise<Record<string, unknown> | null> {
    let raw: Buffer;
    try { raw = await readBody(req, MAX_JSON); }
    catch { json(res, 413, { error: "too_large" }); return null; }
    if (raw.length === 0) return {};
    try { return JSON.parse(raw.toString("utf8")) as Record<string, unknown>; }
    catch { json(res, 400, { error: "bad_json" }); return null; }
  }

  async function readVault(res: ServerResponse): Promise<Vault | null> {
    try { return await store.read(); }
    catch {
      json(res, 503, {
        error: "not_initialized",
        message: T("المساحة لسه مش متعملة. شغّل npm run ehna:setup.",
                   "The space has not been created yet. Run npm run ehna:setup."),
      });
      return null;
    }
  }

  async function authenticate(token: string | undefined, now: Date, res: ServerResponse): Promise<Me | null> {
    const sessionId = token ? readToken(token, SECRET) : null;
    if (!sessionId) { json(res, 401, { error: "no_session" }); return null; }
    const vault = await readVault(res);
    if (!vault) return null;
    const session = touchSession(vault, sessionId, now);
    if (!session) {
      json(res, 401, { error: "expired" },
        { "set-cookie": cookie(COOKIE, "", { maxAgeSec: 0, secure: SECURE }) });
      return null;
    }
    return { session, vault };
  }

  /** ما يصل إلى المتصفح — وما لا يصل. */
  function state(vault: Vault, session: Session, now: Date): StatePayload {
    const viewer = session.key;
    const space = forViewer(vault.space, viewer, now);
    return {
      features: {
        oracle: Boolean(cfg.oracle?.apiKey),
        model: cfg.oracle?.apiKey ? (cfg.oracle.model ?? null) : null,
      },
      me: viewer,
      rev: vault.rev,
      space,
      report: report(space, todayOf(now), viewer),
      sessions: vault.sessions.map((s) => ({
        id: s.id, key: s.key, ...(s.agent === undefined ? {} : { agent: s.agent }),
        lastSeenAt: s.lastSeenAt, current: s.id === session.id,
      })),
    };
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const path = url.pathname;
    const origin = req.headers.origin;
    const now = clock();

    // أصلنا نحن مسموح دائمًا: Vite تضع `crossorigin` على وسم السكربت، فيرسل
    // المتصفح ترويسة `Origin` حتى لطلب من نفس الأصل — ورفضها يمنع الصفحة من
    // تحميل ملفاتها هي. (والـhttps يُضاف لأن الوسيط قد ينهي TLS قبلنا.)
    const host = req.headers.host;
    const mine = host ? [`http://${host}`, `https://${host}`] : [];
    if (origin) {
      if (!mine.includes(origin) && !WEB.includes(origin)) {
        return json(res, 403, { error: "bad_origin" });
      }
      res.setHeader("access-control-allow-origin", origin);
      res.setHeader("access-control-allow-credentials", "true");
      res.setHeader("vary", "Origin");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-max-age": "600",
      }).end();
      return;
    }

    if (!path.startsWith("/api/")) {
      if (site.serve(path, res)) return;
      return json(res, 404, {
        error: "no_site",
        message: T("الواجهة مش مبنية. شغّل npm run ehna:build.",
                   "The interface is not built. Run npm run ehna:build."),
      });
    }

    if (SECRET.length < 32) {
      return json(res, 503, {
        error: "no_secret",
        message: T("EHNA_SECRET غير مضبوط (32 حرفًا على الأقل). شغّل npm run ehna:setup.",
                   "EHNA_SECRET is not set (32 characters minimum). Run npm run ehna:setup."),
      });
    }

    const cookies = parseCookies(req.headers.cookie);
    const ip = String(req.headers["x-forwarded-for"] ?? "").split(",")[0]?.trim()
      || req.socket.remoteAddress || "?";

    if (path === "/api/health") {
      let initialized = true;
      try { await store.read(); } catch { initialized = false; }
      return json(res, 200, { ok: true, initialized, store: store.describe() });
    }

    if (path === "/api/login" && req.method === "POST") {
      if (throttled(ip, now.getTime())) return json(res, 429, { error: "too_many" });
      const body = await jsonBody(req, res);
      if (!body) return;
      const handleName = typeof body["handle"] === "string" ? body["handle"] : "";
      const password = typeof body["password"] === "string" ? body["password"] : "";
      if (!handleName || !password) return json(res, 400, { error: "missing" });

      const vault = await readVault(res);
      if (!vault) return;

      const result = await login(vault, handleName, password, {
        now, agent: deviceName(req.headers["user-agent"]),
      });
      // حتى الفشل يُحفظ: عدّاد المحاولات لا يُنسى بإعادة التشغيل
      const saved = await store.write(vault, vault.rev);
      if (!result.ok) {
        return json(res, 401, {
          error: result.reason,
          message: result.reason === "locked"
            ? T(`الحساب مقفول مؤقتًا. جرّب بعد ${result.retryAfterMin} دقيقة.`,
                `The account is locked for now. Try again in ${result.retryAfterMin} minutes.`)
            : T("البيانات مش مظبوطة.", "Those details are not right."),
        });
      }

      return json(res, 200, state(saved, result.session, now), {
        "set-cookie": cookie(COOKIE, signToken(result.session.id, SECRET), {
          maxAgeSec: SESSION_SEC, secure: SECURE,
        }),
      });
    }

    const me = await authenticate(cookies[COOKIE], now, res);
    if (!me) return;

    if (path === "/api/state" && req.method === "GET") {
      return json(res, 200, state(me.vault, me.session, now));
    }

    if (path === "/api/logout" && req.method === "POST") {
      me.vault.sessions = me.vault.sessions.filter((s) => s.id !== me.session.id);
      await store.write(me.vault, me.vault.rev);
      return json(res, 200, { ok: true }, {
        "set-cookie": cookie(COOKIE, "", { maxAgeSec: 0, secure: SECURE }),
      });
    }

    if (path === "/api/act" && req.method === "POST") {
      const body = await jsonBody(req, res);
      if (!body) return;
      const parsed = Actions.safeParse(body["action"]);
      if (!parsed.success) {
        return json(res, 400, {
          error: "bad_action",
          issues: parsed.error.issues.slice(0, 4)
            .map((i) => ({ path: i.path.join("."), message: i.message })),
        });
      }

      // التعارض يُحَل بإعادة التطبيق على أحدث نسخة، لا برسالة للمستخدم:
      // الفعل موصوف بنيته ("علّم المهمة دي تمّت")، فتطبيقه على نسخة أحدث
      // يظل صحيحًا. ما كان ليصح هو إرسال حالة كاملة قديمة.
      for (let tries = 0; tries < 4; tries++) {
        const vault = tries === 0 ? me.vault : await store.read();
        try {
          vault.space = apply(vault.space, parsed.data, { by: me.session.key, now });
        } catch (err) {
          if (err instanceof ActError) return json(res, 409, { error: err.code, message: err.text });
          throw err;
        }
        try {
          const saved = await store.write(vault, vault.rev);
          // الصور ثقيلة، والكنس يمر على القرص — فلا يُشغَّل إلا حين يتغير ما يشير إليها
          // `memory.add` تدخل الكنس أيضًا: الصورة تخرج من قائمة "المرفوع للتو"
          // ساعة ما ترتبط بذكرى، فحذف الذكرى بعدها يحذفها فورًا لا بعد ساعتين.
          if (parsed.data.type.startsWith("memory.")) {
            await sweepPhotos(saved.space, now.getTime()).catch((err: unknown) => {
              // فشل الكنس لا يُفشِل الكتابة: الذكرى حُفظت، وبقاء ملف زائد ليس خطأ للمستخدم
              console.error("[sweep]", err);
            });
          }
          return json(res, 200, state(saved, me.session, now));
        } catch (err) {
          if (!(err instanceof ConflictError)) throw err;
        }
      }
      return json(res, 503, {
        error: "busy",
        message: T("المساحة بتتكتب من الجهة التانية. جرّب تاني.",
                   "The other side is writing to the space. Try again."),
      });
    }

    if (path === "/api/photo" && req.method === "POST") {
      let bytes: Buffer;
      try { bytes = await readBody(req, MAX_PHOTO); }
      catch {
        return json(res, 413, { error: "too_large", message: T("الصورة أكبر من 8 ميجا.", "The photo is larger than 8 MB.") });
      }
      const mime = sniffImage(bytes);
      if (!mime) return json(res, 415, { error: "not_image", message: T("الملف ده مش صورة.", "That file is not an image.") });
      const id = await store.putPhoto({ bytes, mime });
      fresh.set(id, now.getTime());
      return json(res, 200, { id });
    }

    if (path.startsWith("/api/photo/") && req.method === "GET") {
      const photo = await store.getPhoto(path.slice("/api/photo/".length));
      if (!photo) return json(res, 404, { error: "not_found" });
      res.writeHead(200, {
        "content-type": photo.mime,
        "content-length": String(photo.bytes.length),
        // خاصة: لا وسيط يخزّنها، والمتصفح وحده يحتفظ بها لأن المعرّف ثابت
        "cache-control": "private, max-age=31536000, immutable",
      });
      res.end(Buffer.from(photo.bytes));
      return;
    }

    if (path === "/api/export" && req.method === "GET") {
      return json(res, 200, {
        exportedAt: now.toISOString(),
        note: "مساحة إحنا كاملة. البيانات ملككم — نسخة تُقرأ بأي محرر.",
        space: forViewer(me.vault.space, me.session.key, now),
        photos: await store.listPhotos(),
      }, { "content-disposition": `attachment; filename="ehna-${todayOf(now)}.json"` });
    }

    if (path === "/api/password" && req.method === "POST") {
      const body = await jsonBody(req, res);
      if (!body) return;
      const current = typeof body["current"] === "string" ? body["current"] : "";
      const next = typeof body["next"] === "string" ? body["next"] : "";
      const account = me.vault.accounts.find((a) => a.key === me.session.key);
      if (!account) return json(res, 404, { error: "not_found" });
      if (!await checkPassword(current, account)) {
        return json(res, 401, { error: "wrong", message: T("كلمة السر الحالية مش مظبوطة.", "That is not your current password.") });
      }
      const problem = passwordProblem(next);
      if (problem) return json(res, 400, { error: "weak", message: problem });

      const fresh = await hashPassword(next);
      me.vault.accounts = me.vault.accounts.map((a) =>
        a.key === account.key ? { ...a, ...fresh, updatedAt: now.toISOString() } : a);
      // تغيير كلمة السر يُنهي جلساتك الأخرى — وإلا فالتغيير لا يطرد أحدًا
      me.vault.sessions = me.vault.sessions.filter(
        (s) => s.key !== account.key || s.id === me.session.id);
      await store.write(me.vault, me.vault.rev);
      return json(res, 200, { ok: true });
    }

    /**
     * الطبقة الاختيارية.
     *
     * `/brief` يبني النص ويعرضه بلا أي نداء خارجي — فيمكن قراءة ما سيخرج
     * قبل أن يخرج. و`/ask` **يعيد بناءه على الخادم** من نفس المساحة ولا
     * يقرأ نصًا من العميل: المتصفح يطلب نوعًا، لا كلامًا. بهذا لا يستطيع
     * عميل مخترَق أن يحقن تعليمات في النموذج ولا أن يوسّع ما يُرسَل.
     */
    if ((path === "/api/oracle/brief" || path === "/api/oracle/ask") && req.method === "POST") {
      const body = await jsonBody(req, res);
      if (!body) return;
      const kind = String(body["kind"] ?? "") as OracleKind;
      if (!ORACLE_KINDS.has(kind)) return json(res, 400, { error: "bad_kind" });
      const targetId = typeof body["targetId"] === "string" ? body["targetId"] : undefined;

      const space = forViewer(me.vault.space, me.session.key, now);
      const brief: Brief = buildBrief({
        space,
        report: report(space, todayOf(now), me.session.key),
        viewer: me.session.key,
        kind,
        ...(targetId === undefined ? {} : { targetId }),
      });

      if (path === "/api/oracle/brief") {
        return json(res, 200, { brief, enabled: Boolean(cfg.oracle?.apiKey) });
      }

      if (!cfg.oracle?.apiKey) {
        // لا مفتاح: الوقائع نفسها، مرتبة، بلا اعتذار
        return json(res, 200, { brief, offline: true, text: offline(brief) });
      }

      const today = todayOf(now);
      const used = me.vault.oracle?.day === today ? me.vault.oracle.count : 0;
      if (used >= ORACLE_PER_DAY) {
        return json(res, 429, {
          error: "oracle_limit",
          message: T(`خلصت الـ${ORACLE_PER_DAY} نداء بتوع النهارده.`,
                     `That is all ${ORACLE_PER_DAY} calls for today.`),
          brief, text: offline(brief), offline: true,
        });
      }
      // العدّ قبل النداء: الحد يحمي الفاتورة، والفشل لا يُعاد رصيده
      me.vault.oracle = { day: today, count: used + 1 };
      await store.write(me.vault, me.vault.rev);

      try {
        const answer = await ask(
          { apiKey: cfg.oracle.apiKey, ...(cfg.oracle.model ? { model: cfg.oracle.model } : {}) },
          brief,
        );
        return json(res, 200, { brief, text: answer.text, model: answer.model, used: used + 1, limit: ORACLE_PER_DAY });
      } catch (err) {
        const message = err instanceof OracleError
          ? T(err.message, err.message)
          : T("النموذج مردّش.", "The model did not answer.");
        console.error("[oracle]", err);
        return json(res, 502, { error: "oracle_failed", message, brief, text: offline(brief), offline: true });
      }
    }

    if (path === "/api/session/revoke" && req.method === "POST") {
      const body = await jsonBody(req, res);
      if (!body) return;
      const id = typeof body["id"] === "string" ? body["id"] : "";
      const target = me.vault.sessions.find((s) => s.id === id);
      if (!target) return json(res, 404, { error: "not_found" });
      // كل واحد يطرد أجهزته هو. المساحة مشتركة، والحسابات ليست كذلك.
      if (target.key !== me.session.key) return json(res, 403, { error: "not_yours" });
      me.vault.sessions = me.vault.sessions.filter((s) => s.id !== id);
      const saved = await store.write(me.vault, me.vault.rev);
      return json(res, 200, state(saved, me.session, now));
    }

    return json(res, 404, { error: "not_found" });
  }

  return createServer((req, res) => {
    handle(req, res).catch((err: unknown) => {
      // تفصيل الخطأ للسجل وحده — الرد لا يصف داخل الخادم لمن يطرق الباب
      console.error("[ehna]", err);
      if (!res.headersSent) json(res, 500, { error: "server_error" });
      else res.end();
    });
  });
}
