
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { RoomUsageData } from '../types/room';

interface RoomUsageChartProps {
  data: RoomUsageData[];
  currentPage: number;
  onExportData?: () => void;
}

const RoomUsageChart: React.FC<RoomUsageChartProps> = ({ data, currentPage, onExportData }) => {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={{
        utilizationHours: { label: "Hours", color: "#22c55e" },
        reservations: { label: "Reservations", color: "#ef4444" }
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="roomName" 
              angle={-45} 
              textAnchor="end" 
              tick={{ fontSize: 10 }}
              height={60}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#22c55e"
              ticks={[0, 2, 4, 6, 8]} 
              width={30}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#ef4444"
              width={30}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar 
              dataKey="utilizationHours" 
              name="Hours Used" 
              yAxisId="left" 
              fill="var(--color-utilizationHours)" 
            />
            <Bar 
              dataKey="reservations" 
              name="Total Reservations" 
              yAxisId="right" 
              fill="var(--color-reservations)" 
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default RoomUsageChart;
