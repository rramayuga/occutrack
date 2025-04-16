
import React, { useState } from 'react';
import { RoomUsageData } from '../types/room';
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import RoomUsageChart from './RoomUsageChart';
import RoomUsageCards from './RoomUsageCards';

interface RoomAnalyticsLayoutProps {
  isLoading: boolean;
  roomUsageData: RoomUsageData[];
}

const RoomAnalyticsLayout: React.FC<RoomAnalyticsLayoutProps> = ({ 
  isLoading, 
  roomUsageData 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(roomUsageData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = roomUsageData.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

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

  if (roomUsageData.length === 0) {
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
      {/* Chart Container */}
      <div className="bg-background p-4 rounded-lg border mb-12">
        <div className="h-[400px] w-full">
          <RoomUsageChart data={currentPageData} currentPage={currentPage} />
        </div>
      </div>
      
      {/* Room Usage Cards with margin bottom */}
      <div className="mb-8">
        <RoomUsageCards data={currentPageData} />
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1} - {Math.min(endIndex, roomUsageData.length)} of {roomUsageData.length} rooms
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

export default RoomAnalyticsLayout;
