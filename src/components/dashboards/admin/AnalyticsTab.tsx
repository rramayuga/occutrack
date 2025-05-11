
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { RoomUsageData } from '@/components/admin/types/room';
import { ChartContainer } from '@/components/ui/chart';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const exportToCSV = (data: RoomUsageData[]) => {
  if (!data || data.length === 0) return;
  
  // Define CSV headers
  const headers = [
    'Room Name',
    'Room Type',
    'Status',
    'Building',
    'Floor',
    'Reservations',
    'Utilization Hours',
    'Utilization Rate'
  ].join(',');
  
  // Convert each row to CSV format
  const csvRows = data.map((row) => {
    return [
      `"${row.roomName || ''}"`,
      `"${row.roomType || ''}"`,
      `"${row.status || ''}"`,
      `"${row.buildingName || ''}"`,
      String(row.floor || 0),
      String(row.reservations || 0),
      String(row.utilizationHours || 0),
      `${row.utilizationRate ? (row.utilizationRate * 100).toFixed(2) : 0}%`
    ].join(',');
  });
  
  // Combine headers and rows
  const csvContent = [headers, ...csvRows].join('\n');
  
  // Create a blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `room_usage_data_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface AnalyticsTabProps {
  roomUsageData: RoomUsageData[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ roomUsageData }) => {
  // Preparing data for charts
  const roomTypeData = React.useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    roomUsageData.forEach(room => {
      const type = room.roomType || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [roomUsageData]);

  // Top 5 most utilized rooms
  const topRooms = React.useMemo(() => {
    return [...roomUsageData]
      .sort((a, b) => (b.utilizationRate || 0) - (a.utilizationRate || 0))
      .slice(0, 5)
      .map(room => ({
        name: room.roomName,
        utilization: room.utilizationRate ? Math.round(room.utilizationRate * 100) : 0
      }));
  }, [roomUsageData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Room Analytics</h3>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => exportToCSV(roomUsageData)}
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Room Types Distribution</CardTitle>
            <CardDescription>Distribution of rooms by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roomTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} rooms`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Most Utilized Rooms</CardTitle>
            <CardDescription>Rooms with highest utilization rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="aspect-auto h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topRooms}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Utilization %', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }} 
                  />
                  <Tooltip formatter={(value) => [`${value}%`, 'Utilization Rate']} />
                  <Bar dataKey="utilization" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room Usage Details</CardTitle>
          <CardDescription>Detailed information on room utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Room</th>
                  <th className="text-left py-2 px-4">Type</th>
                  <th className="text-left py-2 px-4">Building</th>
                  <th className="text-left py-2 px-4">Floor</th>
                  <th className="text-left py-2 px-4">Reservations</th>
                  <th className="text-left py-2 px-4">Hours Booked</th>
                  <th className="text-left py-2 px-4">Utilization %</th>
                </tr>
              </thead>
              <tbody>
                {roomUsageData.map((room, idx) => (
                  <tr key={idx} className={idx % 2 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-4">{room.roomName}</td>
                    <td className="py-2 px-4">{room.roomType || 'N/A'}</td>
                    <td className="py-2 px-4">{room.buildingName}</td>
                    <td className="py-2 px-4">{room.floor}</td>
                    <td className="py-2 px-4">{room.reservations}</td>
                    <td className="py-2 px-4">{room.utilizationHours}</td>
                    <td className="py-2 px-4">
                      {room.utilizationRate ? `${(room.utilizationRate * 100).toFixed(1)}%` : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
