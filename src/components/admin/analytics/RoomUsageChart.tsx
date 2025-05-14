
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { RoomUsageData } from '../types/room';

interface RoomUsageChartProps {
  data: RoomUsageData[];
  currentPage: number;
}

const RoomUsageChart: React.FC<RoomUsageChartProps> = ({ data, currentPage }) => {
  // Simplify room names for better display
  const chartData = data.map(room => ({
    name: room.roomName.replace(/Room\s*/i, ''),
    reservations: room.reservations,
    hours: parseFloat(room.utilizationHours.toFixed(1))
  }));

  // Function to determine dynamic margin based on data length
  const getMargin = () => {
    const count = chartData.length;
    if (count <= 3) return { left: 20, right: 20, top: 20, bottom: 20 };
    if (count <= 5) return { left: 20, right: 20, top: 20, bottom: 30 };
    return { left: 20, right: 20, top: 20, bottom: 40 };
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={getMargin()}
        barSize={chartData.length > 6 ? 15 : 30}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          interval={0} 
          angle={chartData.length > 6 ? -45 : 0}
          textAnchor={chartData.length > 6 ? "end" : "middle"}
          height={chartData.length > 6 ? 60 : 30}
        />
        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
        <Tooltip 
          formatter={(value) => [value, '']}
          labelFormatter={(value) => `Room ${value}`}
          contentStyle={{ fontSize: '12px' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        <Bar 
          yAxisId="left" 
          dataKey="reservations" 
          name="Reservations" 
          fill="#8884d8" 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          yAxisId="right" 
          dataKey="hours" 
          name="Usage Hours" 
          fill="#82ca9d" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RoomUsageChart;
