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
  // For NEU domain users, they automatically get access to student role links
  // If user has faculty role, they should see all faculty links
  const filteredLinks = userRole 
    ? links.filter(link => {
        // Faculty users should see all faculty links
        if (userRole === 'faculty' && link.roles.includes('faculty')) {
          return true;
        }
        // Other roles see their specific links
        return link.roles.includes(userRole);
      })
    : links;
  
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
