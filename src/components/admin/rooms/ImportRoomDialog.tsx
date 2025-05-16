
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
          <DialogTitle>Import Rooms from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx) containing room data with separate sheets for each building. Each sheet name should match your building name exactly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input 
            type="file" 
            accept=".xlsx" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFileSelect(e.target.files[0]);
              }
            }} 
          />
          <p className="text-xs text-muted-foreground">
            Excel Format Requirements:
          </p>
          <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
            <li>Each building should have its own sheet in the Excel file</li>
            <li>Sheet names must match your building names exactly</li>
            <li>Each sheet should have the following columns: name, type, floor, capacity, status</li>
            <li>The first row should contain column headers</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
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
