import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { SpaceProvider } from "./store.js";
import "./ui/fonts.css";
import "./ui/theme.css";
import "./ui/app.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root مفقود");

createRoot(root).render(
  <StrictMode>
    <SpaceProvider>
      <App />
    </SpaceProvider>
  </StrictMode>,
);

/**
 * التسجيل بعد `load` لا قبله: عامل الخدمة يتنافس على الشبكة مع أول رسم
 * لو سُجِّل مبكرًا، فيؤخّر الشاشة التي جاء ليسرّعها.
 *
 * والفشل يُبتلَع بصمت عن قصد: من يفتح المنصة على `http://` في شبكة محلية
 * لا يملك عامل خدمة أصلًا (المتصفح يمنعه خارج HTTPS و`localhost`)، وليس
 * من حقه أن يرى خطأً على أمر ليس منه ولا يمسّ عمل المنصة.
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
