import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ListingsProvider } from "@/contexts/ListingsContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HomePage from "@/pages/HomePage";
import BrowsePage from "@/pages/BrowsePage";
import ItemDetailsPage from "@/pages/ItemDetailsPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import AddListingPage from "@/pages/AddListingPage";
import EditListingPage from "@/pages/EditListingPage";
import MyListingsPage from "@/pages/MyListingsPage";
import MyBookingsPage from "@/pages/MyBookingsPage";
import BookingRequestsPage from "@/pages/BookingRequestsPage";
import MessagesPage from "@/pages/MessagesPage";
import ProfilePage from "@/pages/ProfilePage";
import ReportPage from "@/pages/ReportPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <I18nProvider>
        <AuthProvider>
          <ChatProvider>
            <ListingsProvider>
            <BrowserRouter>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/browse" element={<BrowsePage />} />
                    <Route path="/items/:id" element={<ItemDetailsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/listings/new" element={<AddListingPage />} />
                    <Route path="/listings/:id/edit" element={<EditListingPage />} />
                    <Route path="/my-listings" element={<MyListingsPage />} />
                    <Route path="/my-bookings" element={<MyBookingsPage />} />
                    <Route path="/booking-requests" element={<BookingRequestsPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
            </ListingsProvider>
          </ChatProvider>
        </AuthProvider>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
