
import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { User } from '@/lib/types';

// Add proper props interface to fix the TypeScript error
interface UserMenuProps {
  user?: User | null;
  onSignOut?: () => Promise<void>;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onSignOut }) => {
  const auth = useAuth();
  const navigate = useNavigate();
  
  // Use the props if provided, otherwise use context
  const currentUser = user || auth.user;
  const handleSignOut = onSignOut || auth.signOut;
  
  if (!currentUser) {
    return null;
  }
  
  const initials = currentUser.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';
    
  const isFaculty = currentUser.role === 'faculty';
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 outline-none">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
          </div>
          <Avatar className="h-8 w-8 md:h-9 md:w-9">
            <AvatarImage src={currentUser.avatarUrl} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex flex-col p-2">
          <p className="text-sm font-medium">{currentUser.email}</p>
          <p className="text-xs text-muted-foreground">Role: {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</p>
        </div>
        
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
