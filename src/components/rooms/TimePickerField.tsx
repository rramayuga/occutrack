import React, { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Control } from 'react-hook-form';

interface TimePickerFieldProps {
  control: Control<any>;
  name: string;
  label: string;
}

const TimePickerField: React.FC<TimePickerFieldProps> = ({ control, name, label }) => {
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Parse the time value if it exists
        let hourValue = "1";
        let minuteValue = "00";
        let periodValue = "AM";
        
        if (field.value) {
          const [time, period] = field.value.split(" ");
          const [hour, minute] = time.split(":");
          hourValue = parseInt(hour, 10) % 12 === 0 ? "12" : (parseInt(hour, 10) % 12).toString();
          minuteValue = minute;
          periodValue = period || "AM";
        }
        
        const [selectedHour, setSelectedHour] = useState(hourValue);
        const [selectedMinute, setSelectedMinute] = useState(minuteValue);
        const [selectedPeriod, setSelectedPeriod] = useState(periodValue);
        
        const updateTime = (hour: string, minute: string, period: string) => {
          // Convert to 24-hour format for storage but keep AM/PM for display
          let hour24 = parseInt(hour);
          if (period === "PM" && hour24 < 12) hour24 += 12;
          if (period === "AM" && hour24 === 12) hour24 = 0;
          
          const formattedTime = `${hour}:${minute} ${period}`;
          field.onChange(formattedTime);
        };
        
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2">
              <Select
                value={selectedHour}
                onValueChange={(value) => {
                  setSelectedHour(value);
                  updateTime(value, selectedMinute, selectedPeriod);
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-center">:</span>
              
              <Select
                value={selectedMinute}
                onValueChange={(value) => {
                  setSelectedMinute(value);
                  updateTime(selectedHour, value, selectedPeriod);
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedPeriod}
                onValueChange={(value) => {
                  setSelectedPeriod(value);
                  updateTime(selectedHour, selectedMinute, value);
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default TimePickerField;
