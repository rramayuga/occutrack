
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import HomePage from './pages/Index';  // Changed from ./pages/Home to ./pages/Index
import NotFoundPage from './pages/NotFound';
import AuthRequiredPage from './pages/AuthRequired';
import Rooms from './pages/Rooms';
import UserRights from './pages/UserRights';
import UserManagement from './pages/UserManagement';
import UserDetail from './pages/UserDetail';
import { Toaster } from './components/ui/toaster';
import { RoomManagementProvider } from './components/admin/context/RoomManagementContext';
import Dashboard from './pages/Dashboard'; // For faculty, admin, proctor pages
import RegisterPage from './pages/Register';
import { AuthProvider } from './components/AuthProvider'; // Fixed import path

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<RegisterPage />} /> {/* Temporarily using RegisterPage */}
          <Route path="/auth-required" element={<AuthRequiredPage />} />
          
          {/* Protected routes */}
          <Route path="/proctor" element={<Dashboard />} />
          <Route path="/faculty" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/room-booking" element={<Dashboard />} /> {/* Temporarily using Dashboard */}
          
          {/* Admin routes */}
          <Route path="/admin" element={<Dashboard />} />
          <Route 
            path="/admin/settings" 
            element={
              <RoomManagementProvider>
                <Dashboard />
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
