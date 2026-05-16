import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { setupPWA } from "./lib/pwa";
import { installErrorLogger } from "./lib/errorLogger";

setupPWA();
installErrorLogger();

createRoot(document.getElementById("root")!).render(<App />);
