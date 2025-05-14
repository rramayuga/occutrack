
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface NavLinkProps {
  path?: string;
  href?: string;
  name?: string;
  label?: string;
  icon?: React.ReactNode;
  isMobile?: boolean;
}

const NavLink = ({ path, href, name, label, icon, isMobile = false }: NavLinkProps) => {
  const { pathname } = useLocation();
  const linkHref = href || path || '/';
  const linkLabel = label || name || '';
  
  const isActive = pathname === linkHref || pathname.startsWith(`${linkHref}/`);
  
  return (
    <Link
      to={linkHref}
      className={cn(
        "transition-colors",
        isActive
          ? "text-primary font-medium"
          : "text-muted-foreground hover:text-foreground",
        isMobile && "flex items-center py-2"
      )}
    >
      {icon && (
        <span className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")}>
          {icon}
        </span>
      )}
      {linkLabel}
    </Link>
  );
};

export default NavLink;
