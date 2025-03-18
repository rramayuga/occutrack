import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User as UserType, UserRole } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { 
  Menu, X, User, FileText, Home, LogIn, 
  BookOpen, CalendarCheck, Settings, Users, Building, 
  Bell, LogOut, Award, Shield
} from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    };
    
    checkAuth();

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('mockUserRole');
    setUser(null);
    toast({
      title: "Signed out",
      description: "You have been successfully signed out."
    });
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home size={18} />, roles: ['student', 'professor', 'admin', 'superadmin'] },
    { name: 'Dashboard', path: '/dashboard', icon: <BookOpen size={18} />, roles: ['student', 'professor', 'admin', 'superadmin'] },
    { name: 'Rooms', path: '/rooms', icon: <Building size={18} />, roles: ['student', 'professor', 'admin', 'superadmin'] },
    { name: 'Announcements', path: '/announcements', icon: <Bell size={18} />, roles: ['student', 'professor', 'admin', 'superadmin'] },
  ];

  const adminLinks = [
    { name: 'Room Management', path: '/room-management', icon: <CalendarCheck size={18} />, roles: ['admin', 'superadmin'] },
    { name: 'Faculty Management', path: '/faculty-management', icon: <Users size={18} />, roles: ['admin', 'superadmin'] },
    { name: 'Buildings & Types', path: '/admin/buildings', icon: <Building size={18} />, roles: ['admin', 'superadmin'] },
    { name: 'Post Announcements', path: '/admin/announcements', icon: <FileText size={18} />, roles: ['admin', 'superadmin'] },
    { name: 'System Settings', path: '/admin/settings', icon: <Settings size={18} />, roles: ['superadmin'] },
  ];

  const filteredNavLinks = user ? navLinks.filter(link => link.roles.includes(user.role)) : [];
  const filteredAdminLinks = user ? adminLinks.filter(link => link.roles.includes(user.role)) : [];
  
  const activeNavClass = "text-primary font-medium";
  const inactiveNavClass = "text-foreground hover:text-primary transition-colors";
  
  const renderNavLinks = (links: typeof navLinks) => (
    links.map(link => (
      <li key={link.path} className="my-1">
        <Link 
          to={link.path}
          className={`flex items-center px-4 py-2 rounded-md transition-all ${
            location.pathname === link.path ? activeNavClass : inactiveNavClass
          }`}
        >
          <span className="mr-2">{link.icon}</span>
          {link.name}
        </Link>
      </li>
    ))
  );

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-subtle' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 font-medium">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Building size={20} className="text-white" />
            </div>
            <span className="text-lg font-semibold">Facility Tracker</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <ul className="flex items-center space-x-2">
              {renderNavLinks(filteredNavLinks)}
              
              {filteredAdminLinks.length > 0 && (
                <li className="relative group">
                  <button className="flex items-center px-4 py-2 rounded-md transition-all hover:text-primary">
                    <span className="mr-2"><Shield size={18} /></span>
                    Admin
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-56 opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300">
                    <div className="py-2 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 glass-effect">
                      <ul>
                        {renderNavLinks(filteredAdminLinks)}
                      </ul>
                    </div>
                  </div>
                </li>
              )}
            </ul>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
                  <User size={18} />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut size={18} className="mr-1" /> Sign Out
                </Button>
              </div>
            ) : (
              <Button asChild>
                <Link to="/login" className="flex items-center">
                  <LogIn size={18} className="mr-2" /> Sign In
                </Link>
              </Button>
            )}
          </nav>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div 
        className={`fixed inset-0 z-40 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="absolute inset-0 bg-black opacity-25" onClick={() => setIsOpen(false)}></div>
        <nav className="relative w-64 max-w-sm h-full bg-white dark:bg-gray-900 p-5 ml-auto flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center space-x-2 font-medium">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Building size={20} className="text-white" />
              </div>
              <span className="text-lg font-semibold">Facility Tracker</span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              <X size={24} />
            </button>
          </div>
          
          {user ? (
            <div className="mb-6 pb-6 border-b">
              <Link to="/profile" className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={20} className="text-primary" />
                </div>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.role}</div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="mb-6 pb-6 border-b flex flex-col space-y-2">
              <Button asChild>
                <Link to="/login" className="w-full justify-center">
                  <LogIn size={18} className="mr-2" /> Sign In
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/register" className="w-full justify-center">
                  Register
                </Link>
              </Button>
            </div>
          )}
          
          <ul className="space-y-1">
            {renderNavLinks(filteredNavLinks)}
          </ul>
          
          {filteredAdminLinks.length > 0 && (
            <>
              <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mt-6 mb-2 px-4">
                Administration
              </div>
              <ul className="space-y-1">
                {renderNavLinks(filteredAdminLinks)}
              </ul>
            </>
          )}
          
          {user && (
            <div className="mt-auto pt-6">
              <Button 
                variant="ghost" 
                className="w-full justify-center text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
              >
                <LogOut size={18} className="mr-2" /> Sign Out
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
