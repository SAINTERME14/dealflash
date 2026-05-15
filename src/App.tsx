import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { SellerNotesRoute } from "@/components/auth/SellerNotesRoute";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
const AdminLogin = lazy(() => import("./pages/AdminLogin"));

// Lazy-loaded routes (code-splitting)
const Search = lazy(() => import("./pages/Search"));
const Featured = lazy(() => import("./pages/Featured"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Install = lazy(() => import("./pages/Install"));
const MobileHome = lazy(() => import("./pages/MobileHome"));
const CreateListing = lazy(() => import("./pages/CreateListing"));
const SellerVerification = lazy(() => import("./pages/SellerVerification"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyListings = lazy(() => import("./pages/MyListings"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Messages = lazy(() => import("./pages/Messages"));
const Profile = lazy(() => import("./pages/Profile"));
const Support = lazy(() => import("./pages/Support"));
const SupportTicket = lazy(() => import("./pages/SupportTicket"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminContent = lazy(() => import("./pages/AdminContent"));
const AdminFeatured = lazy(() => import("./pages/AdminFeatured"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminTickets = lazy(() => import("./pages/AdminTickets"));
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"));
const AdminTasks = lazy(() => import("./pages/AdminTasks"));
const AdminFinances = lazy(() => import("./pages/AdminFinances"));
const AdminSupport = lazy(() => import("./pages/AdminSupport"));
const AdminSellerApplications = lazy(() => import("./pages/AdminSellerApplications"));
const AdminSellerApplicationDetail = lazy(() => import("./pages/AdminSellerApplicationDetail"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications"));
const AdminVerificationDetail = lazy(() => import("./pages/AdminVerificationDetail"));
const AdminDropshipping = lazy(() => import("./pages/AdminDropshipping"));
const AdminSuppliers = lazy(() => import("./pages/AdminSuppliers"));
const AdminSalesChannels = lazy(() => import("./pages/AdminSalesChannels"));
const AdminDropshipOverview = lazy(() => import("./pages/AdminDropshipOverview"));
const AdminDropshipOrders = lazy(() => import("./pages/AdminDropshipOrders"));
const AdminFlashSales = lazy(() => import("./pages/AdminFlashSales"));
const AdminBoutiques = lazy(() => import("./pages/AdminBoutiques"));
const AdminPartners = lazy(() => import("./pages/AdminPartners"));
const AdminServices = lazy(() => import("./pages/AdminServices"));
const AdminAnnonces = lazy(() => import("./pages/AdminAnnonces"));
const About = lazy(() => import("./pages/About"));
const MyReviews = lazy(() => import("./pages/MyReviews"));
const SellerStats = lazy(() => import("./pages/SellerStats"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const BecomeAdvertiser = lazy(() => import("./pages/BecomeAdvertiser"));
const QrRedirect = lazy(() => import("./pages/QrRedirect"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const AffiliateOnboarding = lazy(() => import("./pages/AffiliateOnboarding"));

import { CookieConsent } from "@/components/CookieConsent";

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CookieConsent />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/connexion" element={<AdminLogin />} />
            <Route path="/qr/:code" element={<Suspense fallback={<RouteFallback />}><QrRedirect /></Suspense>} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/recherche" element={<Search />} />
              <Route path="/vedette" element={<Featured />} />
              <Route path="/categorie/:slug" element={<Search />} />
              <Route path="/annonce/:id" element={<ListingDetail />} />
              <Route path="/installer" element={<Install />} />
              <Route path="/app" element={<MobileHome />} />
              <Route path="/vendre" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
              <Route path="/devenir-vendeur" element={<ProtectedRoute><SellerVerification /></ProtectedRoute>} />
              <Route path="/tableau-de-bord" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/mes-annonces" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
              <Route path="/mes-reservations" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
              <Route path="/mes-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
              <Route path="/favoris" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/mes-avis" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
              <Route path="/statistiques-vendeur" element={<ProtectedRoute><SellerStats /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
              <Route path="/support/:id" element={<ProtectedRoute><SupportTicket /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/contenu" element={<AdminRoute><AdminContent /></AdminRoute>} />
              <Route path="/admin/vedette" element={<AdminRoute><AdminFeatured /></AdminRoute>} />
              <Route path="/admin/utilisateurs" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
              <Route path="/admin/journal" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />
              <Route path="/admin/taches" element={<AdminRoute><AdminTasks /></AdminRoute>} />
              <Route path="/admin/finances" element={<AdminRoute><AdminFinances /></AdminRoute>} />
              <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
              <Route path="/admin/demandes-vendeurs" element={<SellerNotesRoute><AdminSellerApplications /></SellerNotesRoute>} />
              <Route path="/admin/demandes-vendeurs/:id" element={<SellerNotesRoute><AdminSellerApplicationDetail /></SellerNotesRoute>} />
              <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
              <Route path="/admin/verifications/:id" element={<AdminRoute><AdminVerificationDetail /></AdminRoute>} />
              <Route path="/admin/dropshipping" element={<AdminRoute><AdminDropshipOverview /></AdminRoute>} />
              <Route path="/admin/dropshipping/catalogue" element={<AdminRoute><AdminDropshipping /></AdminRoute>} />
              <Route path="/admin/dropship-orders" element={<AdminRoute><AdminDropshipOrders /></AdminRoute>} />
              <Route path="/admin/fournisseurs" element={<AdminRoute><AdminSuppliers /></AdminRoute>} />
              <Route path="/admin/canaux" element={<AdminRoute><AdminSalesChannels /></AdminRoute>} />
              <Route path="/admin/ventes-flash" element={<AdminRoute><AdminFlashSales /></AdminRoute>} />
              <Route path="/admin/boutiques" element={<AdminRoute><AdminBoutiques /></AdminRoute>} />
              <Route path="/admin/partenaires" element={<AdminRoute><AdminPartners /></AdminRoute>} />
              <Route path="/admin/services-pro" element={<AdminRoute><AdminServices /></AdminRoute>} />
              <Route path="/admin/annonces" element={<AdminRoute><AdminAnnonces /></AdminRoute>} />
              <Route path="/devenir-annonceur/:profile" element={<BecomeAdvertiser />} />
              <Route path="/affilie" element={<AffiliateDashboard />} />
              <Route path="/a-propos" element={<About />} />
              <Route path="/politique-confidentialite" element={<PrivacyPolicy />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
