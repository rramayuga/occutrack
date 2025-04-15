
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { RoomUsageData } from '../types/room';
import RoomUsageChart from './RoomUsageChart';
import RoomUsageCards from './RoomUsageCards';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface AnalyticsContentProps {
  isLoading: boolean;
  roomUsageData: RoomUsageData[];
  currentPage: number;
  totalPages: number;
  currentPageData: RoomUsageData[];
  handlePreviousPage: () => void;
  handleNextPage: () => void;
}

const AnalyticsContent: React.FC<AnalyticsContentProps> = ({
  isLoading,
  roomUsageData,
  currentPage,
  totalPages,
  currentPageData,
  handlePreviousPage,
  handleNextPage
}) => {
  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-6 w-32 bg-muted rounded mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  if (!roomUsageData.length) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No room usage data available for the selected filters.</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or selecting a different date range.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="h-[400px] w-full">
        <RoomUsageChart data={currentPageData} currentPage={currentPage} />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * 10 + 1, roomUsageData.length)} - {Math.min(currentPage * 10, roomUsageData.length)} of {roomUsageData.length} rooms
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={handlePreviousPage} 
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                onClick={handleNextPage} 
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      
      <div className="mb-8">
        <RoomUsageCards data={currentPageData} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}</p>
            <p>Data is updated in real-time as reservations change.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsContent;
