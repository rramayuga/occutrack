
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import ProctorPage from './pages/Proctor';
import FacultyPage from './pages/Faculty';
import RoomBookingPage from './pages/RoomBooking';
import AdminSettings from './pages/AdminSettings';
import AdminPage from './pages/Admin';
import RegisterPage from './pages/Register';
import ResetPasswordPage from './pages/ResetPassword';
import NotFoundPage from './pages/NotFound';
import AuthRequiredPage from './pages/AuthRequired';
import Rooms from './pages/Rooms';
import UserRights from './pages/UserRights';
import UserManagement from './pages/UserManagement';
import UserDetail from './pages/UserDetail';
import { AuthProvider } from './lib/auth';
import { Toaster } from './components/ui/toaster';
import { RoomManagementProvider } from './components/admin/context/RoomManagementContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth-required" element={<AuthRequiredPage />} />
          
          {/* Protected routes */}
          <Route path="/proctor" element={<ProctorPage />} />
          <Route path="/faculty" element={<FacultyPage />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/room-booking" element={<RoomBookingPage />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<AdminPage />} />
          <Route 
            path="/admin/settings" 
            element={
              <RoomManagementProvider>
                <AdminSettings />
              </RoomManagementProvider>
            } 
          />
          
          {/* User Management routes */}
          <Route path="/user-rights" element={<UserRights />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/users/:id" element={<UserDetail />} />
          
          {/* Catch all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
