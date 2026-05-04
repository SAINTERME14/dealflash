import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { LeftSidebar } from "./LeftSidebar";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { AnnouncementMarquee } from "@/components/AnnouncementMarquee";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

export function MainLayout() {
  useMessageNotifications();
  return (
    <div className="min-h-screen flex flex-col">
      <LeftSidebar />
      <PaymentTestModeBanner />
      <AnnouncementMarquee />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
