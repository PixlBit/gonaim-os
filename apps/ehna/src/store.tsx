import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Action, PersonKey, Person } from "@gonaim/couple";
import { api, ApiError, type State } from "./api.js";

/**
 * حالة التطبيق.
 *
 * مصدر واحد للحقيقة: ما يعيده الخادم. الفعل يُرسَل، والرد يستبدل الحالة
 * كلها. لا تحديث متفائل — لأن النتيجة هنا ليست "نجح/فشل" فقط: الفعل
 * يغيّر التحليلات والانتباه وكلها محسوبة على الخادم، فإعادة الحالة
 * كاملة أبسط وأصدق من محاولة تقليدها في المتصفح.
 *
 * وتحديث دوري كل ٢٠ ثانية وعند العودة للنافذة: مساحة لاثنين لا بد أن
 * ترى ما كتبه الطرف الآخر بلا أن يُطلَب منك تحديث الصفحة.
 */

export type Phase =
  | { kind: "loading" }
  | { kind: "gate"; note?: string }
  | { kind: "blank"; message: string }   // المساحة لم تُجهَّز بعد
  | { kind: "down"; message: string }
  | { kind: "ready"; state: State };

interface Ctx {
  phase: Phase;
  busy: boolean;
  /** آخر خطأ كتابة — يُعرَض ويُمسَح، ولا يُبقي الشاشة رهينة. */
  problem: string | null;
  clearProblem(): void;
  act(action: Action): Promise<boolean>;
  signIn(handle: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
  setState(next: State): void;
}

const SpaceCtx = createContext<Ctx | null>(null);

const REFRESH_MS = 20_000;

export function SpaceProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const live = useRef(true);

  const load = useCallback(async () => {
    try {
      const state = await api.state();
      if (live.current) setPhase({ kind: "ready", state });
    } catch (err) {
      if (!live.current) return;
      const e = err as ApiError;
      if (e.status === 401) setPhase({ kind: "gate" });
      else if (e.code === "not_initialized") setPhase({ kind: "blank", message: e.message });
      else if (e.code === "no_secret") setPhase({ kind: "blank", message: e.message });
      else setPhase({ kind: "down", message: e.message });
    }
  }, []);

  useEffect(() => {
    live.current = true;
    void load();
    return () => { live.current = false; };
  }, [load]);

  // التحديث الدوري يتوقف والصفحة مخفية — لا فائدة من طلب لا يراه أحد
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void load();
    };
    const timer = window.setInterval(tick, REFRESH_MS);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", tick); };
  }, [load]);

  const act = useCallback(async (action: Action): Promise<boolean> => {
    setBusy(true);
    setProblem(null);
    try {
      const state = await api.act(action);
      setPhase({ kind: "ready", state });
      return true;
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 401) { setPhase({
          kind: "gate",
          note: document.documentElement.lang === "en"
            ? "Your session ended. Sign in again."
            : "الجلسة انتهت. ادخل تاني.",
        }); return false; }
      setProblem(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const signIn = useCallback(async (handle: string, password: string) => {
    setBusy(true);
    try {
      setPhase({ kind: "ready", state: await api.login(handle, password) });
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try { await api.logout(); } finally { setPhase({ kind: "gate" }); }
  }, []);

  const value: Ctx = {
    phase, busy, problem,
    clearProblem: () => setProblem(null),
    act, signIn, signOut,
    refresh: load,
    setState: (next) => setPhase({ kind: "ready", state: next }),
  };

  return <SpaceCtx.Provider value={value}>{children}</SpaceCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(SpaceCtx);
  if (!ctx) throw new Error("SpaceProvider مفقود");
  return ctx;
}

/** الحالة الجاهزة — للشاشات التي لا تُعرَض إلا بعد الدخول. */
export function useSpace(): State & { act: Ctx["act"]; busy: boolean; you: Person; them: Person } {
  const { phase, act, busy } = useApp();
  if (phase.kind !== "ready") throw new Error("الشاشة اتفتحت قبل الحالة");
  const other: PersonKey = phase.state.me === "him" ? "her" : "him";
  return {
    ...phase.state, act, busy,
    you: phase.state.space.people[phase.state.me],
    them: phase.state.space.people[other],
  };
}
