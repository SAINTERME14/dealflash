import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { SellerNotesRoute } from "@/components/auth/SellerNotesRoute";
import AdminFeatured from "./pages/AdminFeatured";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminTickets from "./pages/AdminTickets";
import AdminAuditLog from "./pages/AdminAuditLog";
import AdminSellerApplications from "./pages/AdminSellerApplications";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import Dashboard from "./pages/Dashboard";
import MyListings from "./pages/MyListings";
import MyBookings from "./pages/MyBookings";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Install from "./pages/Install";
import MobileHome from "./pages/MobileHome";
import NotFound from "./pages/NotFound";
import Featured from "./pages/Featured";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/recherche" element={<Search />} />
            <Route path="/vedette" element={<Featured />} />
            <Route path="/categorie/:slug" element={<Search />} />
            <Route path="/annonce/:id" element={<ListingDetail />} />
            <Route path="/installer" element={<Install />} />
            <Route path="/app" element={<MobileHome />} />
            <Route path="/vendre" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
            <Route path="/tableau-de-bord" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/mes-annonces" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
            <Route path="/mes-reservations" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/favoris" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/vedette" element={<AdminRoute><AdminFeatured /></AdminRoute>} />
            <Route path="/admin/utilisateurs" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
            <Route path="/admin/journal" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />
            <Route path="/admin/demandes-vendeurs" element={<SellerNotesRoute><AdminSellerApplications /></SellerNotesRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
