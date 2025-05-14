
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NavItem } from './navData';

interface NavLinkProps {
  item: NavItem;
  isMobile?: boolean;
}

const NavLink = ({ item, isMobile = false }: NavLinkProps) => {
  const { pathname } = useLocation();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  
  return (
    <Link
      to={item.href}
      className={cn(
        "transition-colors",
        isActive
          ? "text-primary font-medium"
          : "text-muted-foreground hover:text-foreground",
        isMobile && "flex items-center py-2"
      )}
    >
      {item.icon && (
        <span className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")}>
          {React.createElement(item.icon)}
        </span>
      )}
      {item.label}
    </Link>
  );
};

export default NavLink;
