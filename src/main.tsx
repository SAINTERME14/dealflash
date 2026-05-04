import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupPWA } from "./lib/pwa";
import { installErrorLogger } from "./lib/errorLogger";

setupPWA();
installErrorLogger();

createRoot(document.getElementById("root")!).render(<App />);
