
import React from 'react';
import { Button } from "@/components/ui/button";
import { format, addDays } from 'date-fns';

interface DateSelectionButtonsProps {
  onSelect: (date: string) => void;
}

const DateSelectionButtons: React.FC<DateSelectionButtonsProps> = ({ onSelect }) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  const handleSelectToday = () => {
    onSelect(format(today, 'yyyy-MM-dd'));
  };
  
  const handleSelectTomorrow = () => {
    onSelect(format(tomorrow, 'yyyy-MM-dd'));
  };
  
  return (
    <div className="flex gap-2 mt-1">
      <Button 
        type="button" 
        variant="outline" 
        size="sm"
        onClick={handleSelectToday}
      >
        Today
      </Button>
      <Button 
        type="button" 
        variant="outline" 
        size="sm"
        onClick={handleSelectTomorrow}
      >
        Tomorrow
      </Button>
    </div>
  );
};

export default DateSelectionButtons;
