
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User as UserType } from '@/lib/types';
import FacultyRegistrationNotifier from '@/components/admin/FacultyRegistrationNotifier';

interface UserMenuProps {
  user: UserType | null;
  onSignOut: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false);
  
  // Return login/register buttons if no user
  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Link to="/login">
          <Button variant="outline" size="sm">Log in</Button>
        </Link>
        <Link to="/register">
          <Button size="sm">Register</Button>
        </Link>
      </div>
    );
  }
  
  // Get first letter of name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="flex items-center gap-2">
      <FacultyRegistrationNotifier />
      
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 flex items-center rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="ms-2 text-sm font-medium hidden md:inline">
              {user.name}
            </span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuLabel className="font-normal pt-0">
            Role: <span className="font-medium capitalize">{user.role}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;
