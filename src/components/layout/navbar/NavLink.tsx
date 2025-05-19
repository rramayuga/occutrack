
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface NavLinkProps {
  path: string;
  name: string;
  icon: LucideIcon;
  isActive?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ path, name, icon: Icon, isActive }) => {
  const location = useLocation();
  const activeNavClass = "text-primary font-medium";
  const inactiveNavClass = "text-foreground hover:text-primary transition-colors";
  
  // If isActive is provided, use it; otherwise, determine based on path
  const isActiveLink = isActive !== undefined 
    ? isActive 
    : location.pathname === path;

  return (
    <li className="my-1">
      <Link 
        to={path}
        className={`flex items-center px-4 py-2 rounded-md transition-all ${
          isActiveLink ? activeNavClass : inactiveNavClass
        }`}
      >
        <span className="mr-2"><Icon size={18} /></span>
        {name}
      </Link>
    </li>
  );
};

export default NavLink;
