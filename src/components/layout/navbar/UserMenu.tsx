
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User, LogOut } from 'lucide-react';
import { User as UserType } from '@/lib/types';

interface UserMenuProps {
  user: UserType | null;
  onSignOut: () => Promise<void>;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onSignOut }) => {
  if (!user) {
    return (
      <Button asChild>
        <Link to="/login" className="flex items-center">
          <LogOut size={18} className="mr-2" /> Sign In
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
        <User size={18} />
        <span>{user.name.split(' ')[0]}</span>
      </Link>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground hover:text-foreground"
        onClick={onSignOut}
      >
        <LogOut size={18} className="mr-1" /> Sign Out
      </Button>
    </div>
  );
};

export default UserMenu;
