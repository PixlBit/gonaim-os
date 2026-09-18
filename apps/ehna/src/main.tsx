import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { SpaceProvider } from "./store.js";
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
