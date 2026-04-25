import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <PaymentTestModeBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
