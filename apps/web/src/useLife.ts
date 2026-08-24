import { useCallback, useEffect, useState } from "react";
import type { Signal } from "@gonaim/domain";

const API = "http://localhost:8787/api";

export interface LifeData {
  today: string;
  surfaced: Signal[];
  inbox: Signal[];
  belowThreshold: Signal[];
  stayedSilent: boolean;
  counts: Record<string, number>;
}

export type LifeState =
  | { phase: "loading" }
  | { phase: "ready"; data: LifeData }
  /** `kind` يفرّق: خادم مطفأ ≠ قاعدة غير مضبوطة ≠ حياة فارغة. */
  | { phase: "unavailable"; kind: "offline" | "no_database"; message: string };

export function useLife() {
  const [state, setState] = useState<LifeState>({ phase: "loading" });

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`${API}/signals`);
      const body = await res.json();
      if (!res.ok) {
        setState({
          phase: "unavailable",
          kind: body.error === "no_database" ? "no_database" : "offline",
          message: body.message ?? body.error ?? "تعذّر التحميل",
        });
        return;
      }
      setState({ phase: "ready", data: body as LifeData });
    } catch {
      setState({ phase: "unavailable", kind: "offline",
        message: "الخادم المحلي على 8787 لا يستجيب." });
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  return { state, reload };
}

/** هل النظام لا يعرف شيئًا بعد؟ ليست حالة خطأ — بداية باردة مشروعة. */
export function isColdStart(data: LifeData): boolean {
  return Object.values(data.counts).every((n) => n === 0);
}
