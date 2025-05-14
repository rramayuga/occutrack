
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImportRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  onImport: () => void;
  isUploading: boolean;
  hasFile: boolean;
}

const ImportRoomDialog: React.FC<ImportRoomDialogProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  onImport,
  isUploading,
  hasFile
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Rooms from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing room data organized by buildings. Each building section should start with <code>### BUILDING: Building Name ###</code> followed by the room data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input 
            type="file" 
            accept=".csv" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFileSelect(e.target.files[0]);
              }
            }} 
          />
          <p className="text-xs text-muted-foreground">
            CSV Format Example:
          </p>
          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
            ### BUILDING: Main Building ###<br />
            name,type,floor,capacity,status<br />
            101,Classroom,1,30,available<br />
            102,Lab,1,25,occupied<br />
            <br />
            ### BUILDING: Science Building ###<br />
            name,type,floor,capacity,status<br />
            S101,Lab,1,40,available
          </pre>
          <p className="text-xs text-muted-foreground">
            Existing rooms with matching names will be updated.
          </p>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={onImport} 
            disabled={isUploading || !hasFile}
          >
            {isUploading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportRoomDialog;
