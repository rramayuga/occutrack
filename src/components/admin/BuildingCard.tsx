
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
}

const BuildingCard: React.FC<BuildingCardProps> = ({
  id,
  name,
  roomCount,
  utilization,
  onView,
  onEdit
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingCard;
