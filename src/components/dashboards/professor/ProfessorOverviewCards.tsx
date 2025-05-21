
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from 'lucide-react';

interface ProfessorOverviewCardsProps {
  availableRooms: number;
  totalRooms: number;
}

export const ProfessorOverviewCards: React.FC<ProfessorOverviewCardsProps> = ({ 
  availableRooms, 
  totalRooms 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Available Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{availableRooms}</span>
            <Building className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            {availableRooms > 0 
              ? `${availableRooms} of ${totalRooms} rooms available` 
              : "No rooms currently available"}
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rooms Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{totalRooms}</span>
            <Building className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">Total rooms in system</p>
        </CardFooter>
      </Card>
    </div>
  );
};
