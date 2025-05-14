
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Upload } from 'lucide-react';

interface RoomActionsToolbarProps {
  onImport: () => void;
  onExport: () => void;
  onAddRoom: () => void;
  selectedBuilding?: string;
}

const RoomActionsToolbar: React.FC<RoomActionsToolbarProps> = ({
  onImport,
  onExport,
  onAddRoom,
  selectedBuilding
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between">
      <div className="flex gap-2">
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" /> Export Excel
        </Button>
        <Button variant="outline" onClick={onImport}>
          <Upload className="h-4 w-4 mr-2" /> Import Excel
        </Button>
      </div>
      <Button
        onClick={onAddRoom}
        disabled={!selectedBuilding}
      >
        Add Room
      </Button>
    </div>
  );
};

export default RoomActionsToolbar;
