
import React from 'react';
import NavLink from './NavLink';
import { UserRole } from '@/lib/types';

interface NavLinkItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

interface NavLinkListProps {
  links: NavLinkItem[];
  userRole?: UserRole;
}

const NavLinkList: React.FC<NavLinkListProps> = ({ links, userRole }) => {
  // Filter links based on user role if provided
  // If no role is provided (not logged in), only show links marked for unauthenticated users
  const filteredLinks = userRole 
    ? links.filter(link => link.roles.includes(userRole))
    : links.filter(link => link.roles.includes('unauthenticated'));
  
  return (
    <div className="flex flex-row items-center space-x-6">
      {filteredLinks.map(link => (
        <NavLink
          key={link.path}
          path={link.path}
          name={link.name}
          icon={link.icon}
        />
      ))}
    </div>
  );
};

export default NavLinkList;
