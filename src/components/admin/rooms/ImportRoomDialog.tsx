
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
            Upload a CSV file to import or update rooms. The file should include columns for name, type, floor, buildingId, and isAvailable.
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
            Existing rooms with matching names in the same building will be updated.
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
