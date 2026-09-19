import type { Lang } from "./text.js";

/**
 * نموذج الحياة المشتركة.
 *
 * هذا ليس "تطبيق قائمة مهام لفرح". الفرح يوم؛ والنموذج هنا مبني ليعيش بعده:
 * نفس الجداول تحمل التجهيز قبل الجواز، والذكريات بعده. لذلك لا يوجد نوع
 * اسمه `WeddingTask` — يوجد `Task` له `phase`، والمرحلة تتغير ولا يتغير
 * الجدول (ADR-0010: life-first not project-first).
 *
 * قاعدتان تحكمان كل نوع هنا:
 *  1. كل سطر يعرف **مَن** أدخله ومتى — لأن المساحة لاثنين، و"مين اللي كتب ده"
 *     سؤال يُسأل بعد سنة ولا يجب أن يبقى بلا جواب.
 *  2. لا حقل محسوب يُخزَّن. النسب والمجاميع والتوقعات تُحسب من المصدر في
 *     `analytics.ts` — رقم مخزَّن يكذب بعد أول تعديل.
 */

/** المفتاح داخلي وثابت. الاسم المعروض يتغير، والمفتاح لا. */
export type PersonKey = "him" | "her";

/** فاعل: واحد منهما أو الاثنان معًا. "معًا" ليست مجاملة — لها حساب في التوازن. */
export type Actor = PersonKey | "both";

/**
 * ما يقوله الواحد عن نفسه.
 *
 * خيارات مغلقة لا نص حر — لأن الهدف **المقارنة** لا التوصيف: "لغة حبي
 * وقت" و"لغة حبه أفعال" جملة تُقرأ فقط حين يكون للحقلين نفس المفردات.
 * والنص الحر محفوظ لثلاثة أسطر تخص صاحبها وحده.
 *
 * وكل هذا **إعلان**، لا تشخيص. النظام لا يستنتج شخصية أحد من سلوكه ثم
 * يخبره بها كأنها حقيقة — يقيس سلوكًا، ويعرض ما أعلنه صاحبه، ويضع
 * الاثنين جنبًا إلى جنب.
 */
export interface Traits {
  /** كيف يصل إليه الحب: كلام · وقت · هدايا · أفعال · لمسة. */
  loveLanguage?: "words" | "time" | "gifts" | "acts" | "touch";
  /** كيف يقرر: بسرعة · يبحث · يستشير · يؤجّل. */
  decisionStyle?: "fast" | "research" | "consult" | "avoid";
  /** ماذا يحتاج وقت الضغط: كلام · مساحة · حل · تغيير جو. */
  stressStyle?: "talk" | "space" | "fix" | "distract";
  /** متى يكون في أفضل حالاته. */
  energyTime?: "morning" | "day" | "night";
  /** في الخلاف: مباشر · هادئ · يؤجّل. */
  conflict?: "direct" | "soft" | "delay";
  /** مع الخطط: يخطط · يمشي مع الموج. */
  planning?: "planner" | "flow";
  /** مع الفلوس: مقتصد · متوازن · منطلق. */
  money?: "saver" | "balanced" | "spender";
  /** ما يعيد شحنه. */
  recharge?: string;
  /** ما يفرحه فعلًا. */
  joy?: string;
  /** ما يضايقه — أهم سطر هنا، وأكثر ما لا يُقال. */
  friction?: string;
  updatedAt?: Instant;
}

export interface Person {
  key: PersonKey;
  /** الاسم كما يظهر في الواجهة. */
  name: string;
  /** معرّف الدخول — حروف لاتينية صغيرة وأرقام فقط. */
  handle: string;
  /** لون توقيعه في الواجهة (hex). لكل واحد لون، فيُقرأ السطر بلا اسم. */
  accent: string;
  /** جملته في الشاشة الأولى. اختيارية ومملوكة له وحده. */
  line?: string;
  /** ما أعلنه عن نفسه. يعدّله صاحبه وحده — لا الطرف الآخر. */
  traits?: Traits;
  /**
   * اللغة التي يقرأ بها — لا لغة «المساحة».
   *
   * وهذا هو الفرق كله: المساحة واحدة والقارئان اثنان، فقد يقرأ أحدهما
   * بالعربية والآخر بالإنجليزية في نفس الثانية ومن نفس الحمولة. ولذلك
   * تعيش اللغة في `Person` لا في `Settings`: لو عاشت في الإعدادات لصار
   * تفضيل أحدهما فرضًا على الآخر.
   *
   * وهي مخزَّنة على الخادم لا في المتصفح، فمن يبدّل لغته على الهاتف
   * يجدها مبدَّلة على الحاسوب — التفضيل يخصّ الشخص، لا الجهاز.
   */
  lang?: Lang;
}

/** تاريخ بلا وقت: YYYY-MM-DD. */
export type DateOnly = string;
/** وقت محلي بلا منطقة زمنية: YYYY-MM-DDTHH:mm — حياة الاثنين في مدينة واحدة. */
export type LocalTime = string;
/** لحظة كاملة بـUTC — للسجل والتدقيق فقط. */
export type Instant = string;

/* ── المحطات ───────────────────────────────────────── */

export type MilestoneKind =
  | "engagement"  // الخطوبة
  | "katb"        // كتب الكتاب
  | "wedding"     // الفرح
  | "honeymoon"   // شهر العسل
  | "move"        // دخول الشقة
  | "custom";

export interface Milestone {
  id: string;
  kind: MilestoneKind;
  title: string;
  date: DateOnly;
  done: boolean;
  note?: string;
}

/* ── المهام ────────────────────────────────────────── */

export type TaskStatus = "todo" | "doing" | "done" | "blocked";
/** المرحلة تبقى بعد الفرح: `after` هو ما يجعل المنصة تستمر. */
export type Phase = "engagement" | "prep" | "wedding" | "after";
/** 1 = لا يُؤجَّل · 2 = مهم · 3 = يستنى. */
export type Priority = 1 | 2 | 3;

export interface Task {
  id: string;
  title: string;
  note?: string;
  owner: Actor;
  phase: Phase;
  status: TaskStatus;
  priority: Priority;
  /** آخر يوم مقبول. غيابه يعني "بلا موعد"، لا "اليوم". */
  due?: DateOnly;
  tags: string[];
  createdBy: PersonKey;
  createdAt: Instant;
  doneAt?: Instant;
  doneBy?: PersonKey;
  /** جاء من كشف التجهيز الافتراضي — يُميَّز حتى يمكن مسحه كله مرة واحدة. */
  seeded?: boolean;
}

/* ── الشقة ─────────────────────────────────────────── */

export interface Room {
  id: string;
  name: string;
  /** رمز نصي واحد يميّز الغرفة بصريًا. */
  glyph: string;
  order: number;
}

/**
 * حالة العنصر أربع درجات لا اثنتان: "مشتري/مش مشتري" تخفي المرحلة التي
 * يضيع فيها الوقت فعلًا — الاختيار والطلب.
 */
export type ItemStatus = "needed" | "chosen" | "ordered" | "bought";

export interface Item {
  id: string;
  roomId: string;
  name: string;
  status: ItemStatus;
  priority: Priority;
  qty: number;
  /** السعر المتوقع — أساس التخطيط. */
  targetPrice?: number;
  /** المدفوع فعلًا — أساس المحاسبة. الفرق بينهما هو تحليل بذاته. */
  actualPrice?: number;
  paidBy?: Actor;
  store?: string;
  url?: string;
  note?: string;
  addedBy: PersonKey;
  createdAt: Instant;
  boughtAt?: Instant;
  seeded?: boolean;
}

export interface Address {
  label?: string;
  area?: string;
  city?: string;
  floor?: string;
  mapUrl?: string;
  note?: string;
}

/* ── الفلوس ────────────────────────────────────────── */

export interface Contribution {
  id: string;
  who: Actor;
  amount: number;
  at: DateOnly;
  note?: string;
  createdBy: PersonKey;
  createdAt: Instant;
}

/** مصروف خارج الشقة: قاعة، فستان، شبكة، مصور… */
export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  at: DateOnly;
  paidBy: Actor;
  note?: string;
  createdBy: PersonKey;
  createdAt: Instant;
}

/* ── المواعيد ──────────────────────────────────────── */

export type AppointmentStatus = "planned" | "done" | "cancelled";

export interface Appointment {
  id: string;
  title: string;
  at: LocalTime;
  durationMin?: number;
  place?: string;
  mapUrl?: string;
  /** مع مين: القاعة، الكوافير، بيت العروسة… */
  with?: string;
  attendees: Actor;
  status: AppointmentStatus;
  note?: string;
  createdBy: PersonKey;
  createdAt: Instant;
}

/* ── الذكريات ──────────────────────────────────────── */

export interface Memory {
  id: string;
  date: DateOnly;
  title: string;
  story?: string;
  place?: string;
  /** معرّفات صور مخزَّنة عند الخادم، أو روابط خارجية. */
  photos: string[];
  tags: string[];
  by: PersonKey;
  createdAt: Instant;
  pinned?: boolean;
}

/* ── حاجات نعملها مع بعض ───────────────────────────── */

export type WishKind = "date" | "travel" | "experience" | "habit" | "buy";
export type WishStatus = "someday" | "planned" | "done";

export interface Wish {
  id: string;
  title: string;
  kind: WishKind;
  status: WishStatus;
  note?: string;
  plannedFor?: DateOnly;
  cost?: number;
  by: PersonKey;
  createdAt: Instant;
  doneAt?: Instant;
}

/* ── بينا ──────────────────────────────────────────── */

export interface Note {
  id: string;
  from: PersonKey;
  body: string;
  at: Instant;
  readAt?: Instant;
  pinned?: boolean;
}

/**
 * رسالة تُفتح في تاريخ لاحق.
 *
 * السرّية هنا ليست تأثيرًا بصريًا: الخادم لا يرسل `body` لغير كاتبها قبل
 * `openAt` (`redact.ts`). لو كان الإخفاء في الواجهة وحدها لكان وعدًا كاذبًا،
 * ومصدر الحقيقة هو استجابة الشبكة لا ما تعرضه الشاشة.
 */
export interface Capsule {
  id: string;
  from: PersonKey;
  title: string;
  body: string;
  openAt: DateOnly;
  createdAt: Instant;
  openedAt?: Instant;
  /** يُضبط عند الإرسال للطرف الآخر قبل موعدها: لا يوجد نص هنا. */
  sealed?: boolean;
}

/* ── القرارات ──────────────────────────────────────── */

export interface DecisionOption {
  id: string;
  label: string;
  note?: string;
  /** تكلفة تقديرية للخيار — القرار المشترك غالبًا قرار مالي. */
  cost?: number;
}

/**
 * سؤال يحتاج رأي الاثنين. لا يُحسم بالأغلبية — صوتان متطابقان أو لا حسم.
 * هذا ليس قيدًا تقنيًا بل تصميم: قرار يخص اثنين لا يُغلَق برأي واحد.
 */
export interface Decision {
  id: string;
  question: string;
  options: DecisionOption[];
  votes: Partial<Record<PersonKey, string>>;
  chosen?: string;
  resolvedAt?: Instant;
  createdBy: PersonKey;
  createdAt: Instant;
}

/* ── السجل ─────────────────────────────────────────── */

export interface LogEntry {
  id: string;
  at: Instant;
  by: PersonKey;
  /** كود الفعل كما وصل — `task.add`، `item.update`… */
  action: string;
  /** سطر عربي يُقرأ بلا شرح: "غنيم اشترى: غسالة". */
  summary: string;
}

/* ── المساحة ───────────────────────────────────────── */

export interface Settings {
  /** اسم المساحة كما يظهر أعلى الشاشة. */
  title: string;
  currency: string;
  /** الميزانية المخطَّطة كلها. صفر يعني "لم تُحدَّد بعد"، لا "لا يوجد مال". */
  budget: number;
  /** بداية الحكاية — منها تُحسب "بقالنا قد إيه". */
  together?: DateOnly;
  address: Address;
}

export interface Space {
  /** رقم المخطط. تغييره يعني هجرة بيانات، لا تجاهلًا. */
  schema: 1;
  /** يزيد مع كل كتابة ناجحة — أساس منع الكتابة فوق كتابة. */
  version: number;
  updatedAt: Instant;
  people: Record<PersonKey, Person>;
  settings: Settings;
  milestones: Milestone[];
  tasks: Task[];
  rooms: Room[];
  items: Item[];
  contributions: Contribution[];
  expenses: Expense[];
  appointments: Appointment[];
  memories: Memory[];
  wishes: Wish[];
  notes: Note[];
  capsules: Capsule[];
  decisions: Decision[];
  /** آخر ما حدث. مقصوص عند حد ثابت — سجل بلا حد يصير ملفًا لا يُقرأ. */
  log: LogEntry[];
}

export const LOG_LIMIT = 400;
