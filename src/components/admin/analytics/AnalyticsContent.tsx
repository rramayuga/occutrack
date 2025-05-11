
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { RoomAnalyticsData } from '@/lib/types';

interface AnalyticsContentProps {
  isLoading: boolean;
  roomUsageData: RoomAnalyticsData[];
  currentPage: number;
  totalPages: number;
  currentPageData: RoomAnalyticsData[];
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
  handleNextPage,
}) => {
  if (isLoading) {
    return <div className="text-center py-10">Loading analytics data...</div>;
  }

  if (roomUsageData.length === 0) {
    return <div className="text-center py-10">No data available for the selected criteria.</div>;
  }

  // Prepare chart data - limit to top 10 most booked rooms
  const chartData = [...roomUsageData]
    .sort((a, b) => (b.bookingsCount || 0) - (a.bookingsCount || 0))
    .slice(0, 10)
    .map(room => ({
      name: `${room.name}`,
      bookings: room.bookingsCount || 0,
      hours: parseFloat((room.hoursUtilized || 0).toFixed(1)),
    }));

  return (
    <div className="space-y-6">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              tick={{ fontSize: 10 }}
              height={60} 
            />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="bookings"
              name="Total Bookings"
              fill="#8884d8"
            />
            <Bar
              yAxisId="right"
              dataKey="hours"
              name="Hours Utilized"
              fill="#82ca9d"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Hours Used</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageData.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell>{room.buildingName}</TableCell>
                <TableCell>{room.floor}</TableCell>
                <TableCell>{room.type}</TableCell>
                <TableCell className="text-right">{room.bookingsCount || 0}</TableCell>
                <TableCell className="text-right">
                  {room.hoursUtilized ? room.hoursUtilized.toFixed(1) : '0'}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      room.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : room.status === 'occupied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {room.status || 'unknown'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * 10 + 1} to{' '}
          {Math.min(currentPage * 10, roomUsageData.length)} of{' '}
          {roomUsageData.length} rooms
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsContent;
