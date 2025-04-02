
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Roles from "./pages/Roles";
import Rooms from "./pages/Rooms";
import RoomManagement from "./pages/RoomManagement";
import FacultyManagement from "./pages/FacultyManagement";
import UserManagement from "./pages/UserManagement";
import UserRightsManagementPage from "./pages/UserRightsManagementPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FacultyConfirmation from "./pages/FacultyConfirmation";
import Announcements from "./pages/Announcements";
import AnnouncementsManager from "./pages/admin/AnnouncementsManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/room-management" element={<RoomManagement />} />
          <Route path="/faculty-management" element={<FacultyManagement />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/user-rights" element={<UserRightsManagementPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/faculty-confirmation" element={<FacultyConfirmation />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/admin/announcements" element={<AnnouncementsManager />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
