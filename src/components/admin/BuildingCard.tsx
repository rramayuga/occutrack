
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BuildingCardProps {
  id: string;
  name: string;
  roomCount: number;
  utilization: string;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void; // Added the missing onDelete prop
}

const BuildingCard: React.FC<BuildingCardProps> = ({
  id,
  name,
  roomCount,
  utilization,
  onView,
  onEdit,
  onDelete
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{roomCount} rooms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Utilization:</span>
            <span>{utilization}</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(id)}>View</Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(id)}>Edit</Button>
            <Button variant="outline" size="sm" className="flex-1 bg-red-50 text-red-600 hover:bg-red-100" onClick={() => onDelete(id)}>Delete</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingCard;
