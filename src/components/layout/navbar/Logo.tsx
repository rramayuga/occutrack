
import React from 'react';
import { Link } from 'react-router-dom';
import { Building } from 'lucide-react';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center space-x-2 font-medium">
      <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
        <Building size={20} className="text-white" />
      </div>
      <span className="text-lg font-semibold">Facility Tracker</span>
    </Link>
  );
};

export default Logo;
