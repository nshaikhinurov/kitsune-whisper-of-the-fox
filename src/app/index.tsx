import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app.tsx";
import "./index.css";

const twa = window.Telegram?.WebApp;
if (twa) {
  twa.ready();
  twa.expand();
  twa.disableVerticalSwipes?.();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
