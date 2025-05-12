
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/lib/auth';
import { Menu, Building } from 'lucide-react';

// Import our components
import NavLinkList from './navbar/NavLinkList';
import AdminDropdown from './navbar/AdminDropdown';
import UserMenu from './navbar/UserMenu';
import MobileMenu from './navbar/MobileMenu';
import { navLinks, adminLinks } from './navbar/navData';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredAdminLinks = user 
    ? adminLinks.filter(link => link.roles.includes(user.role)) 
    : [];

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white/70 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Building className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-lg">NEU OccuTrack</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <ul className="flex items-center space-x-4">
              <NavLinkList links={navLinks} userRole={user?.role} />
              
              {filteredAdminLinks.length > 0 && (
                <AdminDropdown adminLinks={filteredAdminLinks} />
              )}
            </ul>
            
            <UserMenu user={user} onSignOut={handleSignOut} />
          </nav>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      <MobileMenu 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
        navLinks={navLinks}
        adminLinks={filteredAdminLinks}
        onSignOut={handleSignOut}
      />
    </header>
  );
};

export default Navbar;
