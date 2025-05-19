
import React from 'react';
import { Button } from "@/components/ui/button";
import { X, User, Building, LogOut } from 'lucide-react';
import { User as UserType } from '@/lib/types';
import NavLinkList from './NavLinkList';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  navLinks: any[];
  adminLinks: any[];
  onSignOut: () => Promise<void>;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isOpen, onClose, user, navLinks, adminLinks, onSignOut 
}) => {
  return (
    <div 
      className={`fixed inset-0 z-40 transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 ease-in-out md:hidden`}
    >
      <div className="absolute inset-0 bg-black opacity-25" onClick={onClose}></div>
      <nav className="relative w-64 max-w-sm h-full bg-white dark:bg-gray-900 p-5 ml-auto flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2 font-medium">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Building size={20} className="text-white" />
            </div>
            <span className="text-lg font-semibold">Facility Tracker</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>
        
        {user ? (
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.role}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 pb-6 border-b flex flex-col space-y-2">
            <Button onClick={() => window.location.href = "/login"}>
              Sign in with Google
            </Button>
          </div>
        )}
        
        <NavLinkList links={navLinks} userRole={user?.role} />
        
        {user && adminLinks.filter(link => link.roles.includes(user.role)).length > 0 && (
          <>
            <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mt-6 mb-2 px-4">
              Administration
            </div>
            <NavLinkList links={adminLinks} userRole={user.role} />
          </>
        )}
        
        {user && (
          <div className="mt-auto pt-6">
            <Button 
              variant="ghost" 
              className="w-full justify-center text-muted-foreground hover:text-foreground"
              onClick={onSignOut}
            >
              <LogOut size={18} className="mr-2" /> Sign Out
            </Button>
          </div>
        )}
      </nav>
    </div>
  );
};

export default MobileMenu;
