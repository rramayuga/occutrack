
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
  const filteredLinks = userRole 
    ? links.filter(link => link.roles.includes(userRole))
    : links;
  
  return (
    <ul className="space-y-1">
      {filteredLinks.map(link => (
        <NavLink
          key={link.path}
          path={link.path}
          name={link.name}
          icon={link.icon}
        />
      ))}
    </ul>
  );
};

export default NavLinkList;
