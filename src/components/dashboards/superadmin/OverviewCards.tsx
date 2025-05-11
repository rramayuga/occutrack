
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersRound } from 'lucide-react';

const OverviewCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-1 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">1,254</span>
            <UsersRound className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">Across all campuses</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OverviewCards;
