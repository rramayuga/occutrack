
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Settings, Lock, Bell } from 'lucide-react';

const AdminTools: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Super Admin Tools</CardTitle>
        <CardDescription>System-wide controls</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer">
            <div className="rounded-full p-2 bg-primary/10 mr-3">
              <Database className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Database Management</h4>
              <p className="text-xs text-muted-foreground">Configure and optimize databases</p>
            </div>
          </div>
          
          <div className="flex items-center p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer">
            <div className="rounded-full p-2 bg-primary/10 mr-3">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">System Configuration</h4>
              <p className="text-xs text-muted-foreground">Global application settings</p>
            </div>
          </div>
          
          <div className="flex items-center p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer">
            <div className="rounded-full p-2 bg-primary/10 mr-3">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Security Controls</h4>
              <p className="text-xs text-muted-foreground">Manage authentication and access</p>
            </div>
          </div>
          
          <div className="flex items-center p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer">
            <div className="rounded-full p-2 bg-primary/10 mr-3">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Notification Center</h4>
              <p className="text-xs text-muted-foreground">Manage system notifications</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTools;
