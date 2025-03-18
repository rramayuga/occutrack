
import React from 'react';
import { Shield } from 'lucide-react';
import NavLink from './NavLink';

interface AdminDropdownProps {
  adminLinks: any[];
}

const AdminDropdown: React.FC<AdminDropdownProps> = ({ adminLinks }) => {
  return (
    <li className="relative group">
      <button className="flex items-center px-4 py-2 rounded-md transition-all hover:text-primary">
        <span className="mr-2"><Shield size={18} /></span>
        Admin
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute left-0 mt-2 w-56 opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300">
        <div className="py-2 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 glass-effect">
          <ul>
            {adminLinks.map(link => (
              <NavLink
                key={link.path}
                path={link.path}
                name={link.name}
                icon={link.icon}
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
};

export default AdminDropdown;
